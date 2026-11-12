BEGIN;
CREATE TABLE public.preverifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  installation_id text NOT NULL CHECK (installation_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  year integer NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  standard_id text NOT NULL CHECK (standard_id ~ '^[a-z0-9-]{1,32}$'),
  status text NOT NULL CHECK (status IN ('ai_flagged', 'team_review', 'approved', 'changes_requested')),
  workbook_revision integer NOT NULL,
  ai_findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_summary text NOT NULL DEFAULT '',
  ai_model text,
  team_note text NOT NULL DEFAULT '',
  submitted_by uuid NOT NULL REFERENCES public.users(id),
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE INDEX preverifications_lookup_idx ON public.preverifications (company_id, installation_id, year, standard_id, submitted_at DESC);
CREATE INDEX preverifications_status_idx ON public.preverifications (status);
COMMIT;
