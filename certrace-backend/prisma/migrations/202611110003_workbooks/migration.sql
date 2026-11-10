BEGIN;
CREATE TABLE public.workbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  installation_id text NOT NULL CHECK (installation_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  year integer NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  cells jsonb NOT NULL DEFAULT '{}'::jsonb,
  editors jsonb NOT NULL DEFAULT '{}'::jsonb,
  revision integer NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, installation_id, year)
);
COMMIT;
