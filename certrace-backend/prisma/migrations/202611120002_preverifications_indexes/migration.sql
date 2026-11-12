BEGIN;
DROP INDEX public.preverifications_status_idx;
CREATE INDEX preverifications_status_submitted_idx ON public.preverifications (status, submitted_at DESC);
-- At most one open review per workbook revision, so two concurrent submits cannot both be queued.
CREATE UNIQUE INDEX preverifications_one_review_idx ON public.preverifications (company_id, installation_id, year, standard_id, workbook_revision) WHERE status = 'team_review';
COMMIT;
