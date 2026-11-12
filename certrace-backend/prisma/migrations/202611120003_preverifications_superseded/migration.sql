BEGIN;
ALTER TABLE public.preverifications DROP CONSTRAINT preverifications_status_check;
ALTER TABLE public.preverifications ADD CONSTRAINT preverifications_status_check
  CHECK (status IN ('ai_flagged', 'team_review', 'approved', 'changes_requested', 'superseded'));
COMMIT;
