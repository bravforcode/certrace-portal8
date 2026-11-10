-- Replaces form-per-table storage with versioned JSON documents.
-- Old report/verification inputs are intentionally reset. Users and onboarding survive.
-- Deploy together with the compact reporting backend; stop the old backend first.
BEGIN;
SET LOCAL lock_timeout = '30s';
LOCK TABLE public.users, public.account_records, reporting.records,
  reporting.record_heads, reporting.account_profile IN ACCESS EXCLUSIVE MODE;

CREATE TABLE reporting.profile_sources (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('typed', 'legacy')),
  revision integer NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL,
  selected boolean NOT NULL,
  PRIMARY KEY (user_id, source, revision)
);

-- Read the pinned company version, never the latest company head.
-- Presence flags distinguish absent fields from explicit null/false/empty values.
CREATE FUNCTION pg_temp.profile_value(record_id uuid) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE p reporting.account_profile; result jsonb := '{}'; field text;
  container record; answer jsonb; scalar jsonb; row_count integer;
BEGIN
  SELECT count(*) INTO row_count FROM reporting.account_profile WHERE _parent_id=record_id;
  IF row_count <> 1 THEN RAISE EXCEPTION 'Profile % has % roots; migration aborted', record_id, row_count; END IF;
  SELECT * INTO STRICT p FROM reporting.account_profile WHERE _parent_id=record_id;
  IF p._null THEN RETURN 'null'::jsonb; END IF;
  scalar := to_jsonb(p);
  FOR field IN SELECT substr(key,3) FROM jsonb_each(scalar)
    WHERE left(key,2)='p_' AND value='true'::jsonb LOOP
    IF field IN ('companyName','jurisdiction') THEN
      IF p._operator_version_id IS NULL THEN RAISE EXCEPTION 'Profile company version missing'; END IF;
      SELECT CASE field WHEN 'companyName' THEN to_jsonb(name) ELSE to_jsonb(country) END
        INTO answer FROM masterdata.organization_versions WHERE id=p._operator_version_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Profile company version missing'; END IF;
    ELSE
      IF NOT scalar ? ('f_'||field) THEN RAISE EXCEPTION 'Unknown profile field %', field; END IF;
      answer := scalar->('f_'||field);
    END IF;
    result := result || jsonb_build_object(field,answer);
  END LOOP;
  FOREACH field IN ARRAY ARRAY['goalAchieve','currentManagement','biggestChallenge'] LOOP
    FOR container IN EXECUTE format('SELECT _id,_null FROM reporting.%I WHERE _parent_id=$1', 'profile_'||lower(field)) USING p._id LOOP
      IF container._null THEN answer := 'null'::jsonb;
      ELSE
        EXECUTE format('SELECT coalesce(jsonb_agg(f__value ORDER BY _slot::integer),''[]''::jsonb) FROM reporting.%I WHERE _parent_id=$1', 'profile_'||lower(field)||'_items') INTO answer USING container._id;
      END IF;
      IF result ? field THEN RAISE EXCEPTION 'Duplicate profile collection %',field; END IF;
      result := result || jsonb_build_object(field,answer);
    END LOOP;
  END LOOP;
  RETURN result;
END $$;

CREATE TEMP TABLE profile_copy ON COMMIT DROP AS
SELECT r.id,r.user_id,r.key,r.revision,r.updated_at,
  CASE WHEN r.is_null THEN 'null'::jsonb ELSE pg_temp.profile_value(r.id) END AS value,
  h.revision=r.revision AS selected
FROM reporting.records r
LEFT JOIN reporting.record_heads h ON h.user_id=r.user_id AND h.key=r.key
WHERE r.key='certrace:profile';

INSERT INTO reporting.profile_sources
SELECT user_id,'typed',revision,value,updated_at,coalesce(selected,false) FROM profile_copy;
INSERT INTO reporting.profile_sources
SELECT a.user_id,'legacy',a.revision,a.value,a.updated_at,
  NOT EXISTS(SELECT 1 FROM reporting.record_heads h WHERE h.user_id=a.user_id AND h.key=a.key)
FROM public.account_records a WHERE a.key='certrace:profile';

ALTER TABLE reporting.records ADD COLUMN value jsonb NOT NULL DEFAULT 'null'::jsonb;
ALTER TABLE reporting.records DISABLE TRIGGER seal_record;
UPDATE reporting.records r SET value=p.value,is_null=(p.value='null'::jsonb) FROM profile_copy p WHERE p.id=r.id;
-- A legacy-only account keeps its revision, timestamp and complete document.
INSERT INTO reporting.records(user_id,key,revision,is_null,updated_at,sealed,value)
SELECT s.user_id,'certrace:profile',s.revision,s.value='null'::jsonb,s.updated_at,true,s.value
FROM reporting.profile_sources s WHERE source='legacy' AND selected;
INSERT INTO reporting.record_heads(user_id,key,revision)
SELECT user_id,'certrace:profile',revision FROM reporting.profile_sources WHERE source='legacy' AND selected;
ALTER TABLE reporting.records ENABLE TRIGGER seal_record;

-- Fail before deletion if any preserved revision differs or its selection changed.
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM profile_copy p LEFT JOIN reporting.records r ON r.id=p.id
    WHERE r.id IS NULL OR r.value IS DISTINCT FROM p.value OR r.updated_at IS DISTINCT FROM p.updated_at) THEN
    RAISE EXCEPTION 'Typed onboarding preservation failed';
  END IF;
  IF EXISTS(SELECT 1 FROM reporting.profile_sources s
    LEFT JOIN reporting.records r ON r.user_id=s.user_id AND r.key='certrace:profile' AND r.revision=s.revision
    LEFT JOIN reporting.record_heads h ON h.user_id=s.user_id AND h.key='certrace:profile'
    WHERE s.selected AND (r.value IS DISTINCT FROM s.value OR h.revision IS DISTINCT FROM s.revision)) THEN
    RAISE EXCEPTION 'Selected onboarding preservation failed';
  END IF;
END $$;
DELETE FROM public.account_records WHERE key='certrace:profile';

-- User-authorized reset of the old typed report/verification documents.
DELETE FROM reporting.record_heads WHERE key<>'certrace:profile';
DELETE FROM reporting.records WHERE key<>'certrace:profile';
DELETE FROM reporting.migration_receipts WHERE key<>'certrace:profile';
DELETE FROM public.account_records WHERE key IN (
  'certrace:workspaces','certrace:installations','certrace:supplier-companies',
  'certrace:monthly-data','certrace:workspace-mmd-draft','certrace:workspace-mmd-versions',
  'certrace:precursor-suppliers','certrace:precursor-versions','certrace:workspace-evidence',
  'certrace:workspace-drafts','certrace:monthly-requests','certrace:month-submissions',
  'certrace:carbon-price','certrace:report-inputs:v1','certrace:reporting-periods',
  'certrace:annual-production','certrace:pack-signoff','certrace:final-report-snapshot'
) OR starts_with(key,'certrace:report-snapshots:');

-- Drop exactly the old generator's registered payload tables (including profile children).
DO $$ DECLARE tab text; BEGIN
  FOR tab IN SELECT name FROM reporting.storage_tables LOOP
    EXECUTE format('DROP TABLE IF EXISTS reporting.%I CASCADE',tab);
  END LOOP;
END $$;
DROP TABLE reporting.storage_tables;
DROP FUNCTION reporting.guard_sealed_tree();
DROP FUNCTION IF EXISTS masterdata.backfill_node(text,uuid,jsonb);
DROP FUNCTION masterdata.guard_workspace_identity();

-- The existing shared identity API uses these 13 small master tables.
-- Its frozen-workspace lookup now reads the document, with no form-table joins.
CREATE OR REPLACE FUNCTION masterdata.workspace_context(ref text) RETURNS jsonb
LANGUAGE sql STABLE AS $$
SELECT jsonb_build_object('organization',o.external_reference,'installation',i.external_reference,
  'product',p.external_reference,'annualReport',a.id,'frozen',EXISTS(
    SELECT 1 FROM reporting.records r JOIN reporting.record_heads h USING(user_id,key,revision),
      LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(r.value)='array' THEN r.value ELSE '[]'::jsonb END) doc
    WHERE r.user_id=i.account_id AND r.key='certrace:workspaces' AND doc->>'id'=ref
      AND (coalesce(doc->'internalSignoff','null'::jsonb)<>'null'::jsonb OR coalesce(doc->'verifierSignoff','null'::jsonb)<>'null'::jsonb)))
FROM masterdata.workspace_identities w JOIN masterdata.annual_reports a ON a.id=w.annual_report_id
JOIN masterdata.installations i ON i.id=a.installation_id
JOIN masterdata.installation_heads ih ON ih.installation_id=i.id
JOIN masterdata.installation_versions iv ON iv.id=ih.version_id
LEFT JOIN masterdata.organization_versions ov ON ov.id=iv.operator_version_id
LEFT JOIN masterdata.organizations o ON o.id=ov.organization_id
JOIN masterdata.products p ON p.id=w.product_id
WHERE (w.external_reference=ref OR starts_with(ref,w.external_reference||':'))
  AND i.account_id=nullif(current_setting('certrace.user_id',true),'')::uuid
ORDER BY length(w.external_reference) DESC LIMIT 1
$$;

CREATE OR REPLACE FUNCTION reporting.guard_sealed_record() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.sealed OR to_jsonb(NEW)-ARRAY['sealed','value'] <> to_jsonb(OLD)-ARRAY['sealed','value'] THEN
    RAISE EXCEPTION 'Report revisions are immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
ALTER TABLE reporting.records ADD CONSTRAINT record_value_null CHECK (NOT sealed OR is_null=(value='null'::jsonb));
ALTER TABLE reporting.profile_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporting.profile_sources FORCE ROW LEVEL SECURITY;
CREATE POLICY profile_source_owner ON reporting.profile_sources TO certrace_reporting
  USING(user_id=nullif(current_setting('certrace.user_id',true),'')::uuid);
GRANT SELECT ON reporting.profile_sources TO certrace_reporting;
COMMIT;
