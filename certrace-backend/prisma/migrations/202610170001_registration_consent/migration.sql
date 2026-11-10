ALTER TABLE public.account_audit_events
  DROP CONSTRAINT account_audit_events_event_check;

ALTER TABLE public.account_audit_events
  ADD CONSTRAINT account_audit_events_event_check
  CHECK (event IN ('SUSPENDED', 'RESTORED', 'ANONYMISED', 'REGISTRATION_CONSENT'));
