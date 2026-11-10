-- Synthetic data only. Includes both the old JSON and current typed profile history.
BEGIN;
SET LOCAL certrace.user_id = '00000000-0000-4000-8000-000000000001';
INSERT INTO public.users(id,email,password_hash,google_sub,first_name,last_name,company_name,onboarded,plan_id)
VALUES ('00000000-0000-4000-8000-000000000001','preserve@example.test','synthetic-password-hash','synthetic-google-sub','สมชาย','保留','Original company',true,'standard'),
('00000000-0000-4000-8000-000000000002','incomplete@example.test','synthetic-other-hash',NULL,NULL,NULL,NULL,false,'trial');
INSERT INTO masterdata.accounts(id) SELECT id FROM public.users;
INSERT INTO masterdata.account_members(account_id,user_id,role) SELECT id,id,'owner' FROM public.users;
INSERT INTO masterdata.organizations(id,account_id,external_reference) VALUES
('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','profile-company');
INSERT INTO masterdata.organization_versions(id,organization_id,version_no,fingerprint,name,country) VALUES
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',1,'preserved-v1','Pinned company','TH'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001',2,'preserved-v2','Newer company','CN');
INSERT INTO masterdata.organization_heads(organization_id,version_id) VALUES
('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002');
INSERT INTO public.account_records(user_id,key,value,revision) VALUES
('00000000-0000-4000-8000-000000000001','certrace:profile','{"goalAchieve":["Custom | answer","Custom | answer"],"phone":"+66 0123","cbamProductCount":"10+"}',4),
('00000000-0000-4000-8000-000000000002','certrace:profile','{"firstName":"Incomplete","goalAchieve":[],"lineId":""}',2);
INSERT INTO reporting.records(id,user_id,key,revision) VALUES
('30000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','certrace:profile',1),
('30000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','certrace:profile',2);
INSERT INTO reporting.account_profile(_id,_parent_id,_slot,_operator_version_id,
"f_firstName","p_firstName","f_lastName","p_lastName","f_jobTitle","p_jobTitle","p_companyName","p_jurisdiction",
"f_sector","p_sector","f_installationId","p_installationId","f_currency","p_currency","f_unit","p_unit",
"f_cbamProductCount","p_cbamProductCount","f_supplierCount","p_supplierCount","f_installationCount","p_installationCount","f_customerCount","p_customerCount",
"f_hearAbout","p_hearAbout","f_phone","p_phone","f_lineId","p_lineId","f_onboarded","p_onboarded") VALUES
('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','root','20000000-0000-4000-8000-000000000001',
'สมชาย',true,'保留',true,'Operations',true,true,true,'steel',true,'factory-original',true,'THB',true,'tCO2e',true,
'10+',true,'1–5',true,'2',true,'Unknown band',true,'Other: custom answer',true,'+66 0123',true,'line_001',true,false,true),
('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','root','20000000-0000-4000-8000-000000000001',
'สมชาย',true,'保留',true,'Operations',true,true,true,'steel',true,'factory-original',true,'THB',true,'tCO2e',true,
'10+',true,'1–5',true,'2',true,'Unknown band',true,'Other: custom answer',true,'+66 0123',true,'line_001',true,false,true);
DO $$ DECLARE field text; container uuid; profile uuid; BEGIN
  FOREACH profile IN ARRAY ARRAY['40000000-0000-4000-8000-000000000001'::uuid,'40000000-0000-4000-8000-000000000002'::uuid] LOOP
    FOREACH field IN ARRAY ARRAY['goalachieve','currentmanagement','biggestchallenge'] LOOP
      container:=gen_random_uuid();
      EXECUTE format('INSERT INTO reporting.%I(_id,_parent_id,_slot) VALUES($1,$2,$3)','profile_'||field) USING container,profile,field;
      EXECUTE format('INSERT INTO reporting.%I(_parent_id,_slot,f__value,p__value) VALUES($1,''0'',''Custom | ไทย'',true),($1,''1'',''Custom | ไทย'',true)','profile_'||field||'_items') USING container;
    END LOOP;
  END LOOP;
END $$;
UPDATE reporting.records SET sealed=true WHERE key='certrace:profile';
INSERT INTO reporting.record_heads(user_id,key,revision) VALUES('00000000-0000-4000-8000-000000000001','certrace:profile',2);
INSERT INTO public.account_files(user_id,id,filename,content_type,data,sha256) VALUES
('00000000-0000-4000-8000-000000000001','preserved-file','original.bin','application/octet-stream',decode('0001ff','hex'),encode(sha256(decode('0001ff','hex')),'hex'));
COMMIT;
