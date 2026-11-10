-- Shared, versioned business identities. Generated from reviewed master-data bindings.
BEGIN;
CREATE SCHEMA masterdata;
CREATE TABLE masterdata.accounts(id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE);
CREATE TABLE masterdata.account_members(account_id uuid REFERENCES masterdata.accounts ON DELETE CASCADE,user_id uuid REFERENCES public.users ON DELETE CASCADE,role text NOT NULL CHECK(role IN ('owner','editor','viewer')),PRIMARY KEY(account_id,user_id));
GRANT USAGE ON SCHEMA masterdata TO certrace_reporting;
GRANT SELECT,INSERT ON masterdata.accounts,masterdata.account_members TO certrace_reporting;
ALTER TABLE masterdata.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE masterdata.accounts FORCE ROW LEVEL SECURITY;
CREATE POLICY own_account ON masterdata.accounts TO certrace_reporting USING(id=nullif(current_setting('certrace.user_id',true),'')::uuid);
ALTER TABLE masterdata.account_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE masterdata.account_members FORCE ROW LEVEL SECURITY;
CREATE POLICY own_membership ON masterdata.account_members TO certrace_reporting USING(user_id=nullif(current_setting('certrace.user_id',true),'')::uuid AND account_id=user_id);
CREATE TABLE reporting."account_profile"(_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),_parent_id uuid NOT NULL REFERENCES reporting."records"(id) ON DELETE CASCADE,_slot text NOT NULL,_null boolean NOT NULL DEFAULT false,"f_firstName" text,"p_firstName" boolean NOT NULL DEFAULT false,"f_lastName" text,"p_lastName" boolean NOT NULL DEFAULT false,"f_jobTitle" text,"p_jobTitle" boolean NOT NULL DEFAULT false,"f_companyName" text,"p_companyName" boolean NOT NULL DEFAULT false,"f_sector" text,"p_sector" boolean NOT NULL DEFAULT false,"f_installationId" text,"p_installationId" boolean NOT NULL DEFAULT false,"f_jurisdiction" text,"p_jurisdiction" boolean NOT NULL DEFAULT false,"f_currency" text,"p_currency" boolean NOT NULL DEFAULT false,"f_unit" text,"p_unit" boolean NOT NULL DEFAULT false,"f_cbamProductCount" text,"p_cbamProductCount" boolean NOT NULL DEFAULT false,"f_supplierCount" text,"p_supplierCount" boolean NOT NULL DEFAULT false,"f_installationCount" text,"p_installationCount" boolean NOT NULL DEFAULT false,"f_customerCount" text,"p_customerCount" boolean NOT NULL DEFAULT false,"f_hearAbout" text,"p_hearAbout" boolean NOT NULL DEFAULT false,"f_phone" text,"p_phone" boolean NOT NULL DEFAULT false,"f_lineId" text,"p_lineId" boolean NOT NULL DEFAULT false,"f_onboarded" boolean,"p_onboarded" boolean NOT NULL DEFAULT false,UNIQUE(_parent_id,_slot));
 CREATE INDEX ON reporting."account_profile"(_parent_id);
 INSERT INTO reporting.storage_tables VALUES('account_profile','records');
 GRANT SELECT,INSERT ON reporting."account_profile" TO certrace_reporting;
 ALTER TABLE reporting."account_profile" ENABLE ROW LEVEL SECURITY; ALTER TABLE reporting."account_profile" FORCE ROW LEVEL SECURITY;
 CREATE POLICY parent_access ON reporting."account_profile" TO certrace_reporting USING(EXISTS(SELECT 1 FROM reporting."records" p WHERE p.id="account_profile"._parent_id));
 CREATE TRIGGER immutable_revision BEFORE INSERT ON reporting."account_profile" FOR EACH ROW EXECUTE FUNCTION reporting.guard_sealed_tree('records');
 CREATE TABLE reporting."profile_goalachieve"(_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),_parent_id uuid NOT NULL REFERENCES reporting."account_profile"(_id) ON DELETE CASCADE,_slot text NOT NULL,_null boolean NOT NULL DEFAULT false,UNIQUE(_parent_id,_slot));
 CREATE INDEX ON reporting."profile_goalachieve"(_parent_id);
 INSERT INTO reporting.storage_tables VALUES('profile_goalachieve','account_profile');
 GRANT SELECT,INSERT ON reporting."profile_goalachieve" TO certrace_reporting;
 ALTER TABLE reporting."profile_goalachieve" ENABLE ROW LEVEL SECURITY; ALTER TABLE reporting."profile_goalachieve" FORCE ROW LEVEL SECURITY;
 CREATE POLICY parent_access ON reporting."profile_goalachieve" TO certrace_reporting USING(EXISTS(SELECT 1 FROM reporting."account_profile" p WHERE p._id="profile_goalachieve"._parent_id));
 CREATE TRIGGER immutable_revision BEFORE INSERT ON reporting."profile_goalachieve" FOR EACH ROW EXECUTE FUNCTION reporting.guard_sealed_tree('account_profile');
 CREATE TABLE reporting."profile_goalachieve_items"(_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),_parent_id uuid NOT NULL REFERENCES reporting."profile_goalachieve"(_id) ON DELETE CASCADE,_slot text NOT NULL,_null boolean NOT NULL DEFAULT false,"f__value" text,"p__value" boolean NOT NULL DEFAULT false,UNIQUE(_parent_id,_slot));
 CREATE INDEX ON reporting."profile_goalachieve_items"(_parent_id);
 INSERT INTO reporting.storage_tables VALUES('profile_goalachieve_items','profile_goalachieve');
 GRANT SELECT,INSERT ON reporting."profile_goalachieve_items" TO certrace_reporting;
 ALTER TABLE reporting."profile_goalachieve_items" ENABLE ROW LEVEL SECURITY; ALTER TABLE reporting."profile_goalachieve_items" FORCE ROW LEVEL SECURITY;
 CREATE POLICY parent_access ON reporting."profile_goalachieve_items" TO certrace_reporting USING(EXISTS(SELECT 1 FROM reporting."profile_goalachieve" p WHERE p._id="profile_goalachieve_items"._parent_id));
 CREATE TRIGGER immutable_revision BEFORE INSERT ON reporting."profile_goalachieve_items" FOR EACH ROW EXECUTE FUNCTION reporting.guard_sealed_tree('profile_goalachieve');
 CREATE TABLE reporting."profile_currentmanagement"(_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),_parent_id uuid NOT NULL REFERENCES reporting."account_profile"(_id) ON DELETE CASCADE,_slot text NOT NULL,_null boolean NOT NULL DEFAULT false,UNIQUE(_parent_id,_slot));
 CREATE INDEX ON reporting."profile_currentmanagement"(_parent_id);
 INSERT INTO reporting.storage_tables VALUES('profile_currentmanagement','account_profile');
 GRANT SELECT,INSERT ON reporting."profile_currentmanagement" TO certrace_reporting;
 ALTER TABLE reporting."profile_currentmanagement" ENABLE ROW LEVEL SECURITY; ALTER TABLE reporting."profile_currentmanagement" FORCE ROW LEVEL SECURITY;
 CREATE POLICY parent_access ON reporting."profile_currentmanagement" TO certrace_reporting USING(EXISTS(SELECT 1 FROM reporting."account_profile" p WHERE p._id="profile_currentmanagement"._parent_id));
 CREATE TRIGGER immutable_revision BEFORE INSERT ON reporting."profile_currentmanagement" FOR EACH ROW EXECUTE FUNCTION reporting.guard_sealed_tree('account_profile');
 CREATE TABLE reporting."profile_currentmanagement_items"(_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),_parent_id uuid NOT NULL REFERENCES reporting."profile_currentmanagement"(_id) ON DELETE CASCADE,_slot text NOT NULL,_null boolean NOT NULL DEFAULT false,"f__value" text,"p__value" boolean NOT NULL DEFAULT false,UNIQUE(_parent_id,_slot));
 CREATE INDEX ON reporting."profile_currentmanagement_items"(_parent_id);
 INSERT INTO reporting.storage_tables VALUES('profile_currentmanagement_items','profile_currentmanagement');
 GRANT SELECT,INSERT ON reporting."profile_currentmanagement_items" TO certrace_reporting;
 ALTER TABLE reporting."profile_currentmanagement_items" ENABLE ROW LEVEL SECURITY; ALTER TABLE reporting."profile_currentmanagement_items" FORCE ROW LEVEL SECURITY;
 CREATE POLICY parent_access ON reporting."profile_currentmanagement_items" TO certrace_reporting USING(EXISTS(SELECT 1 FROM reporting."profile_currentmanagement" p WHERE p._id="profile_currentmanagement_items"._parent_id));
 CREATE TRIGGER immutable_revision BEFORE INSERT ON reporting."profile_currentmanagement_items" FOR EACH ROW EXECUTE FUNCTION reporting.guard_sealed_tree('profile_currentmanagement');
 CREATE TABLE reporting."profile_biggestchallenge"(_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),_parent_id uuid NOT NULL REFERENCES reporting."account_profile"(_id) ON DELETE CASCADE,_slot text NOT NULL,_null boolean NOT NULL DEFAULT false,UNIQUE(_parent_id,_slot));
 CREATE INDEX ON reporting."profile_biggestchallenge"(_parent_id);
 INSERT INTO reporting.storage_tables VALUES('profile_biggestchallenge','account_profile');
 GRANT SELECT,INSERT ON reporting."profile_biggestchallenge" TO certrace_reporting;
 ALTER TABLE reporting."profile_biggestchallenge" ENABLE ROW LEVEL SECURITY; ALTER TABLE reporting."profile_biggestchallenge" FORCE ROW LEVEL SECURITY;
 CREATE POLICY parent_access ON reporting."profile_biggestchallenge" TO certrace_reporting USING(EXISTS(SELECT 1 FROM reporting."account_profile" p WHERE p._id="profile_biggestchallenge"._parent_id));
 CREATE TRIGGER immutable_revision BEFORE INSERT ON reporting."profile_biggestchallenge" FOR EACH ROW EXECUTE FUNCTION reporting.guard_sealed_tree('account_profile');
 CREATE TABLE reporting."profile_biggestchallenge_items"(_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),_parent_id uuid NOT NULL REFERENCES reporting."profile_biggestchallenge"(_id) ON DELETE CASCADE,_slot text NOT NULL,_null boolean NOT NULL DEFAULT false,"f__value" text,"p__value" boolean NOT NULL DEFAULT false,UNIQUE(_parent_id,_slot));
 CREATE INDEX ON reporting."profile_biggestchallenge_items"(_parent_id);
 INSERT INTO reporting.storage_tables VALUES('profile_biggestchallenge_items','profile_biggestchallenge');
 GRANT SELECT,INSERT ON reporting."profile_biggestchallenge_items" TO certrace_reporting;
 ALTER TABLE reporting."profile_biggestchallenge_items" ENABLE ROW LEVEL SECURITY; ALTER TABLE reporting."profile_biggestchallenge_items" FORCE ROW LEVEL SECURITY;
 CREATE POLICY parent_access ON reporting."profile_biggestchallenge_items" TO certrace_reporting USING(EXISTS(SELECT 1 FROM reporting."profile_biggestchallenge" p WHERE p._id="profile_biggestchallenge_items"._parent_id));
 CREATE TRIGGER immutable_revision BEFORE INSERT ON reporting."profile_biggestchallenge_items" FOR EACH ROW EXECUTE FUNCTION reporting.guard_sealed_tree('profile_biggestchallenge');
 CREATE TABLE masterdata.organizations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),account_id uuid NOT NULL REFERENCES masterdata.accounts ON DELETE CASCADE,external_reference text NOT NULL CHECK(length(external_reference)>0),UNIQUE(account_id,external_reference));
CREATE TABLE masterdata.organization_versions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organization_id uuid NOT NULL REFERENCES masterdata.organizations ON DELETE CASCADE,version_no integer NOT NULL CHECK(version_no>0),fingerprint text NOT NULL,"name" text,"registration" text,"address" text,"country" text,"contact_name" text,"contact_email" text,"contact_phone" text,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(organization_id,version_no),UNIQUE(organization_id,fingerprint),UNIQUE(organization_id,id));
CREATE TABLE masterdata.organization_heads(organization_id uuid PRIMARY KEY REFERENCES masterdata.organizations ON DELETE CASCADE,version_id uuid NOT NULL,UNIQUE(organization_id,version_id),FOREIGN KEY(organization_id,version_id) REFERENCES masterdata.organization_versions(organization_id,id));
GRANT SELECT,INSERT ON masterdata.organizations,masterdata.organization_versions,masterdata.organization_heads TO certrace_reporting;
GRANT UPDATE(version_id) ON masterdata.organization_heads TO certrace_reporting;
ALTER TABLE masterdata.organizations ENABLE ROW LEVEL SECURITY; ALTER TABLE masterdata.organizations FORCE ROW LEVEL SECURITY;
CREATE POLICY member_access ON masterdata.organizations TO certrace_reporting USING(EXISTS(SELECT 1 FROM masterdata.account_members m WHERE m.account_id=organizations.account_id AND m.role IN ('owner','editor')));
ALTER TABLE masterdata.organization_versions ENABLE ROW LEVEL SECURITY; ALTER TABLE masterdata.organization_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY entity_access ON masterdata.organization_versions TO certrace_reporting USING(EXISTS(SELECT 1 FROM masterdata.organizations e WHERE e.id=organization_versions.organization_id));
ALTER TABLE masterdata.organization_heads ENABLE ROW LEVEL SECURITY; ALTER TABLE masterdata.organization_heads FORCE ROW LEVEL SECURITY;
CREATE POLICY entity_access ON masterdata.organization_heads TO certrace_reporting USING(EXISTS(SELECT 1 FROM masterdata.organizations e WHERE e.id=organization_heads.organization_id));
CREATE TABLE masterdata.installations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),account_id uuid NOT NULL REFERENCES masterdata.accounts ON DELETE CASCADE,external_reference text NOT NULL CHECK(length(external_reference)>0),UNIQUE(account_id,external_reference));
CREATE TABLE masterdata.installation_versions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),installation_id uuid NOT NULL REFERENCES masterdata.installations ON DELETE CASCADE,version_no integer NOT NULL CHECK(version_no>0),fingerprint text NOT NULL,"name" text,"name_local" text,"street" text,"economic_activity" text,"postcode" text,"po_box" text,"city" text,"country" text,"unlocode" text,"latitude" text,"longitude" text,"contact_name" text,"contact_email" text,"contact_phone" text,"registry_id" text,"full_address" text,operator_version_id uuid REFERENCES masterdata.organization_versions DEFERRABLE INITIALLY DEFERRED,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(installation_id,version_no),UNIQUE(installation_id,fingerprint),UNIQUE(installation_id,id));
CREATE TABLE masterdata.installation_heads(installation_id uuid PRIMARY KEY REFERENCES masterdata.installations ON DELETE CASCADE,version_id uuid NOT NULL,UNIQUE(installation_id,version_id),FOREIGN KEY(installation_id,version_id) REFERENCES masterdata.installation_versions(installation_id,id));
GRANT SELECT,INSERT ON masterdata.installations,masterdata.installation_versions,masterdata.installation_heads TO certrace_reporting;
GRANT UPDATE(version_id) ON masterdata.installation_heads TO certrace_reporting;
ALTER TABLE masterdata.installations ENABLE ROW LEVEL SECURITY; ALTER TABLE masterdata.installations FORCE ROW LEVEL SECURITY;
CREATE POLICY member_access ON masterdata.installations TO certrace_reporting USING(EXISTS(SELECT 1 FROM masterdata.account_members m WHERE m.account_id=installations.account_id AND m.role IN ('owner','editor')));
ALTER TABLE masterdata.installation_versions ENABLE ROW LEVEL SECURITY; ALTER TABLE masterdata.installation_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY entity_access ON masterdata.installation_versions TO certrace_reporting USING(EXISTS(SELECT 1 FROM masterdata.installations e WHERE e.id=installation_versions.installation_id));
ALTER TABLE masterdata.installation_heads ENABLE ROW LEVEL SECURITY; ALTER TABLE masterdata.installation_heads FORCE ROW LEVEL SECURITY;
CREATE POLICY entity_access ON masterdata.installation_heads TO certrace_reporting USING(EXISTS(SELECT 1 FROM masterdata.installations e WHERE e.id=installation_heads.installation_id));
CREATE TABLE masterdata.products(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),account_id uuid NOT NULL REFERENCES masterdata.accounts ON DELETE CASCADE,external_reference text NOT NULL CHECK(length(external_reference)>0),UNIQUE(account_id,external_reference));
CREATE TABLE masterdata.product_versions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),product_id uuid NOT NULL REFERENCES masterdata.products ON DELETE CASCADE,version_no integer NOT NULL CHECK(version_no>0),fingerprint text NOT NULL,"name" text,"cn_code" text,"description" text,"unit" text,"benchmark" text,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(product_id,version_no),UNIQUE(product_id,fingerprint),UNIQUE(product_id,id));
CREATE TABLE masterdata.product_heads(product_id uuid PRIMARY KEY REFERENCES masterdata.products ON DELETE CASCADE,version_id uuid NOT NULL,UNIQUE(product_id,version_id),FOREIGN KEY(product_id,version_id) REFERENCES masterdata.product_versions(product_id,id));
GRANT SELECT,INSERT ON masterdata.products,masterdata.product_versions,masterdata.product_heads TO certrace_reporting;
GRANT UPDATE(version_id) ON masterdata.product_heads TO certrace_reporting;
ALTER TABLE masterdata.products ENABLE ROW LEVEL SECURITY; ALTER TABLE masterdata.products FORCE ROW LEVEL SECURITY;
CREATE POLICY member_access ON masterdata.products TO certrace_reporting USING(EXISTS(SELECT 1 FROM masterdata.account_members m WHERE m.account_id=products.account_id AND m.role IN ('owner','editor')));
ALTER TABLE masterdata.product_versions ENABLE ROW LEVEL SECURITY; ALTER TABLE masterdata.product_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY entity_access ON masterdata.product_versions TO certrace_reporting USING(EXISTS(SELECT 1 FROM masterdata.products e WHERE e.id=product_versions.product_id));
ALTER TABLE masterdata.product_heads ENABLE ROW LEVEL SECURITY; ALTER TABLE masterdata.product_heads FORCE ROW LEVEL SECURITY;
CREATE POLICY entity_access ON masterdata.product_heads TO certrace_reporting USING(EXISTS(SELECT 1 FROM masterdata.products e WHERE e.id=product_heads.product_id));
CREATE TABLE masterdata.annual_reports(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),installation_id uuid NOT NULL REFERENCES masterdata.installations ON DELETE CASCADE,reporting_year integer NOT NULL CHECK(reporting_year BETWEEN 2000 AND 2200),UNIQUE(installation_id,reporting_year));
CREATE TABLE masterdata.workspace_identities(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),annual_report_id uuid NOT NULL REFERENCES masterdata.annual_reports ON DELETE CASCADE,product_id uuid NOT NULL REFERENCES masterdata.products DEFERRABLE INITIALLY DEFERRED,external_reference text NOT NULL,UNIQUE(annual_report_id,external_reference));
GRANT SELECT,INSERT ON masterdata.annual_reports,masterdata.workspace_identities TO certrace_reporting;
ALTER TABLE masterdata.annual_reports ENABLE ROW LEVEL SECURITY; ALTER TABLE masterdata.annual_reports FORCE ROW LEVEL SECURITY;
CREATE POLICY installation_access ON masterdata.annual_reports TO certrace_reporting USING(EXISTS(SELECT 1 FROM masterdata.installations i WHERE i.id=annual_reports.installation_id));
ALTER TABLE masterdata.workspace_identities ENABLE ROW LEVEL SECURITY; ALTER TABLE masterdata.workspace_identities FORCE ROW LEVEL SECURITY;
CREATE POLICY report_access ON masterdata.workspace_identities TO certrace_reporting USING(EXISTS(SELECT 1 FROM masterdata.annual_reports r WHERE r.id=workspace_identities.annual_report_id));
CREATE FUNCTION masterdata.reject_version_change() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Master versions are immutable; create a new version' USING ERRCODE='23514'; END $$;
CREATE TRIGGER immutable_master BEFORE UPDATE ON masterdata.organization_versions FOR EACH ROW EXECUTE FUNCTION masterdata.reject_version_change();
CREATE TRIGGER immutable_master BEFORE UPDATE ON masterdata.installation_versions FOR EACH ROW EXECUTE FUNCTION masterdata.reject_version_change();
CREATE TRIGGER immutable_master BEFORE UPDATE ON masterdata.product_versions FOR EACH ROW EXECUTE FUNCTION masterdata.reject_version_change();
CREATE FUNCTION masterdata.resolve_version(kind text, ref text, fields jsonb, publish boolean DEFAULT true) RETURNS uuid LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE owner uuid:=nullif(current_setting('certrace.user_id',true),'')::uuid; entity uuid; version uuid; previous jsonb:='{}'; data jsonb; digest text; n integer;
BEGIN
 IF owner IS NULL OR kind NOT IN ('organization','installation','product') OR coalesce(ref,'')='' THEN RAISE EXCEPTION 'Invalid master identity'; END IF;
 INSERT INTO masterdata.accounts(id) VALUES(owner) ON CONFLICT DO NOTHING;
 INSERT INTO masterdata.account_members VALUES(owner,owner,'owner') ON CONFLICT DO NOTHING;
 CASE kind
WHEN 'organization' THEN
 INSERT INTO masterdata.organizations(account_id,external_reference) VALUES(owner,ref) ON CONFLICT DO NOTHING;
 SELECT id INTO entity FROM masterdata.organizations WHERE account_id=owner AND external_reference=ref;
 SELECT to_jsonb(v) INTO previous FROM masterdata.organization_heads h JOIN masterdata.organization_versions v ON v.id=h.version_id WHERE h.organization_id=entity;
 data:=jsonb_build_object('name',CASE WHEN fields ? 'name' THEN fields->'name' ELSE coalesce(previous,'{}')->'name' END,'registration',CASE WHEN fields ? 'registration' THEN fields->'registration' ELSE coalesce(previous,'{}')->'registration' END,'address',CASE WHEN fields ? 'address' THEN fields->'address' ELSE coalesce(previous,'{}')->'address' END,'country',CASE WHEN fields ? 'country' THEN fields->'country' ELSE coalesce(previous,'{}')->'country' END,'contact_name',CASE WHEN fields ? 'contact_name' THEN fields->'contact_name' ELSE coalesce(previous,'{}')->'contact_name' END,'contact_email',CASE WHEN fields ? 'contact_email' THEN fields->'contact_email' ELSE coalesce(previous,'{}')->'contact_email' END,'contact_phone',CASE WHEN fields ? 'contact_phone' THEN fields->'contact_phone' ELSE coalesce(previous,'{}')->'contact_phone' END);
 digest:=encode(sha256(convert_to(data::text,'UTF8')),'hex');
 SELECT id INTO version FROM masterdata.organization_versions WHERE organization_id=entity AND fingerprint=digest;
 IF version IS NULL THEN
 SELECT coalesce(max(version_no),0)+1 INTO n FROM masterdata.organization_versions WHERE organization_id=entity;
 INSERT INTO masterdata.organization_versions(organization_id,version_no,fingerprint,"name","registration","address","country","contact_name","contact_email","contact_phone") VALUES(entity,n,digest,(data->>'name'),(data->>'registration'),(data->>'address'),(data->>'country'),(data->>'contact_name'),(data->>'contact_email'),(data->>'contact_phone')) RETURNING id INTO version;
 END IF;
 IF publish THEN INSERT INTO masterdata.organization_heads VALUES(entity,version) ON CONFLICT(organization_id) DO UPDATE SET version_id=EXCLUDED.version_id; END IF;
WHEN 'installation' THEN
 INSERT INTO masterdata.installations(account_id,external_reference) VALUES(owner,ref) ON CONFLICT DO NOTHING;
 SELECT id INTO entity FROM masterdata.installations WHERE account_id=owner AND external_reference=ref;
 SELECT to_jsonb(v) INTO previous FROM masterdata.installation_heads h JOIN masterdata.installation_versions v ON v.id=h.version_id WHERE h.installation_id=entity;
 data:=jsonb_build_object('name',CASE WHEN fields ? 'name' THEN fields->'name' ELSE coalesce(previous,'{}')->'name' END,'name_local',CASE WHEN fields ? 'name_local' THEN fields->'name_local' ELSE coalesce(previous,'{}')->'name_local' END,'street',CASE WHEN fields ? 'street' THEN fields->'street' ELSE coalesce(previous,'{}')->'street' END,'economic_activity',CASE WHEN fields ? 'economic_activity' THEN fields->'economic_activity' ELSE coalesce(previous,'{}')->'economic_activity' END,'postcode',CASE WHEN fields ? 'postcode' THEN fields->'postcode' ELSE coalesce(previous,'{}')->'postcode' END,'po_box',CASE WHEN fields ? 'po_box' THEN fields->'po_box' ELSE coalesce(previous,'{}')->'po_box' END,'city',CASE WHEN fields ? 'city' THEN fields->'city' ELSE coalesce(previous,'{}')->'city' END,'country',CASE WHEN fields ? 'country' THEN fields->'country' ELSE coalesce(previous,'{}')->'country' END,'unlocode',CASE WHEN fields ? 'unlocode' THEN fields->'unlocode' ELSE coalesce(previous,'{}')->'unlocode' END,'latitude',CASE WHEN fields ? 'latitude' THEN fields->'latitude' ELSE coalesce(previous,'{}')->'latitude' END,'longitude',CASE WHEN fields ? 'longitude' THEN fields->'longitude' ELSE coalesce(previous,'{}')->'longitude' END,'contact_name',CASE WHEN fields ? 'contact_name' THEN fields->'contact_name' ELSE coalesce(previous,'{}')->'contact_name' END,'contact_email',CASE WHEN fields ? 'contact_email' THEN fields->'contact_email' ELSE coalesce(previous,'{}')->'contact_email' END,'contact_phone',CASE WHEN fields ? 'contact_phone' THEN fields->'contact_phone' ELSE coalesce(previous,'{}')->'contact_phone' END,'registry_id',CASE WHEN fields ? 'registry_id' THEN fields->'registry_id' ELSE coalesce(previous,'{}')->'registry_id' END,'full_address',CASE WHEN fields ? 'full_address' THEN fields->'full_address' ELSE coalesce(previous,'{}')->'full_address' END,'operator_version_id',CASE WHEN fields ? 'operator_version_id' THEN fields->'operator_version_id' ELSE coalesce(previous,'{}')->'operator_version_id' END);
 digest:=encode(sha256(convert_to(data::text,'UTF8')),'hex');
 SELECT id INTO version FROM masterdata.installation_versions WHERE installation_id=entity AND fingerprint=digest;
 IF version IS NULL THEN
 SELECT coalesce(max(version_no),0)+1 INTO n FROM masterdata.installation_versions WHERE installation_id=entity;
 INSERT INTO masterdata.installation_versions(installation_id,version_no,fingerprint,"name","name_local","street","economic_activity","postcode","po_box","city","country","unlocode","latitude","longitude","contact_name","contact_email","contact_phone","registry_id","full_address","operator_version_id") VALUES(entity,n,digest,(data->>'name'),(data->>'name_local'),(data->>'street'),(data->>'economic_activity'),(data->>'postcode'),(data->>'po_box'),(data->>'city'),(data->>'country'),(data->>'unlocode'),(data->>'latitude'),(data->>'longitude'),(data->>'contact_name'),(data->>'contact_email'),(data->>'contact_phone'),(data->>'registry_id'),(data->>'full_address'),(data->>'operator_version_id')::uuid) RETURNING id INTO version;
 END IF;
 IF publish THEN INSERT INTO masterdata.installation_heads VALUES(entity,version) ON CONFLICT(installation_id) DO UPDATE SET version_id=EXCLUDED.version_id; END IF;
WHEN 'product' THEN
 INSERT INTO masterdata.products(account_id,external_reference) VALUES(owner,ref) ON CONFLICT DO NOTHING;
 SELECT id INTO entity FROM masterdata.products WHERE account_id=owner AND external_reference=ref;
 SELECT to_jsonb(v) INTO previous FROM masterdata.product_heads h JOIN masterdata.product_versions v ON v.id=h.version_id WHERE h.product_id=entity;
 data:=jsonb_build_object('name',CASE WHEN fields ? 'name' THEN fields->'name' ELSE coalesce(previous,'{}')->'name' END,'cn_code',CASE WHEN fields ? 'cn_code' THEN fields->'cn_code' ELSE coalesce(previous,'{}')->'cn_code' END,'description',CASE WHEN fields ? 'description' THEN fields->'description' ELSE coalesce(previous,'{}')->'description' END,'unit',CASE WHEN fields ? 'unit' THEN fields->'unit' ELSE coalesce(previous,'{}')->'unit' END,'benchmark',CASE WHEN fields ? 'benchmark' THEN fields->'benchmark' ELSE coalesce(previous,'{}')->'benchmark' END);
 digest:=encode(sha256(convert_to(data::text,'UTF8')),'hex');
 SELECT id INTO version FROM masterdata.product_versions WHERE product_id=entity AND fingerprint=digest;
 IF version IS NULL THEN
 SELECT coalesce(max(version_no),0)+1 INTO n FROM masterdata.product_versions WHERE product_id=entity;
 INSERT INTO masterdata.product_versions(product_id,version_no,fingerprint,"name","cn_code","description","unit","benchmark") VALUES(entity,n,digest,(data->>'name'),(data->>'cn_code'),(data->>'description'),(data->>'unit'),(data->>'benchmark')) RETURNING id INTO version;
 END IF;
 IF publish THEN INSERT INTO masterdata.product_heads VALUES(entity,version) ON CONFLICT(product_id) DO UPDATE SET version_id=EXCLUDED.version_id; END IF;
END CASE; RETURN version; END $$;
CREATE FUNCTION masterdata.workspace_context(ref text) RETURNS jsonb LANGUAGE sql STABLE AS $$
 SELECT jsonb_build_object('organization',o.external_reference,'installation',i.external_reference,'product',p.external_reference,'annualReport',a.id,'frozen',EXISTS(SELECT 1 FROM reporting.workspace_profiles wp JOIN reporting.workspaces wr ON wr._id=wp._parent_id JOIN reporting.records rr ON rr.id=wr._parent_id JOIN reporting.record_heads rh ON rh.user_id=rr.user_id AND rh.key=rr.key AND rh.revision=rr.revision WHERE rr.user_id=i.account_id AND wp.f_id=ref AND (EXISTS(SELECT 1 FROM reporting.workspaces_rows_internal_signoff si WHERE si._parent_id=wp._id AND NOT si._null) OR EXISTS(SELECT 1 FROM reporting.workspaces_rows_verifier_signoff sv WHERE sv._parent_id=wp._id AND NOT sv._null))))
 FROM masterdata.workspace_identities w JOIN masterdata.annual_reports a ON a.id=w.annual_report_id
 JOIN masterdata.installations i ON i.id=a.installation_id JOIN masterdata.installation_heads ih ON ih.installation_id=i.id
 JOIN masterdata.installation_versions iv ON iv.id=ih.version_id
 LEFT JOIN masterdata.organization_versions ov ON ov.id=iv.operator_version_id LEFT JOIN masterdata.organizations o ON o.id=ov.organization_id
 JOIN masterdata.products p ON p.id=w.product_id
 WHERE (w.external_reference=ref OR starts_with(ref,w.external_reference||':')) AND i.account_id=nullif(current_setting('certrace.user_id',true),'')::uuid ORDER BY length(w.external_reference) DESC LIMIT 1
$$;
CREATE FUNCTION masterdata.bind_row(tab text,v jsonb,ctx jsonb) RETURNS jsonb LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE result jsonb:='{}'; scope text:=coalesce(ctx->>'scope',''); ws jsonb; orgref text; instref text; prodref text; ref text; fields jsonb; version uuid; orgversion uuid; instversion uuid; prodversion uuid; annual uuid; wid uuid; pub boolean:=coalesce((ctx->>'publish')::boolean,true); operator_ref text;
BEGIN
 IF tab='workspace_profiles' AND (coalesce(v->'internalSignoff','null'::jsonb)<>'null'::jsonb OR coalesce(v->'verifierSignoff','null'::jsonb)<>'null'::jsonb) THEN pub:=false; END IF;
 ws:=masterdata.workspace_context(scope);
 IF coalesce((ws->>'frozen')::boolean,false) THEN pub:=false; END IF;
 orgref:=coalesce(ws->>'organization','workspace:'||scope);
 instref:=coalesce(ws->>'installation','workspace:'||scope);
 prodref:=ws->>'product';
 IF scope LIKE 'company:%' THEN orgref:=CASE WHEN scope='company:self' THEN 'self' ELSE 'supplier:'||substr(scope,9) END; END IF;
 IF tab='account_profile' THEN orgref:='self';
 ELSIF tab='workspace_profiles' THEN
 orgref:=CASE WHEN coalesce((v->>'selfSupplied')::boolean,false) THEN 'self' WHEN coalesce(v->>'supplierId','')<>'' THEN 'supplier:'||(v->>'supplierId') ELSE 'unassigned:'||(v->>'installationId') END;
 instref:=v->>'installationId'; prodref:='catalog:'||(v->>'productId');
 ELSIF tab='installation_profiles' OR (tab='precursor_versions_rows_rows_snapshot' AND NOT(v ? 'workspaceId')) THEN
 orgref:=CASE WHEN coalesce((v->>'self')::boolean,false) THEN 'self' WHEN coalesce(v->>'supplierId','')<>'' THEN 'supplier:'||(v->>'supplierId') ELSE 'unassigned:'||(v->>'id') END; instref:=v->>'id';
 ELSIF tab='supplier_company_profiles' THEN orgref:='supplier:'||(v->>'id');
 ELSIF tab='precursor_sources' OR (tab='precursor_versions_rows_rows_snapshot' AND v ? 'workspaceId') THEN
 orgref:=CASE WHEN coalesce(v->>'supplierCompanyId','')<>'' THEN 'supplier:'||(v->>'supplierCompanyId') ELSE 'precursor:'||coalesce(v->>'workspaceId',scope)||':'||(v->>'id') END;
 instref:=CASE WHEN coalesce(v->>'installationUniqueId','')<>'' THEN v->>'installationUniqueId' ELSE orgref||':plant' END;
 prodref:=CASE WHEN coalesce(v->>'catalogProductId','')<>'' THEN 'catalog:'||(v->>'catalogProductId') ELSE 'precursor:'||coalesce(v->>'workspaceId',scope)||':'||(v->>'id') END;
 END IF;
 CASE tab
WHEN 'workspace_profiles' THEN
IF true THEN
 fields:='{}';
 IF v ? 'supplierName' THEN fields:=fields||jsonb_build_object('name',v->'supplierName'); END IF;
 ref:=orgref;
 
 version:=masterdata.resolve_version('organization',ref,fields,pub);
 orgversion:=version;
 
 END IF;
 IF true THEN
 fields:='{}';
 IF v ? 'installationName' THEN fields:=fields||jsonb_build_object('name',v->'installationName'); END IF;
 ref:=instref;
 IF orgversion IS NULL THEN orgversion:=masterdata.resolve_version('organization',orgref,'{}',pub); END IF; fields:=fields||jsonb_build_object('operator_version_id',orgversion);
 version:=masterdata.resolve_version('installation',ref,fields,pub);
 instversion:=version;
 result:=result||jsonb_build_object('_installation_version_id',version);
 END IF;
 IF true THEN
 fields:='{}';
 IF v ? 'productName' THEN fields:=fields||jsonb_build_object('name',v->'productName'); END IF;
IF v ? 'cnCode' THEN fields:=fields||jsonb_build_object('cn_code',v->'cnCode'); END IF;
 ref:=prodref;
 
 version:=masterdata.resolve_version('product',ref,fields,pub);
 prodversion:=version;
 result:=result||jsonb_build_object('_product_version_id',version);
 END IF;
 
 INSERT INTO masterdata.annual_reports(installation_id,reporting_year) SELECT installation_id,(v->>'year')::integer FROM masterdata.installation_versions WHERE id=instversion ON CONFLICT DO NOTHING;
 SELECT a.id INTO annual FROM masterdata.annual_reports a JOIN masterdata.installation_versions iv ON iv.installation_id=a.installation_id WHERE iv.id=instversion AND a.reporting_year=(v->>'year')::integer;
 SELECT w.id INTO wid FROM masterdata.workspace_identities w JOIN masterdata.annual_reports a ON a.id=w.annual_report_id JOIN masterdata.installations i ON i.id=a.installation_id WHERE w.external_reference=v->>'id' AND i.account_id=nullif(current_setting('certrace.user_id',true),'')::uuid;
 IF wid IS NOT NULL AND NOT EXISTS(SELECT 1 FROM masterdata.workspace_identities w JOIN masterdata.product_versions p ON p.product_id=w.product_id WHERE w.id=wid AND w.annual_report_id=annual AND p.id=prodversion) THEN RAISE EXCEPTION 'Workspace installation, product and year are immutable; create a new report' USING ERRCODE='23514'; END IF;
 IF wid IS NULL THEN INSERT INTO masterdata.workspace_identities(annual_report_id,product_id,external_reference) SELECT annual,product_id,v->>'id' FROM masterdata.product_versions WHERE id=prodversion RETURNING id INTO wid; END IF;
 result:=result||jsonb_build_object('_workspace_identity_id',wid);
 WHEN 'installation_profiles' THEN
IF true THEN
 fields:='{}';
 IF v ? 'name' THEN fields:=fields||jsonb_build_object('name',v->'name'); END IF;
IF v ? 'nameLocal' THEN fields:=fields||jsonb_build_object('name_local',v->'nameLocal'); END IF;
IF v ? 'street' THEN fields:=fields||jsonb_build_object('street',v->'street'); END IF;
IF v ? 'economicActivity' THEN fields:=fields||jsonb_build_object('economic_activity',v->'economicActivity'); END IF;
IF v ? 'postcode' THEN fields:=fields||jsonb_build_object('postcode',v->'postcode'); END IF;
IF v ? 'poBox' THEN fields:=fields||jsonb_build_object('po_box',v->'poBox'); END IF;
IF v ? 'city' THEN fields:=fields||jsonb_build_object('city',v->'city'); END IF;
IF v ? 'country' THEN fields:=fields||jsonb_build_object('country',v->'country'); END IF;
IF v ? 'unlocode' THEN fields:=fields||jsonb_build_object('unlocode',v->'unlocode'); END IF;
IF v ? 'lat' THEN fields:=fields||jsonb_build_object('latitude',v->'lat'); END IF;
IF v ? 'lng' THEN fields:=fields||jsonb_build_object('longitude',v->'lng'); END IF;
IF v ? 'contactName' THEN fields:=fields||jsonb_build_object('contact_name',v->'contactName'); END IF;
IF v ? 'contactEmail' THEN fields:=fields||jsonb_build_object('contact_email',v->'contactEmail'); END IF;
IF v ? 'contactPhone' THEN fields:=fields||jsonb_build_object('contact_phone',v->'contactPhone'); END IF;
 ref:=instref;
 IF orgversion IS NULL THEN orgversion:=masterdata.resolve_version('organization',orgref,'{}',pub); END IF; fields:=fields||jsonb_build_object('operator_version_id',orgversion);
 version:=masterdata.resolve_version('installation',ref,fields,pub);
 instversion:=version;
 result:=result||jsonb_build_object('_installation_version_id',version);
 END IF;
 WHEN 'supplier_company_profiles' THEN
IF true THEN
 fields:='{}';
 IF v ? 'name' THEN fields:=fields||jsonb_build_object('name',v->'name'); END IF;
IF v ? 'country' THEN fields:=fields||jsonb_build_object('country',v->'country'); END IF;
IF v ? 'contactName' THEN fields:=fields||jsonb_build_object('contact_name',v->'contactName'); END IF;
IF v ? 'contactEmail' THEN fields:=fields||jsonb_build_object('contact_email',v->'contactEmail'); END IF;
IF v ? 'contactPhone' THEN fields:=fields||jsonb_build_object('contact_phone',v->'contactPhone'); END IF;
 ref:=orgref;
 
 version:=masterdata.resolve_version('organization',ref,fields,pub);
 orgversion:=version;
 result:=result||jsonb_build_object('_operator_version_id',version);
 END IF;
 WHEN 'operator_reporting_plans' THEN
IF true THEN
 fields:='{}';
 IF v ? 'operatorName' THEN fields:=fields||jsonb_build_object('name',v->'operatorName'); END IF;
IF v ? 'operatorRegistration' THEN fields:=fields||jsonb_build_object('registration',v->'operatorRegistration'); END IF;
IF v ? 'operatorAddress' THEN fields:=fields||jsonb_build_object('address',v->'operatorAddress'); END IF;
 ref:=orgref;
 
 version:=masterdata.resolve_version('organization',ref,fields,pub);
 orgversion:=version;
 
 END IF;
 IF true THEN
 fields:='{}';
 IF v ? 'registryId' THEN fields:=fields||jsonb_build_object('registry_id',v->'registryId'); END IF;
 ref:=instref;
 IF orgversion IS NULL THEN orgversion:=masterdata.resolve_version('organization',orgref,'{}',pub); END IF; fields:=fields||jsonb_build_object('operator_version_id',orgversion);
 version:=masterdata.resolve_version('installation',ref,fields,pub);
 instversion:=version;
 result:=result||jsonb_build_object('_installation_version_id',version);
 END IF;
 WHEN 'report_goods' THEN
IF true THEN
 fields:='{}';
 IF v ? 'name' THEN fields:=fields||jsonb_build_object('name',v->'name'); END IF;
IF v ? 'cnCode' THEN fields:=fields||jsonb_build_object('cn_code',v->'cnCode'); END IF;
IF v ? 'description' THEN fields:=fields||jsonb_build_object('description',v->'description'); END IF;
IF v ? 'unit' THEN fields:=fields||jsonb_build_object('unit',v->'unit'); END IF;
IF v ? 'benchmark' THEN fields:=fields||jsonb_build_object('benchmark',v->'benchmark'); END IF;
 ref:=CASE WHEN v->>'id'=scope||':product:0' AND prodref IS NOT NULL THEN prodref ELSE 'good:'||scope||':'||(v->>'id') END;
 
 version:=masterdata.resolve_version('product',ref,fields,pub);
 prodversion:=version;
 result:=result||jsonb_build_object('_product_version_id',version);
 END IF;
 WHEN 'workspace_mmd_versions_rows_rows_content_input_plan' THEN
IF true THEN
 fields:='{}';
 IF v ? 'operatorName' THEN fields:=fields||jsonb_build_object('name',v->'operatorName'); END IF;
IF v ? 'operatorRegistration' THEN fields:=fields||jsonb_build_object('registration',v->'operatorRegistration'); END IF;
IF v ? 'operatorAddress' THEN fields:=fields||jsonb_build_object('address',v->'operatorAddress'); END IF;
 ref:=orgref;
 
 version:=masterdata.resolve_version('organization',ref,fields,pub);
 orgversion:=version;
 
 END IF;
 IF true THEN
 fields:='{}';
 IF v ? 'registryId' THEN fields:=fields||jsonb_build_object('registry_id',v->'registryId'); END IF;
 ref:=instref;
 IF orgversion IS NULL THEN orgversion:=masterdata.resolve_version('organization',orgref,'{}',pub); END IF; fields:=fields||jsonb_build_object('operator_version_id',orgversion);
 version:=masterdata.resolve_version('installation',ref,fields,pub);
 instversion:=version;
 result:=result||jsonb_build_object('_installation_version_id',version);
 END IF;
 WHEN 'workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb' THEN
IF true THEN
 fields:='{}';
 IF v ? 'name' THEN fields:=fields||jsonb_build_object('name',v->'name'); END IF;
IF v ? 'cnCode' THEN fields:=fields||jsonb_build_object('cn_code',v->'cnCode'); END IF;
IF v ? 'description' THEN fields:=fields||jsonb_build_object('description',v->'description'); END IF;
IF v ? 'unit' THEN fields:=fields||jsonb_build_object('unit',v->'unit'); END IF;
IF v ? 'benchmark' THEN fields:=fields||jsonb_build_object('benchmark',v->'benchmark'); END IF;
 ref:=CASE WHEN v->>'id'=scope||':product:0' AND prodref IS NOT NULL THEN prodref ELSE 'good:'||scope||':'||(v->>'id') END;
 
 version:=masterdata.resolve_version('product',ref,fields,pub);
 prodversion:=version;
 result:=result||jsonb_build_object('_product_version_id',version);
 END IF;
 WHEN 'precursor_sources' THEN
IF true THEN
 fields:='{}';
 IF v ? 'name' THEN fields:=fields||jsonb_build_object('name',v->'name'); END IF;
IF v ? 'contactName' THEN fields:=fields||jsonb_build_object('contact_name',v->'contactName'); END IF;
IF v ? 'contactEmail' THEN fields:=fields||jsonb_build_object('contact_email',v->'contactEmail'); END IF;
IF v ? 'contactPhone' THEN fields:=fields||jsonb_build_object('contact_phone',v->'contactPhone'); END IF;
 ref:=orgref;
 
 version:=masterdata.resolve_version('organization',ref,fields,pub);
 orgversion:=version;
 result:=result||jsonb_build_object('_producer_version_id',version);
 END IF;
 IF true THEN
 fields:='{}';
 IF v ? 'installationName' THEN fields:=fields||jsonb_build_object('name',v->'installationName'); END IF;
IF v ? 'country' THEN fields:=fields||jsonb_build_object('country',v->'country'); END IF;
IF v ? 'unlocode' THEN fields:=fields||jsonb_build_object('unlocode',v->'unlocode'); END IF;
IF v ? 'latitude' THEN fields:=fields||jsonb_build_object('latitude',v->'latitude'); END IF;
IF v ? 'longitude' THEN fields:=fields||jsonb_build_object('longitude',v->'longitude'); END IF;
IF v ? 'fullAddress' THEN fields:=fields||jsonb_build_object('full_address',v->'fullAddress'); END IF;
 ref:=instref;
 IF orgversion IS NULL THEN orgversion:=masterdata.resolve_version('organization',orgref,'{}',pub); END IF; fields:=fields||jsonb_build_object('operator_version_id',orgversion);
 version:=masterdata.resolve_version('installation',ref,fields,pub);
 instversion:=version;
 result:=result||jsonb_build_object('_producer_installation_version_id',version);
 END IF;
 IF true THEN
 fields:='{}';
 IF v ? 'precursorName' THEN fields:=fields||jsonb_build_object('name',v->'precursorName'); END IF;
IF v ? 'cnCode' THEN fields:=fields||jsonb_build_object('cn_code',v->'cnCode'); END IF;
 ref:=prodref;
 
 version:=masterdata.resolve_version('product',ref,fields,pub);
 prodversion:=version;
 result:=result||jsonb_build_object('_precursor_product_version_id',version);
 END IF;
 WHEN 'precursor_versions_rows_rows_snapshot' THEN
IF v ? 'workspaceId' THEN
 fields:='{}';
 IF v ? 'name' THEN fields:=fields||jsonb_build_object('name',v->'name'); END IF;
IF v ? 'contactName' THEN fields:=fields||jsonb_build_object('contact_name',v->'contactName'); END IF;
IF v ? 'contactEmail' THEN fields:=fields||jsonb_build_object('contact_email',v->'contactEmail'); END IF;
IF v ? 'contactPhone' THEN fields:=fields||jsonb_build_object('contact_phone',v->'contactPhone'); END IF;
 ref:=orgref;
 
 version:=masterdata.resolve_version('organization',ref,fields,pub);
 orgversion:=version;
 result:=result||jsonb_build_object('_producer_version_id',version);
 END IF;
 IF v ? 'workspaceId' THEN
 fields:='{}';
 IF v ? 'installationName' THEN fields:=fields||jsonb_build_object('name',v->'installationName'); END IF;
IF v ? 'country' THEN fields:=fields||jsonb_build_object('country',v->'country'); END IF;
IF v ? 'unlocode' THEN fields:=fields||jsonb_build_object('unlocode',v->'unlocode'); END IF;
IF v ? 'latitude' THEN fields:=fields||jsonb_build_object('latitude',v->'latitude'); END IF;
IF v ? 'longitude' THEN fields:=fields||jsonb_build_object('longitude',v->'longitude'); END IF;
IF v ? 'fullAddress' THEN fields:=fields||jsonb_build_object('full_address',v->'fullAddress'); END IF;
 ref:=instref;
 IF orgversion IS NULL THEN orgversion:=masterdata.resolve_version('organization',orgref,'{}',pub); END IF; fields:=fields||jsonb_build_object('operator_version_id',orgversion);
 version:=masterdata.resolve_version('installation',ref,fields,pub);
 instversion:=version;
 result:=result||jsonb_build_object('_producer_installation_version_id',version);
 END IF;
 IF v ? 'workspaceId' THEN
 fields:='{}';
 IF v ? 'precursorName' THEN fields:=fields||jsonb_build_object('name',v->'precursorName'); END IF;
IF v ? 'cnCode' THEN fields:=fields||jsonb_build_object('cn_code',v->'cnCode'); END IF;
 ref:=prodref;
 
 version:=masterdata.resolve_version('product',ref,fields,pub);
 prodversion:=version;
 result:=result||jsonb_build_object('_precursor_product_version_id',version);
 END IF;
 IF NOT(v ? 'workspaceId') THEN
 fields:='{}';
 IF v ? 'name' THEN fields:=fields||jsonb_build_object('name',v->'name'); END IF;
IF v ? 'nameLocal' THEN fields:=fields||jsonb_build_object('name_local',v->'nameLocal'); END IF;
IF v ? 'street' THEN fields:=fields||jsonb_build_object('street',v->'street'); END IF;
IF v ? 'economicActivity' THEN fields:=fields||jsonb_build_object('economic_activity',v->'economicActivity'); END IF;
IF v ? 'postcode' THEN fields:=fields||jsonb_build_object('postcode',v->'postcode'); END IF;
IF v ? 'poBox' THEN fields:=fields||jsonb_build_object('po_box',v->'poBox'); END IF;
IF v ? 'city' THEN fields:=fields||jsonb_build_object('city',v->'city'); END IF;
IF v ? 'country' THEN fields:=fields||jsonb_build_object('country',v->'country'); END IF;
IF v ? 'unlocode' THEN fields:=fields||jsonb_build_object('unlocode',v->'unlocode'); END IF;
IF v ? 'lat' THEN fields:=fields||jsonb_build_object('latitude',v->'lat'); END IF;
IF v ? 'lng' THEN fields:=fields||jsonb_build_object('longitude',v->'lng'); END IF;
IF v ? 'contactName' THEN fields:=fields||jsonb_build_object('contact_name',v->'contactName'); END IF;
IF v ? 'contactEmail' THEN fields:=fields||jsonb_build_object('contact_email',v->'contactEmail'); END IF;
IF v ? 'contactPhone' THEN fields:=fields||jsonb_build_object('contact_phone',v->'contactPhone'); END IF;
 ref:=instref;
 IF orgversion IS NULL THEN orgversion:=masterdata.resolve_version('organization',orgref,'{}',pub); END IF; fields:=fields||jsonb_build_object('operator_version_id',orgversion);
 version:=masterdata.resolve_version('installation',ref,fields,pub);
 instversion:=version;
 result:=result||jsonb_build_object('_installation_history_version_id',version);
 END IF;
 WHEN 'report_inputs_v1_rows' THEN
IF true THEN
 fields:='{}';
 
 ref:=orgref;
 
 version:=masterdata.resolve_version('organization',ref,fields,pub);
 orgversion:=version;
 result:=result||jsonb_build_object('_scope_operator_version_id',version);
 END IF;
 WHEN 'report_inputs_v1_rows_0_4_rows_rows_values' THEN
IF true THEN
 fields:='{}';
 IF v ? 'country' THEN fields:=fields||jsonb_build_object('country',v->'country'); END IF;
 ref:=orgref;
 
 version:=masterdata.resolve_version('organization',ref,fields,pub);
 orgversion:=version;
 result:=result||jsonb_build_object('_operator_version_id',version);
 END IF;
 WHEN 'report_inputs_v1_rows_0_5_rows_rows_values' THEN
IF true THEN
 fields:='{}';
 IF v ? 'name' THEN fields:=fields||jsonb_build_object('contact_name',v->'name'); END IF;
IF v ? 'email' THEN fields:=fields||jsonb_build_object('contact_email',v->'email'); END IF;
IF v ? 'phone' THEN fields:=fields||jsonb_build_object('contact_phone',v->'phone'); END IF;
 ref:=orgref;
 
 version:=masterdata.resolve_version('organization',ref,fields,pub);
 orgversion:=version;
 result:=result||jsonb_build_object('_operator_version_id',version);
 END IF;
 WHEN 'report_inputs_v1_rows_0_7_rows_rows_values' THEN
IF true THEN
 fields:='{}';
 IF v ? 'operator' THEN fields:=fields||jsonb_build_object('name',v->'operator'); END IF;
 ref:=orgref;
 
 version:=masterdata.resolve_version('organization',ref,fields,pub);
 orgversion:=version;
 result:=result||jsonb_build_object('_operator_version_id',version);
 END IF;
 IF true THEN
 fields:='{}';
 IF v ? 'exporter' THEN fields:=fields||jsonb_build_object('name',v->'exporter'); END IF;
 ref:='self';
 
 version:=masterdata.resolve_version('organization',ref,fields,pub);
 orgversion:=version;
 result:=result||jsonb_build_object('_exporter_version_id',version);
 END IF;
 WHEN 'account_profile' THEN
IF true THEN
 fields:='{}';
 IF v ? 'companyName' THEN fields:=fields||jsonb_build_object('name',v->'companyName'); END IF;
IF v ? 'jurisdiction' THEN fields:=fields||jsonb_build_object('country',v->'jurisdiction'); END IF;
 ref:=orgref;
 
 version:=masterdata.resolve_version('organization',ref,fields,pub);
 orgversion:=version;
 result:=result||jsonb_build_object('_operator_version_id',version);
 END IF;
 ELSE NULL; END CASE; RETURN result; END $$;
ALTER TABLE reporting."workspace_profiles" ADD COLUMN "_installation_version_id" uuid REFERENCES masterdata.installation_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."workspace_profiles" ADD COLUMN "_product_version_id" uuid REFERENCES masterdata.product_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."installation_profiles" ADD COLUMN "_installation_version_id" uuid REFERENCES masterdata.installation_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."supplier_company_profiles" ADD COLUMN "_operator_version_id" uuid REFERENCES masterdata.organization_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."operator_reporting_plans" ADD COLUMN "_installation_version_id" uuid REFERENCES masterdata.installation_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."report_goods" ADD COLUMN "_product_version_id" uuid REFERENCES masterdata.product_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."workspace_mmd_versions_rows_rows_content_input_plan" ADD COLUMN "_installation_version_id" uuid REFERENCES masterdata.installation_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb" ADD COLUMN "_product_version_id" uuid REFERENCES masterdata.product_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."precursor_sources" ADD COLUMN "_producer_version_id" uuid REFERENCES masterdata.organization_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."precursor_sources" ADD COLUMN "_producer_installation_version_id" uuid REFERENCES masterdata.installation_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."precursor_sources" ADD COLUMN "_precursor_product_version_id" uuid REFERENCES masterdata.product_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" ADD COLUMN "_producer_version_id" uuid REFERENCES masterdata.organization_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" ADD COLUMN "_producer_installation_version_id" uuid REFERENCES masterdata.installation_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" ADD COLUMN "_precursor_product_version_id" uuid REFERENCES masterdata.product_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" ADD COLUMN "_installation_history_version_id" uuid REFERENCES masterdata.installation_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."report_inputs_v1_rows" ADD COLUMN "_scope_operator_version_id" uuid REFERENCES masterdata.organization_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."report_inputs_v1_rows_0_4_rows_rows_values" ADD COLUMN "_operator_version_id" uuid REFERENCES masterdata.organization_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."report_inputs_v1_rows_0_5_rows_rows_values" ADD COLUMN "_operator_version_id" uuid REFERENCES masterdata.organization_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."report_inputs_v1_rows_0_7_rows_rows_values" ADD COLUMN "_operator_version_id" uuid REFERENCES masterdata.organization_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."report_inputs_v1_rows_0_7_rows_rows_values" ADD COLUMN "_exporter_version_id" uuid REFERENCES masterdata.organization_versions DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE reporting."account_profile" ADD COLUMN "_operator_version_id" uuid REFERENCES masterdata.organization_versions DEFERRABLE INITIALLY DEFERRED;
CREATE FUNCTION masterdata.guard_reference() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target uuid; allowed boolean; owner uuid:=nullif(current_setting('certrace.user_id',true),'')::uuid;
BEGIN
 target:=(to_jsonb(NEW)->>TG_ARGV[0])::uuid;
 IF target IS NULL THEN RETURN NEW; END IF;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM masterdata.%I v JOIN masterdata.%I e ON e.id=v.%I WHERE v.id=$1 AND e.account_id=$2)',TG_ARGV[1]||'_versions',TG_ARGV[1]||'s',TG_ARGV[1]||'_id') INTO allowed USING target,owner;
 IF NOT allowed THEN RAISE EXCEPTION 'Master reference belongs to another account' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER operator_account BEFORE INSERT ON masterdata.installation_versions FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('operator_version_id','organization');
CREATE TRIGGER "master_installation" BEFORE INSERT OR UPDATE ON reporting."workspace_profiles" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_installation_version_id','installation');
CREATE TRIGGER "master_product" BEFORE INSERT OR UPDATE ON reporting."workspace_profiles" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_product_version_id','product');
CREATE TRIGGER "master_installation" BEFORE INSERT OR UPDATE ON reporting."installation_profiles" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_installation_version_id','installation');
CREATE TRIGGER "master_operator" BEFORE INSERT OR UPDATE ON reporting."supplier_company_profiles" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_operator_version_id','organization');
CREATE TRIGGER "master_installation" BEFORE INSERT OR UPDATE ON reporting."operator_reporting_plans" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_installation_version_id','installation');
CREATE TRIGGER "master_product" BEFORE INSERT OR UPDATE ON reporting."report_goods" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_product_version_id','product');
CREATE TRIGGER "master_installation" BEFORE INSERT OR UPDATE ON reporting."workspace_mmd_versions_rows_rows_content_input_plan" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_installation_version_id','installation');
CREATE TRIGGER "master_product" BEFORE INSERT OR UPDATE ON reporting."workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_product_version_id','product');
CREATE TRIGGER "master_producer" BEFORE INSERT OR UPDATE ON reporting."precursor_sources" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_producer_version_id','organization');
CREATE TRIGGER "master_producer_installation" BEFORE INSERT OR UPDATE ON reporting."precursor_sources" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_producer_installation_version_id','installation');
CREATE TRIGGER "master_precursor_product" BEFORE INSERT OR UPDATE ON reporting."precursor_sources" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_precursor_product_version_id','product');
CREATE TRIGGER "master_producer" BEFORE INSERT OR UPDATE ON reporting."precursor_versions_rows_rows_snapshot" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_producer_version_id','organization');
CREATE TRIGGER "master_producer_installation" BEFORE INSERT OR UPDATE ON reporting."precursor_versions_rows_rows_snapshot" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_producer_installation_version_id','installation');
CREATE TRIGGER "master_precursor_product" BEFORE INSERT OR UPDATE ON reporting."precursor_versions_rows_rows_snapshot" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_precursor_product_version_id','product');
CREATE TRIGGER "master_installation_history" BEFORE INSERT OR UPDATE ON reporting."precursor_versions_rows_rows_snapshot" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_installation_history_version_id','installation');
CREATE TRIGGER "master_scope_operator" BEFORE INSERT OR UPDATE ON reporting."report_inputs_v1_rows" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_scope_operator_version_id','organization');
CREATE TRIGGER "master_operator" BEFORE INSERT OR UPDATE ON reporting."report_inputs_v1_rows_0_4_rows_rows_values" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_operator_version_id','organization');
CREATE TRIGGER "master_operator" BEFORE INSERT OR UPDATE ON reporting."report_inputs_v1_rows_0_5_rows_rows_values" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_operator_version_id','organization');
CREATE TRIGGER "master_operator" BEFORE INSERT OR UPDATE ON reporting."report_inputs_v1_rows_0_7_rows_rows_values" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_operator_version_id','organization');
CREATE TRIGGER "master_exporter" BEFORE INSERT OR UPDATE ON reporting."report_inputs_v1_rows_0_7_rows_rows_values" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_exporter_version_id','organization');
CREATE TRIGGER "master_operator" BEFORE INSERT OR UPDATE ON reporting."account_profile" FOR EACH ROW EXECUTE FUNCTION masterdata.guard_reference('_operator_version_id','organization');
ALTER TABLE reporting.workspace_profiles ADD COLUMN _workspace_identity_id uuid REFERENCES masterdata.workspace_identities DEFERRABLE INITIALLY DEFERRED;
CREATE FUNCTION masterdata.backfill_node(tab text,parent uuid,ctx jsonb) RETURNS void LANGUAGE plpgsql AS $$
DECLARE r record; child record; v jsonb; refs jsonb; nextctx jsonb; pair record; query text;
BEGIN
 FOR r IN EXECUTE format('SELECT * FROM reporting.%I WHERE _parent_id=$1 ORDER BY _slot',tab) USING parent LOOP
 v:='{}';
 FOR pair IN SELECT key,value FROM jsonb_each(to_jsonb(r)) WHERE key LIKE 'f\_%' ESCAPE '\' LOOP
 IF coalesce((to_jsonb(r)->>('p_'||substr(pair.key,3)))::boolean,false) THEN v:=v||jsonb_build_object(substr(pair.key,3),pair.value); END IF;
 END LOOP;
 nextctx:=ctx;
 CASE tab
 WHEN 'monitoring_plans' THEN nextctx:=ctx||jsonb_build_object('scope',r._slot);
WHEN 'workspace_mmd_versions_rows' THEN nextctx:=ctx||jsonb_build_object('scope',r._slot);
WHEN 'monthly_data_rows' THEN nextctx:=ctx||jsonb_build_object('scope',r._slot);
WHEN 'precursor_suppliers_rows' THEN nextctx:=ctx||jsonb_build_object('scope',r._slot);
WHEN 'workspace_evidence_rows' THEN nextctx:=ctx||jsonb_build_object('scope',r._slot);
WHEN 'report_signoffs' THEN nextctx:=ctx||jsonb_build_object('scope',r._slot);
WHEN 'carbon_price_claims' THEN nextctx:=ctx||jsonb_build_object('scope',r._slot);
WHEN 'monthly_requests_rows' THEN nextctx:=ctx||jsonb_build_object('scope',r._slot);
WHEN 'month_submissions_rows' THEN nextctx:=ctx||jsonb_build_object('scope',r._slot);
WHEN 'final_report_snapshot_rows' THEN nextctx:=ctx||jsonb_build_object('scope',r._slot);
 WHEN 'report_inputs_v1_rows' THEN nextctx:=ctx||jsonb_build_object('scope',r._slot);
 ELSE NULL; END CASE;
 IF tab='precursor_sources' THEN v:=v||jsonb_build_object('workspaceId',nextctx->>'scope'); END IF;
 IF NOT r._null THEN
 refs:=masterdata.bind_row(tab,v,nextctx);
 FOR pair IN SELECT key,value FROM jsonb_each_text(refs) LOOP
 EXECUTE format('UPDATE reporting.%I SET %I=$1::uuid WHERE _id=$2',tab,pair.key) USING pair.value,r._id;
 END LOOP;
 END IF;
 FOR child IN SELECT name FROM reporting.storage_tables WHERE parent_name=tab LOOP PERFORM masterdata.backfill_node(child.name,r._id,nextctx); END LOOP;
 END LOOP;
END $$;
DO $$ DECLARE rec record; root record; BEGIN
 FOR rec IN SELECT r.*,h.revision=r.revision AS current FROM reporting.records r LEFT JOIN reporting.record_heads h USING(user_id,key) ORDER BY r.user_id,CASE r.key WHEN 'certrace:supplier-companies' THEN 0 WHEN 'certrace:installations' THEN 1 WHEN 'certrace:workspaces' THEN 2 ELSE 3 END,r.revision LOOP
 PERFORM set_config('certrace.user_id',rec.user_id::text,true);
 FOR root IN SELECT name FROM reporting.storage_tables WHERE parent_name='records' AND name=CASE regexp_replace(rec.key,'^supplier:[A-Za-z0-9_-]+:','')
 WHEN 'certrace:workspaces' THEN 'workspaces'
WHEN 'certrace:installations' THEN 'installations'
WHEN 'certrace:supplier-companies' THEN 'supplier_companies'
WHEN 'certrace:workspace-drafts' THEN 'workspace_drafts'
WHEN 'certrace:workspace-mmd-draft' THEN 'workspace_mmd_draft'
WHEN 'certrace:workspace-mmd-versions' THEN 'workspace_mmd_versions'
WHEN 'certrace:monthly-data' THEN 'monthly_data'
WHEN 'certrace:precursor-suppliers' THEN 'precursor_suppliers'
WHEN 'certrace:workspace-evidence' THEN 'workspace_evidence'
WHEN 'certrace:pack-signoff' THEN 'pack_signoff'
WHEN 'certrace:carbon-price' THEN 'carbon_price'
WHEN 'certrace:reporting-periods' THEN 'reporting_periods'
WHEN 'certrace:annual-production' THEN 'annual_production'
WHEN 'certrace:monthly-requests' THEN 'monthly_requests'
WHEN 'certrace:month-submissions' THEN 'month_submissions'
WHEN 'certrace:precursor-versions' THEN 'precursor_versions'
WHEN 'certrace:final-report-snapshot' THEN 'final_report_snapshot'
WHEN 'certrace:report-snapshots:*' THEN 'report_snapshots_'
WHEN 'certrace:report-inputs:v1' THEN 'report_inputs_v1'
 ELSE 'report_snapshots' END LOOP
 PERFORM masterdata.backfill_node(root.name,rec.id,jsonb_build_object('key',rec.key,'publish',rec.current AND rec.key NOT LIKE 'supplier:%' AND rec.key NOT LIKE '%versions%'));
 END LOOP;
 END LOOP;
END $$;
DROP FUNCTION masterdata.backfill_node;
SET CONSTRAINTS ALL IMMEDIATE;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_profiles" r JOIN masterdata.installation_versions iv ON iv.id=r._installation_version_id JOIN masterdata.organization_versions v ON v.id=iv.operator_version_id JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_supplierName" AND to_jsonb(r."f_supplierName") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_profiles.supplierName'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_profiles" r JOIN masterdata.installation_versions iv ON iv.id=r._installation_version_id JOIN masterdata.organization_versions v ON v.id=iv.operator_version_id JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_supplierId" AND to_jsonb(r."f_supplierId") IS DISTINCT FROM to_jsonb(CASE WHEN e.external_reference LIKE 'supplier:%' THEN substr(e.external_reference,10) ELSE '' END)) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_profiles.supplierId'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_profiles" r JOIN masterdata.installation_versions iv ON iv.id=r._installation_version_id JOIN masterdata.organization_versions v ON v.id=iv.operator_version_id JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_selfSupplied" AND to_jsonb(r."f_selfSupplied") IS DISTINCT FROM to_jsonb((e.external_reference='self'))) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_profiles.selfSupplied'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_installationName" AND to_jsonb(r."f_installationName") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_profiles.installationName'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_installationId" AND to_jsonb(r."f_installationId") IS DISTINCT FROM to_jsonb(e.external_reference)) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_profiles.installationId'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_profiles" r JOIN masterdata.product_versions v ON v.id=r."_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_productName" AND to_jsonb(r."f_productName") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_profiles.productName'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_profiles" r JOIN masterdata.product_versions v ON v.id=r."_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_cnCode" AND to_jsonb(r."f_cnCode") IS DISTINCT FROM to_jsonb(v."cn_code")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_profiles.cnCode'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_profiles" r JOIN masterdata.product_versions v ON v.id=r."_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_productId" AND to_jsonb(r."f_productId") IS DISTINCT FROM to_jsonb(regexp_replace(e.external_reference,'^catalog:',''))) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_profiles.productId'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_name" AND to_jsonb(r."f_name") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.name'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_nameLocal" AND to_jsonb(r."f_nameLocal") IS DISTINCT FROM to_jsonb(v."name_local")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.nameLocal'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_street" AND to_jsonb(r."f_street") IS DISTINCT FROM to_jsonb(v."street")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.street'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_economicActivity" AND to_jsonb(r."f_economicActivity") IS DISTINCT FROM to_jsonb(v."economic_activity")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.economicActivity'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_postcode" AND to_jsonb(r."f_postcode") IS DISTINCT FROM to_jsonb(v."postcode")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.postcode'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_poBox" AND to_jsonb(r."f_poBox") IS DISTINCT FROM to_jsonb(v."po_box")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.poBox'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_city" AND to_jsonb(r."f_city") IS DISTINCT FROM to_jsonb(v."city")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.city'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_country" AND to_jsonb(r."f_country") IS DISTINCT FROM to_jsonb(v."country")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.country'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_unlocode" AND to_jsonb(r."f_unlocode") IS DISTINCT FROM to_jsonb(v."unlocode")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.unlocode'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_lat" AND to_jsonb(r."f_lat") IS DISTINCT FROM to_jsonb(v."latitude")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.lat'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_lng" AND to_jsonb(r."f_lng") IS DISTINCT FROM to_jsonb(v."longitude")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.lng'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_contactName" AND to_jsonb(r."f_contactName") IS DISTINCT FROM to_jsonb(v."contact_name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.contactName'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_contactEmail" AND to_jsonb(r."f_contactEmail") IS DISTINCT FROM to_jsonb(v."contact_email")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.contactEmail'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_contactPhone" AND to_jsonb(r."f_contactPhone") IS DISTINCT FROM to_jsonb(v."contact_phone")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.contactPhone'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_id" AND to_jsonb(r."f_id") IS DISTINCT FROM to_jsonb(e.external_reference)) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.id'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_self" AND to_jsonb(r."f_self") IS DISTINCT FROM to_jsonb((op.external_reference='self'))) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.self'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."installation_profiles" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_supplierId" AND to_jsonb(r."f_supplierId") IS DISTINCT FROM to_jsonb(CASE WHEN op.external_reference LIKE 'supplier:%' THEN substr(op.external_reference,10) ELSE '' END)) THEN RAISE EXCEPTION 'Master migration read-back mismatch: installation_profiles.supplierId'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."supplier_company_profiles" r JOIN masterdata.organization_versions v ON v.id=r."_operator_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_name" AND to_jsonb(r."f_name") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: supplier_company_profiles.name'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."supplier_company_profiles" r JOIN masterdata.organization_versions v ON v.id=r."_operator_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_country" AND to_jsonb(r."f_country") IS DISTINCT FROM to_jsonb(v."country")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: supplier_company_profiles.country'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."supplier_company_profiles" r JOIN masterdata.organization_versions v ON v.id=r."_operator_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_contactName" AND to_jsonb(r."f_contactName") IS DISTINCT FROM to_jsonb(v."contact_name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: supplier_company_profiles.contactName'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."supplier_company_profiles" r JOIN masterdata.organization_versions v ON v.id=r."_operator_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_contactEmail" AND to_jsonb(r."f_contactEmail") IS DISTINCT FROM to_jsonb(v."contact_email")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: supplier_company_profiles.contactEmail'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."supplier_company_profiles" r JOIN masterdata.organization_versions v ON v.id=r."_operator_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_contactPhone" AND to_jsonb(r."f_contactPhone") IS DISTINCT FROM to_jsonb(v."contact_phone")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: supplier_company_profiles.contactPhone'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."supplier_company_profiles" r JOIN masterdata.organization_versions v ON v.id=r."_operator_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_id" AND to_jsonb(r."f_id") IS DISTINCT FROM to_jsonb(CASE WHEN e.external_reference LIKE 'supplier:%' THEN substr(e.external_reference,10) ELSE '' END)) THEN RAISE EXCEPTION 'Master migration read-back mismatch: supplier_company_profiles.id'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."operator_reporting_plans" r JOIN masterdata.installation_versions iv ON iv.id=r._installation_version_id JOIN masterdata.organization_versions v ON v.id=iv.operator_version_id JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_operatorName" AND to_jsonb(r."f_operatorName") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: operator_reporting_plans.operatorName'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."operator_reporting_plans" r JOIN masterdata.installation_versions iv ON iv.id=r._installation_version_id JOIN masterdata.organization_versions v ON v.id=iv.operator_version_id JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_operatorRegistration" AND to_jsonb(r."f_operatorRegistration") IS DISTINCT FROM to_jsonb(v."registration")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: operator_reporting_plans.operatorRegistration'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."operator_reporting_plans" r JOIN masterdata.installation_versions iv ON iv.id=r._installation_version_id JOIN masterdata.organization_versions v ON v.id=iv.operator_version_id JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_operatorAddress" AND to_jsonb(r."f_operatorAddress") IS DISTINCT FROM to_jsonb(v."address")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: operator_reporting_plans.operatorAddress'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."operator_reporting_plans" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_registryId" AND to_jsonb(r."f_registryId") IS DISTINCT FROM to_jsonb(v."registry_id")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: operator_reporting_plans.registryId'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."report_goods" r JOIN masterdata.product_versions v ON v.id=r."_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_name" AND to_jsonb(r."f_name") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: report_goods.name'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."report_goods" r JOIN masterdata.product_versions v ON v.id=r."_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_cnCode" AND to_jsonb(r."f_cnCode") IS DISTINCT FROM to_jsonb(v."cn_code")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: report_goods.cnCode'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."report_goods" r JOIN masterdata.product_versions v ON v.id=r."_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_description" AND to_jsonb(r."f_description") IS DISTINCT FROM to_jsonb(v."description")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: report_goods.description'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."report_goods" r JOIN masterdata.product_versions v ON v.id=r."_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_unit" AND to_jsonb(r."f_unit") IS DISTINCT FROM to_jsonb(v."unit")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: report_goods.unit'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."report_goods" r JOIN masterdata.product_versions v ON v.id=r."_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_benchmark" AND to_jsonb(r."f_benchmark") IS DISTINCT FROM to_jsonb(v."benchmark")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: report_goods.benchmark'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_mmd_versions_rows_rows_content_input_plan" r JOIN masterdata.installation_versions iv ON iv.id=r._installation_version_id JOIN masterdata.organization_versions v ON v.id=iv.operator_version_id JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_operatorName" AND to_jsonb(r."f_operatorName") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_mmd_versions_rows_rows_content_input_plan.operatorName'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_mmd_versions_rows_rows_content_input_plan" r JOIN masterdata.installation_versions iv ON iv.id=r._installation_version_id JOIN masterdata.organization_versions v ON v.id=iv.operator_version_id JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_operatorRegistration" AND to_jsonb(r."f_operatorRegistration") IS DISTINCT FROM to_jsonb(v."registration")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_mmd_versions_rows_rows_content_input_plan.operatorRegistration'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_mmd_versions_rows_rows_content_input_plan" r JOIN masterdata.installation_versions iv ON iv.id=r._installation_version_id JOIN masterdata.organization_versions v ON v.id=iv.operator_version_id JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_operatorAddress" AND to_jsonb(r."f_operatorAddress") IS DISTINCT FROM to_jsonb(v."address")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_mmd_versions_rows_rows_content_input_plan.operatorAddress'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_mmd_versions_rows_rows_content_input_plan" r JOIN masterdata.installation_versions v ON v.id=r."_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_registryId" AND to_jsonb(r."f_registryId") IS DISTINCT FROM to_jsonb(v."registry_id")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_mmd_versions_rows_rows_content_input_plan.registryId'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb" r JOIN masterdata.product_versions v ON v.id=r."_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_name" AND to_jsonb(r."f_name") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb.name'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb" r JOIN masterdata.product_versions v ON v.id=r."_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_cnCode" AND to_jsonb(r."f_cnCode") IS DISTINCT FROM to_jsonb(v."cn_code")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb.cnCode'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb" r JOIN masterdata.product_versions v ON v.id=r."_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_description" AND to_jsonb(r."f_description") IS DISTINCT FROM to_jsonb(v."description")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb.description'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb" r JOIN masterdata.product_versions v ON v.id=r."_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_unit" AND to_jsonb(r."f_unit") IS DISTINCT FROM to_jsonb(v."unit")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb.unit'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb" r JOIN masterdata.product_versions v ON v.id=r."_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_benchmark" AND to_jsonb(r."f_benchmark") IS DISTINCT FROM to_jsonb(v."benchmark")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb.benchmark'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_sources" r JOIN masterdata.organization_versions v ON v.id=r."_producer_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_name" AND to_jsonb(r."f_name") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_sources.name'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_sources" r JOIN masterdata.organization_versions v ON v.id=r."_producer_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_contactName" AND to_jsonb(r."f_contactName") IS DISTINCT FROM to_jsonb(v."contact_name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_sources.contactName'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_sources" r JOIN masterdata.organization_versions v ON v.id=r."_producer_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_contactEmail" AND to_jsonb(r."f_contactEmail") IS DISTINCT FROM to_jsonb(v."contact_email")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_sources.contactEmail'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_sources" r JOIN masterdata.organization_versions v ON v.id=r."_producer_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_contactPhone" AND to_jsonb(r."f_contactPhone") IS DISTINCT FROM to_jsonb(v."contact_phone")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_sources.contactPhone'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_sources" r JOIN masterdata.installation_versions v ON v.id=r."_producer_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_installationName" AND to_jsonb(r."f_installationName") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_sources.installationName'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_sources" r JOIN masterdata.installation_versions v ON v.id=r."_producer_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_country" AND to_jsonb(r."f_country") IS DISTINCT FROM to_jsonb(v."country")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_sources.country'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_sources" r JOIN masterdata.installation_versions v ON v.id=r."_producer_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_unlocode" AND to_jsonb(r."f_unlocode") IS DISTINCT FROM to_jsonb(v."unlocode")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_sources.unlocode'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_sources" r JOIN masterdata.installation_versions v ON v.id=r."_producer_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_latitude" AND to_jsonb(r."f_latitude") IS DISTINCT FROM to_jsonb((v."latitude")::numeric)) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_sources.latitude'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_sources" r JOIN masterdata.installation_versions v ON v.id=r."_producer_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_longitude" AND to_jsonb(r."f_longitude") IS DISTINCT FROM to_jsonb((v."longitude")::numeric)) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_sources.longitude'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_sources" r JOIN masterdata.installation_versions v ON v.id=r."_producer_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_fullAddress" AND to_jsonb(r."f_fullAddress") IS DISTINCT FROM to_jsonb(v."full_address")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_sources.fullAddress'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_sources" r JOIN masterdata.product_versions v ON v.id=r."_precursor_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_precursorName" AND to_jsonb(r."f_precursorName") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_sources.precursorName'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_sources" r JOIN masterdata.product_versions v ON v.id=r."_precursor_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_cnCode" AND to_jsonb(r."f_cnCode") IS DISTINCT FROM to_jsonb(v."cn_code")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_sources.cnCode'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.organization_versions v ON v.id=r."_producer_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_name" AND to_jsonb(r."f_name") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.name'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.organization_versions v ON v.id=r."_producer_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_contactName" AND to_jsonb(r."f_contactName") IS DISTINCT FROM to_jsonb(v."contact_name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.contactName'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.organization_versions v ON v.id=r."_producer_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_contactEmail" AND to_jsonb(r."f_contactEmail") IS DISTINCT FROM to_jsonb(v."contact_email")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.contactEmail'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.organization_versions v ON v.id=r."_producer_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_contactPhone" AND to_jsonb(r."f_contactPhone") IS DISTINCT FROM to_jsonb(v."contact_phone")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.contactPhone'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_producer_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_installationName" AND to_jsonb(r."f_installationName") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.installationName'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_producer_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_country" AND to_jsonb(r."f_country") IS DISTINCT FROM to_jsonb(v."country")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.country'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_producer_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_unlocode" AND to_jsonb(r."f_unlocode") IS DISTINCT FROM to_jsonb(v."unlocode")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.unlocode'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_producer_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_latitude" AND to_jsonb(r."f_latitude") IS DISTINCT FROM to_jsonb((v."latitude")::numeric)) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.latitude'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_producer_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_longitude" AND to_jsonb(r."f_longitude") IS DISTINCT FROM to_jsonb((v."longitude")::numeric)) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.longitude'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_producer_installation_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_fullAddress" AND to_jsonb(r."f_fullAddress") IS DISTINCT FROM to_jsonb(v."full_address")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.fullAddress'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.product_versions v ON v.id=r."_precursor_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_precursorName" AND to_jsonb(r."f_precursorName") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.precursorName'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.product_versions v ON v.id=r."_precursor_product_version_id" JOIN masterdata.products e ON e.id=v.product_id  WHERE r."p_cnCode" AND to_jsonb(r."f_cnCode") IS DISTINCT FROM to_jsonb(v."cn_code")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.cnCode'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_name" AND to_jsonb(r."f_name") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.name'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_nameLocal" AND to_jsonb(r."f_nameLocal") IS DISTINCT FROM to_jsonb(v."name_local")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.nameLocal'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_street" AND to_jsonb(r."f_street") IS DISTINCT FROM to_jsonb(v."street")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.street'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_economicActivity" AND to_jsonb(r."f_economicActivity") IS DISTINCT FROM to_jsonb(v."economic_activity")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.economicActivity'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_postcode" AND to_jsonb(r."f_postcode") IS DISTINCT FROM to_jsonb(v."postcode")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.postcode'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_poBox" AND to_jsonb(r."f_poBox") IS DISTINCT FROM to_jsonb(v."po_box")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.poBox'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_city" AND to_jsonb(r."f_city") IS DISTINCT FROM to_jsonb(v."city")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.city'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_country" AND to_jsonb(r."f_country") IS DISTINCT FROM to_jsonb(v."country")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.country'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_unlocode" AND to_jsonb(r."f_unlocode") IS DISTINCT FROM to_jsonb(v."unlocode")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.unlocode'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_lat" AND to_jsonb(r."f_lat") IS DISTINCT FROM to_jsonb(v."latitude")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.lat'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_lng" AND to_jsonb(r."f_lng") IS DISTINCT FROM to_jsonb(v."longitude")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.lng'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_contactName" AND to_jsonb(r."f_contactName") IS DISTINCT FROM to_jsonb(v."contact_name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.contactName'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_contactEmail" AND to_jsonb(r."f_contactEmail") IS DISTINCT FROM to_jsonb(v."contact_email")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.contactEmail'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_contactPhone" AND to_jsonb(r."f_contactPhone") IS DISTINCT FROM to_jsonb(v."contact_phone")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.contactPhone'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_self" AND to_jsonb(r."f_self") IS DISTINCT FROM to_jsonb((op.external_reference='self'))) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.self'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."precursor_versions_rows_rows_snapshot" r JOIN masterdata.installation_versions v ON v.id=r."_installation_history_version_id" JOIN masterdata.installations e ON e.id=v.installation_id LEFT JOIN masterdata.organization_versions ov ON ov.id=v.operator_version_id LEFT JOIN masterdata.organizations op ON op.id=ov.organization_id WHERE r."p_supplierId" AND to_jsonb(r."f_supplierId") IS DISTINCT FROM to_jsonb(CASE WHEN op.external_reference LIKE 'supplier:%' THEN substr(op.external_reference,10) ELSE '' END)) THEN RAISE EXCEPTION 'Master migration read-back mismatch: precursor_versions_rows_rows_snapshot.supplierId'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."report_inputs_v1_rows_0_4_rows_rows_values" r JOIN masterdata.organization_versions v ON v.id=r."_operator_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_country" AND to_jsonb(r."f_country") IS DISTINCT FROM to_jsonb(v."country")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: report_inputs_v1_rows_0_4_rows_rows_values.country'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."report_inputs_v1_rows_0_5_rows_rows_values" r JOIN masterdata.organization_versions v ON v.id=r."_operator_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_name" AND to_jsonb(r."f_name") IS DISTINCT FROM to_jsonb(v."contact_name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: report_inputs_v1_rows_0_5_rows_rows_values.name'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."report_inputs_v1_rows_0_5_rows_rows_values" r JOIN masterdata.organization_versions v ON v.id=r."_operator_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_email" AND to_jsonb(r."f_email") IS DISTINCT FROM to_jsonb(v."contact_email")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: report_inputs_v1_rows_0_5_rows_rows_values.email'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."report_inputs_v1_rows_0_5_rows_rows_values" r JOIN masterdata.organization_versions v ON v.id=r."_operator_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_phone" AND to_jsonb(r."f_phone") IS DISTINCT FROM to_jsonb(v."contact_phone")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: report_inputs_v1_rows_0_5_rows_rows_values.phone'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."report_inputs_v1_rows_0_7_rows_rows_values" r JOIN masterdata.organization_versions v ON v.id=r."_operator_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_operator" AND to_jsonb(r."f_operator") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: report_inputs_v1_rows_0_7_rows_rows_values.operator'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."report_inputs_v1_rows_0_7_rows_rows_values" r JOIN masterdata.organization_versions v ON v.id=r."_exporter_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_exporter" AND to_jsonb(r."f_exporter") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: report_inputs_v1_rows_0_7_rows_rows_values.exporter'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."account_profile" r JOIN masterdata.organization_versions v ON v.id=r."_operator_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_companyName" AND to_jsonb(r."f_companyName") IS DISTINCT FROM to_jsonb(v."name")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: account_profile.companyName'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM reporting."account_profile" r JOIN masterdata.organization_versions v ON v.id=r."_operator_version_id" JOIN masterdata.organizations e ON e.id=v.organization_id  WHERE r."p_jurisdiction" AND to_jsonb(r."f_jurisdiction") IS DISTINCT FROM to_jsonb(v."country")) THEN RAISE EXCEPTION 'Master migration read-back mismatch: account_profile.jurisdiction'; END IF; END $$;
ALTER TABLE reporting."workspace_profiles" DROP COLUMN "f_supplierName";
ALTER TABLE reporting."workspace_profiles" DROP COLUMN "f_supplierId";
ALTER TABLE reporting."workspace_profiles" DROP COLUMN "f_selfSupplied";
ALTER TABLE reporting."workspace_profiles" DROP COLUMN "f_installationName";
ALTER TABLE reporting."workspace_profiles" DROP COLUMN "f_installationId";
ALTER TABLE reporting."workspace_profiles" DROP COLUMN "f_productName";
ALTER TABLE reporting."workspace_profiles" DROP COLUMN "f_cnCode";
ALTER TABLE reporting."workspace_profiles" DROP COLUMN "f_productId";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_name";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_nameLocal";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_street";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_economicActivity";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_postcode";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_poBox";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_city";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_country";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_unlocode";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_lat";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_lng";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_contactName";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_contactEmail";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_contactPhone";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_id";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_self";
ALTER TABLE reporting."installation_profiles" DROP COLUMN "f_supplierId";
ALTER TABLE reporting."supplier_company_profiles" DROP COLUMN "f_name";
ALTER TABLE reporting."supplier_company_profiles" DROP COLUMN "f_country";
ALTER TABLE reporting."supplier_company_profiles" DROP COLUMN "f_contactName";
ALTER TABLE reporting."supplier_company_profiles" DROP COLUMN "f_contactEmail";
ALTER TABLE reporting."supplier_company_profiles" DROP COLUMN "f_contactPhone";
ALTER TABLE reporting."supplier_company_profiles" DROP COLUMN "f_id";
ALTER TABLE reporting."operator_reporting_plans" DROP COLUMN "f_operatorName";
ALTER TABLE reporting."operator_reporting_plans" DROP COLUMN "f_operatorRegistration";
ALTER TABLE reporting."operator_reporting_plans" DROP COLUMN "f_operatorAddress";
ALTER TABLE reporting."operator_reporting_plans" DROP COLUMN "f_registryId";
ALTER TABLE reporting."report_goods" DROP COLUMN "f_name";
ALTER TABLE reporting."report_goods" DROP COLUMN "f_cnCode";
ALTER TABLE reporting."report_goods" DROP COLUMN "f_description";
ALTER TABLE reporting."report_goods" DROP COLUMN "f_unit";
ALTER TABLE reporting."report_goods" DROP COLUMN "f_benchmark";
ALTER TABLE reporting."workspace_mmd_versions_rows_rows_content_input_plan" DROP COLUMN "f_operatorName";
ALTER TABLE reporting."workspace_mmd_versions_rows_rows_content_input_plan" DROP COLUMN "f_operatorRegistration";
ALTER TABLE reporting."workspace_mmd_versions_rows_rows_content_input_plan" DROP COLUMN "f_operatorAddress";
ALTER TABLE reporting."workspace_mmd_versions_rows_rows_content_input_plan" DROP COLUMN "f_registryId";
ALTER TABLE reporting."workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb" DROP COLUMN "f_name";
ALTER TABLE reporting."workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb" DROP COLUMN "f_cnCode";
ALTER TABLE reporting."workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb" DROP COLUMN "f_description";
ALTER TABLE reporting."workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb" DROP COLUMN "f_unit";
ALTER TABLE reporting."workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb" DROP COLUMN "f_benchmark";
ALTER TABLE reporting."precursor_sources" DROP COLUMN "f_name";
ALTER TABLE reporting."precursor_sources" DROP COLUMN "f_contactName";
ALTER TABLE reporting."precursor_sources" DROP COLUMN "f_contactEmail";
ALTER TABLE reporting."precursor_sources" DROP COLUMN "f_contactPhone";
ALTER TABLE reporting."precursor_sources" DROP COLUMN "f_installationName";
ALTER TABLE reporting."precursor_sources" DROP COLUMN "f_country";
ALTER TABLE reporting."precursor_sources" DROP COLUMN "f_unlocode";
ALTER TABLE reporting."precursor_sources" DROP COLUMN "f_latitude";
ALTER TABLE reporting."precursor_sources" DROP COLUMN "f_longitude";
ALTER TABLE reporting."precursor_sources" DROP COLUMN "f_fullAddress";
ALTER TABLE reporting."precursor_sources" DROP COLUMN "f_precursorName";
ALTER TABLE reporting."precursor_sources" DROP COLUMN "f_cnCode";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_name";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_contactName";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_contactEmail";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_contactPhone";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_installationName";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_country";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_unlocode";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_latitude";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_longitude";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_fullAddress";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_precursorName";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_cnCode";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_nameLocal";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_street";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_economicActivity";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_postcode";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_poBox";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_city";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_lat";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_lng";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_self";
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" DROP COLUMN "f_supplierId";
ALTER TABLE reporting."report_inputs_v1_rows_0_4_rows_rows_values" DROP COLUMN "f_country";
ALTER TABLE reporting."report_inputs_v1_rows_0_5_rows_rows_values" DROP COLUMN "f_name";
ALTER TABLE reporting."report_inputs_v1_rows_0_5_rows_rows_values" DROP COLUMN "f_email";
ALTER TABLE reporting."report_inputs_v1_rows_0_5_rows_rows_values" DROP COLUMN "f_phone";
ALTER TABLE reporting."report_inputs_v1_rows_0_7_rows_rows_values" DROP COLUMN "f_operator";
ALTER TABLE reporting."report_inputs_v1_rows_0_7_rows_rows_values" DROP COLUMN "f_exporter";
ALTER TABLE reporting."account_profile" DROP COLUMN "f_companyName";
ALTER TABLE reporting."account_profile" DROP COLUMN "f_jurisdiction";
ALTER TABLE reporting."workspace_profiles" ADD CHECK(_null OR ("_installation_version_id" IS NOT NULL AND "_product_version_id" IS NOT NULL));
ALTER TABLE reporting."installation_profiles" ADD CHECK(_null OR ("_installation_version_id" IS NOT NULL));
ALTER TABLE reporting."supplier_company_profiles" ADD CHECK(_null OR ("_operator_version_id" IS NOT NULL));
ALTER TABLE reporting."operator_reporting_plans" ADD CHECK(_null OR ("_installation_version_id" IS NOT NULL));
ALTER TABLE reporting."report_goods" ADD CHECK(_null OR ("_product_version_id" IS NOT NULL));
ALTER TABLE reporting."workspace_mmd_versions_rows_rows_content_input_plan" ADD CHECK(_null OR ("_installation_version_id" IS NOT NULL));
ALTER TABLE reporting."workspace_mmd_versions_rows_rows_content_input_pl_3b5d93eb" ADD CHECK(_null OR ("_product_version_id" IS NOT NULL));
ALTER TABLE reporting."precursor_sources" ADD CHECK(_null OR ("_producer_version_id" IS NOT NULL AND "_producer_installation_version_id" IS NOT NULL AND "_precursor_product_version_id" IS NOT NULL));
ALTER TABLE reporting."precursor_versions_rows_rows_snapshot" ADD CHECK(_null OR ((NOT "p_workspaceId" OR "_producer_version_id" IS NOT NULL) AND (NOT "p_workspaceId" OR "_producer_installation_version_id" IS NOT NULL) AND (NOT "p_workspaceId" OR "_precursor_product_version_id" IS NOT NULL) AND ("p_workspaceId" OR "_installation_history_version_id" IS NOT NULL)));
ALTER TABLE reporting."report_inputs_v1_rows" ADD CHECK(_null OR ("_scope_operator_version_id" IS NOT NULL));
ALTER TABLE reporting."report_inputs_v1_rows_0_4_rows_rows_values" ADD CHECK(_null OR ("_operator_version_id" IS NOT NULL));
ALTER TABLE reporting."report_inputs_v1_rows_0_5_rows_rows_values" ADD CHECK(_null OR ("_operator_version_id" IS NOT NULL));
ALTER TABLE reporting."report_inputs_v1_rows_0_7_rows_rows_values" ADD CHECK(_null OR ("_operator_version_id" IS NOT NULL AND "_exporter_version_id" IS NOT NULL));
ALTER TABLE reporting."account_profile" ADD CHECK(_null OR ("_operator_version_id" IS NOT NULL));
ALTER TABLE reporting.workspace_profiles ADD CHECK(_null OR _workspace_identity_id IS NOT NULL);
CREATE FUNCTION masterdata.guard_workspace_identity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW._null THEN RETURN NEW; END IF;
 IF NOT EXISTS(SELECT 1 FROM masterdata.workspace_identities w JOIN masterdata.annual_reports a ON a.id=w.annual_report_id JOIN masterdata.installation_versions i ON i.installation_id=a.installation_id JOIN masterdata.product_versions p ON p.product_id=w.product_id WHERE w.id=NEW._workspace_identity_id AND w.external_reference=NEW.f_id AND i.id=NEW._installation_version_id AND p.id=NEW._product_version_id) THEN RAISE EXCEPTION 'Workspace master identities do not match' USING ERRCODE='23514'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER workspace_identity BEFORE INSERT ON reporting.workspace_profiles FOR EACH ROW EXECUTE FUNCTION masterdata.guard_workspace_identity();
ALTER TABLE reporting.workspace_profiles DROP COLUMN f_year;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA masterdata FROM PUBLIC;
GRANT EXECUTE ON FUNCTION masterdata.resolve_version(text,text,jsonb,boolean),masterdata.bind_row(text,jsonb,jsonb),masterdata.workspace_context(text) TO certrace_reporting;
COMMIT;
