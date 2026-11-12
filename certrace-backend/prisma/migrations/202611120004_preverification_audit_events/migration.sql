BEGIN;
ALTER TABLE public.account_audit_events DROP CONSTRAINT account_audit_events_event_check;
ALTER TABLE public.account_audit_events ADD CONSTRAINT account_audit_events_event_check CHECK (event IN (
  'SUSPENDED', 'RESTORED', 'ANONYMISED', 'REGISTRATION_CONSENT', 'ADMIN_READY_CHANGED',
  'team.invite.created', 'team.invite.resent', 'team.invite.accepted', 'team.member.removed', 'team.invite.cancelled',
  'ADMIN_REJECTED', 'ADMIN_TRIAL_EXTENDED',
  'preverification.approved', 'preverification.changes_requested'
));
COMMIT;
