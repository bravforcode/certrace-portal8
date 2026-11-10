-- Read-only protected user/shared-table inventory for a write-frozen database.
-- Run with psql -X -v ON_ERROR_STOP=1 -f this-file.sql "$AUDIT_DATABASE_URL"
-- Save stdout securely as before.tsv / after.tsv; compare the protected tables.
-- Onboarding moves between schemas: this manifest is NOT its semantic audit.
-- The migration assertions and independent decoder rehearsal check onboarding.
-- account_records is excluded because its profile/report rows move or reset.
-- Uses PostgreSQL built-in sha256; no extension or persistent writes required.
-- The audit role must see ALL rows. row_security=off makes filtered access fail
-- instead of silently reporting only the current account's visible records.
-- Same PostgreSQL version and unchanged schema are required for digest comparison.
-- This is a full scan; ordered aggregation uses memory proportional to row count.
\set QUIET on
\set ON_ERROR_STOP on
\pset format unaligned
\pset fieldsep '\t'
\pset tuples_only on
\pset footer off
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL row_security = off;
SET LOCAL timezone = 'UTC';
SET LOCAL datestyle = 'ISO, YMD';
SET LOCAL extra_float_digits = 3;

-- Fail on the wrong database or an older schema; an empty manifest is not proof.
DO $$
DECLARE required_table text;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'public.users', 'public.account_records', 'public.account_files',
    'masterdata.accounts', 'masterdata.account_members',
    'masterdata.organization_versions'
  ] LOOP
    IF to_regclass(required_table) IS NULL THEN
      RAISE EXCEPTION 'Required preservation source missing: %', required_table;
    END IF;
  END LOOP;
END;
$$;

-- A digest includes every column, null, presence bit, ID, timestamp and duplicate
-- row. Only counts and SHA-256 digests leave the database, never raw user fields.
-- Ordering fixed-width row digests removes dependence on physical row order.
SELECT format(
  'SELECT %L AS schema_name, %L AS table_name, count(*) AS row_count, '
  'encode(sha256(convert_to(COALESCE(string_agg(row_digest, '''' ORDER BY row_digest COLLATE "C"), ''''), ''UTF8'')), ''hex'') AS content_sha256 '
  'FROM (SELECT encode(sha256(convert_to(to_jsonb(t)::text, ''UTF8'')), ''hex'') AS row_digest FROM %I.%I AS t) AS hashed_rows;',
  n.nspname, c.relname, n.nspname, c.relname
)
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname IN ('public', 'masterdata')
  AND c.relkind IN ('r', 'p')
  AND NOT c.relispartition
  AND c.relname NOT IN ('_prisma_migrations','account_records')
ORDER BY n.nspname COLLATE "C", c.relname COLLATE "C"
\gexec

ROLLBACK;
