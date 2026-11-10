BEGIN;
ALTER TABLE public.users ADD COLUMN approved_at timestamptz;
ALTER TABLE public.users ADD COLUMN locale text NOT NULL DEFAULT 'en'
  CHECK (locale IN ('en','th'));
-- Accounts approved before this change keep their trial clock.
UPDATE public.users SET approved_at = updated_at WHERE ready AND approved_at IS NULL;

CREATE TABLE public.email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind)
);

ALTER TABLE public.account_audit_events DROP CONSTRAINT account_audit_events_event_check;
ALTER TABLE public.account_audit_events ADD CONSTRAINT account_audit_events_event_check CHECK (event IN (
  'SUSPENDED', 'RESTORED', 'ANONYMISED', 'REGISTRATION_CONSENT', 'ADMIN_READY_CHANGED',
  'team.invite.created', 'team.invite.resent', 'team.invite.accepted', 'team.member.removed', 'team.invite.cancelled',
  'ADMIN_REJECTED', 'ADMIN_TRIAL_EXTENDED'
));
COMMIT;
