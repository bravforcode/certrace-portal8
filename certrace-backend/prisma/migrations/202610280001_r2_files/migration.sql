BEGIN;
ALTER TABLE public.account_files ALTER COLUMN data DROP NOT NULL;
ALTER TABLE public.account_files ADD COLUMN object_key TEXT;
ALTER TABLE public.uploaded_files ADD COLUMN object_key TEXT;
COMMIT;
