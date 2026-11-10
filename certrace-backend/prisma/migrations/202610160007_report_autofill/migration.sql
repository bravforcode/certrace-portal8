-- Extraction proposals are private, immutable inputs to an explicit review.
CREATE TABLE public.report_autofill_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  cache_key text NOT NULL,
  file_id text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  payload jsonb NOT NULL DEFAULT '{}',
  result jsonb NOT NULL DEFAULT '{}',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, cache_key)
);
CREATE INDEX report_autofill_workspace ON public.report_autofill_runs(user_id,workspace_id,created_at DESC);
ALTER TABLE public.report_autofill_runs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.report_autofill_runs TO certrace_reporting;
CREATE POLICY autofill_owner ON public.report_autofill_runs TO certrace_reporting
  USING (user_id = nullif(current_setting('certrace.user_id',true),'')::uuid)
  WITH CHECK (user_id = nullif(current_setting('certrace.user_id',true),'')::uuid);
