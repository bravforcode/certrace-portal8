-- Run only against an isolated database containing reporting-3nf.sql.
-- The fixtures below roll back. In the isolated database, first create stubs:
-- CREATE TABLE public.users(id uuid PRIMARY KEY);
-- CREATE TABLE public.default_emission_factors(id uuid PRIMARY KEY, route text);
-- Then load reporting-3nf.sql before running this file.
BEGIN;
SET search_path=reporting,public;
CREATE FUNCTION pg_temp.expect_failure(statement text, expected_state text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual_state text;
BEGIN
  BEGIN EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS actual_state=RETURNED_SQLSTATE;
    IF actual_state=expected_state THEN RETURN; END IF;
    RAISE EXCEPTION 'Expected %, got % for %: %',expected_state,actual_state,statement,SQLERRM;
  END;
  RAISE EXCEPTION 'Expected rejection %, but statement succeeded: %',expected_state,statement;
END $$;

DO $$
DECLARE actor uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid();
  org_a uuid:=gen_random_uuid(); org_b uuid:=gen_random_uuid(); ov_a uuid:=gen_random_uuid(); ov_b uuid:=gen_random_uuid();
  site_a uuid:=gen_random_uuid(); site_b uuid:=gen_random_uuid(); sv_a uuid:=gen_random_uuid(); sv_b uuid:=gen_random_uuid();
  report_a uuid:=gen_random_uuid(); report_b uuid:=gen_random_uuid(); rev_a uuid:=gen_random_uuid(); rev_b uuid:=gen_random_uuid();
  blob_a uuid:=gen_random_uuid(); blob_b uuid:=gen_random_uuid(); doc_a uuid:=gen_random_uuid(); dv_a uuid:=gen_random_uuid();
  run_a uuid:=gen_random_uuid(); release uuid:=gen_random_uuid(); actual numeric;
BEGIN
  IF (SELECT count(*) FROM input_topics) <> 218 THEN RAISE EXCEPTION 'Missing numbered input definitions'; END IF;
  INSERT INTO public.users(id) VALUES(actor);
  INSERT INTO accounts(id,name) VALUES(a,'Design test A'),(b,'Design test B');
  INSERT INTO account_members VALUES(a,actor,'owner');
  INSERT INTO countries VALUES('TH','Thailand');
  INSERT INTO units VALUES('t','t','mass'),('GJ','GJ','energy');
  INSERT INTO cn_codes VALUES('72083900','Steel');
  INSERT INTO production_routes VALUES('eaf','Electric arc furnace'),('other','Other');
  INSERT INTO organizations(id,account_id) VALUES(org_a,a),(org_b,b);
  INSERT INTO organization_versions(id,organization_id,version_no,legal_name,country_code)
    VALUES(ov_a,org_a,1,'Operator A','TH'),(ov_b,org_b,1,'Operator B','TH');
  INSERT INTO installations(id,account_id,reference) VALUES(site_a,a,'TH-A'),(site_b,b,'TH-B');
  INSERT INTO installation_versions(id,installation_id,version_no,operator_version_id,name_english)
    VALUES(sv_a,site_a,1,ov_a,'Plant A'),(sv_b,site_b,1,ov_b,'Plant B');
  PERFORM pg_temp.expect_failure(format('INSERT INTO installation_versions(installation_id,version_no,operator_version_id) VALUES(%L,2,%L)',site_a,ov_b),'23514');
  INSERT INTO annual_reports(id,installation_id,reporting_year) VALUES(report_a,site_a,2026),(report_b,site_b,2026);
  PERFORM pg_temp.expect_failure(format('INSERT INTO annual_reports(installation_id,reporting_year) VALUES(%L,2026)',site_a),'23505');
  PERFORM pg_temp.expect_failure(format('INSERT INTO report_revisions(report_id,revision_no,installation_version_id,created_by) VALUES(%L,1,%L,%L)',report_a,sv_b,actor),'23514');
  INSERT INTO report_revisions(id,report_id,revision_no,installation_version_id,created_by)
    VALUES(rev_a,report_a,1,sv_a,actor),(rev_b,report_b,1,sv_b,actor);
  PERFORM pg_temp.expect_failure(format('INSERT INTO report_revisions(report_id,revision_no,installation_version_id,created_by) VALUES(%L,2,%L,%L)',report_a,sv_a,actor),'23505');
  PERFORM pg_temp.expect_failure(format('UPDATE report_revisions SET monitoring_start=''2025-01-01'' WHERE id=%L',rev_a),'23514');
  PERFORM pg_temp.expect_failure(format('INSERT INTO report_months(revision_id,month) VALUES(%L,''2025-12-01'')',rev_a),'23514');
  PERFORM pg_temp.expect_failure(format('INSERT INTO report_months(revision_id,month) VALUES(%L,''2026-01-02'')',rev_a),'23514');
  INSERT INTO report_months(revision_id,month) VALUES(rev_a,'2026-01-01'),(rev_b,'2026-01-01');
  INSERT INTO production_processes(revision_id,process_key,name) VALUES(rev_a,'p1','Melting'),(rev_b,'only-b','Foreign process');
  INSERT INTO process_routes VALUES(rev_a,'p1','eaf');
  INSERT INTO report_goods(revision_id,good_key,process_key,name,cn_code,output_unit)
    VALUES(rev_a,'g1','p1','Steel','72083900','t'),(rev_a,'g2','p1','Another good','72083900','t');
  PERFORM pg_temp.expect_failure(format('INSERT INTO report_goods(revision_id,good_key,process_key) VALUES(%L,''bad'',''only-b'')',rev_a),'23503');
  INSERT INTO good_routes VALUES(rev_a,'g1','eaf');
  PERFORM pg_temp.expect_failure(format('INSERT INTO good_routes VALUES(%L,''g1'',''other'')',rev_a),'23514');
  INSERT INTO good_compositions VALUES(rev_a,'c1','g1','Composition 1'),(rev_a,'c2','g2','Composition 2');
  PERFORM pg_temp.expect_failure(format('INSERT INTO production_outputs(revision_id,output_key,month,good_key,composition_key) VALUES(%L,''bad'',''2026-01-01'',''g1'',''c2'')',rev_a),'23514');
  INSERT INTO production_outputs(revision_id,output_key,month,good_key,route_code,composition_key,quantity,physical_tonnes)
    VALUES(rev_a,'o1','2026-01-01','g1','eaf','c1',0,0);
  SELECT quantity INTO actual FROM production_outputs WHERE revision_id=rev_a AND output_key='o1';
  IF actual IS DISTINCT FROM 0 THEN RAISE EXCEPTION 'Measured zero was not preserved'; END IF;
  INSERT INTO monitored_sources VALUES(rev_a,'f1','fuel','Gas',NULL),(rev_a,'e1','electricity','Grid',NULL);
  INSERT INTO fuel_sources(revision_id,source_key,other_description) VALUES(rev_a,'f1','Gas');
  PERFORM pg_temp.expect_failure(format('INSERT INTO fuel_sources(revision_id,source_key) VALUES(%L,''e1'')',rev_a),'23514');
  INSERT INTO source_readings VALUES(rev_a,'r1','2026-01-01','f1');
  INSERT INTO fuel_readings(revision_id,reading_key,burned_quantity,quantity_unit,emission_factor)
    VALUES(rev_a,'r1',10,'t',0.123456789012);
  SELECT emission_factor INTO actual FROM fuel_readings WHERE revision_id=rev_a AND reading_key='r1';
  IF actual IS DISTINCT FROM 0.123456789012::numeric THEN RAISE EXCEPTION 'Decimal precision was lost'; END IF;
  PERFORM pg_temp.expect_failure(format('UPDATE fuel_readings SET burned_quantity=-1 WHERE revision_id=%L',rev_a),'23514');
  PERFORM pg_temp.expect_failure(format('UPDATE fuel_readings SET biomass_fraction=1.1 WHERE revision_id=%L',rev_a),'23514');
  PERFORM pg_temp.expect_failure(format('INSERT INTO source_process_allocations VALUES(%L,''r1'',''p1'',101)',rev_a),'23514');
  INSERT INTO source_process_allocations VALUES(rev_a,'r1','p1',100);
  INSERT INTO file_objects(id,account_id,sha256,content_type,bytes)
    VALUES(blob_a,a,encode(sha256('a'::bytea),'hex'),'application/pdf','a'::bytea),
          (blob_b,b,encode(sha256('b'::bytea),'hex'),'application/pdf','b'::bytea);
  INSERT INTO documents(id,account_id,document_type) VALUES(doc_a,a,'meter_log');
  PERFORM pg_temp.expect_failure(format('INSERT INTO document_versions(document_id,version_no,original_filename,file_object_id) VALUES(%L,1,''bad.pdf'',%L)',doc_a,blob_b),'23514');
  INSERT INTO document_versions(id,document_id,version_no,original_filename,file_object_id) VALUES(dv_a,doc_a,1,'meter.pdf',blob_a);
  INSERT INTO evidence_items(revision_id,evidence_key,document_version_id,month) VALUES(rev_a,'ev1',dv_a,'2026-01-01');
  PERFORM pg_temp.expect_failure(format('INSERT INTO evidence_items(revision_id,evidence_key,document_version_id) VALUES(%L,''foreign'',%L)',rev_b,dv_a),'23514');
  INSERT INTO reading_evidence VALUES(rev_a,'r1','ev1');
  PERFORM pg_temp.expect_failure(format('INSERT INTO reading_evidence VALUES(%L,''r1'',''missing'')',rev_a),'23503');
  INSERT INTO precursor_sources(revision_id,source_key,source_kind) VALUES(rev_a,'internal1','internal');
  INSERT INTO internal_precursor_sources VALUES(rev_a,'internal1','g1');
  PERFORM pg_temp.expect_failure(format('INSERT INTO default_precursor_sources(revision_id,source_key,precursor_product_id) VALUES(%L,''internal1'',%L)',rev_a,gen_random_uuid()),'23514');
  PERFORM pg_temp.expect_failure(format('INSERT INTO monthly_topic_decisions VALUES(%L,''2026-01-01'',''2.3.35'',false,NULL)',rev_a),'23514');
  INSERT INTO monthly_topic_decisions VALUES(rev_a,'2026-01-01','2.3.35',false,'No CEMS at this installation');
  INSERT INTO sector_parameter_definitions VALUES('x','steel','Measured x','numeric','t','Test definition');
  PERFORM pg_temp.expect_failure(format('INSERT INTO text_sector_observations VALUES(%L,''c1'',''x'',''wrong type'')',rev_a),'23514');
  INSERT INTO numeric_sector_observations VALUES(rev_a,'c1','x',12.5);
  INSERT INTO regulatory_releases VALUES(release,'design-test','Test reference','2026-01-01');
  PERFORM pg_temp.expect_failure(format('INSERT INTO calculation_runs(revision_id,engine_version,regulatory_release_id,input_digest) VALUES(%L,''test'',%L,''draft'')',rev_a,release),'23514');
  UPDATE report_revisions SET status='submitted',locked_at=now() WHERE id=rev_a;
  INSERT INTO calculation_runs(id,revision_id,engine_version,regulatory_release_id,input_digest)
    VALUES(run_a,rev_a,'test',release,'test-input-digest');
  INSERT INTO calculation_process_results VALUES(run_a,'p1',100,NULL,10);
  PERFORM pg_temp.expect_failure(format('INSERT INTO calculation_process_results VALUES(%L,''only-b'',1,1,1)',run_a),'23514');
  PERFORM pg_temp.expect_failure(format('UPDATE installations SET account_id=%L WHERE id=%L',b,site_a),'23514');
  PERFORM pg_temp.expect_failure(format('UPDATE fuel_readings SET burned_quantity=11 WHERE revision_id=%L',rev_a),'23514');
  PERFORM pg_temp.expect_failure(format('DELETE FROM report_months WHERE revision_id=%L',rev_a),'23514');
  PERFORM pg_temp.expect_failure(format('UPDATE report_revisions SET monitoring_start=''2026-02-01'' WHERE id=%L',rev_a),'23514');
  INSERT INTO report_revisions(report_id,revision_no,installation_version_id,created_by,supersedes_revision_id,correction_reason)
    VALUES(report_a,2,sv_a,actor,rev_a,'Correct reading');
  PERFORM pg_temp.expect_failure(format('UPDATE report_revisions SET supersedes_revision_id=%L WHERE id=%L',rev_a,rev_b),'23514');
  RAISE NOTICE 'Design checks passed: 218 references; ownership; uniqueness; scoped foreign keys; dates; numeric precision; subtypes; evidence; correction locks.';
END $$;
ROLLBACK;
