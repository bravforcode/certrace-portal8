BEGIN;

-- Company identities stay keyed by the original owner's ID. Existing contacts
-- are reviewer references, and are never promoted to memberships by migration.
CREATE TABLE masterdata.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES masterdata.accounts ON DELETE CASCADE,
  email text NOT NULL CHECK (email = lower(trim(email))),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  delivered boolean NOT NULL DEFAULT false,
  UNIQUE (account_id, email)
);
CREATE INDEX account_members_user ON masterdata.account_members(user_id);

ALTER TABLE reporting.records ADD COLUMN actor_id uuid DEFAULT nullif(current_setting('certrace.actor_id',true),'')::uuid;
ALTER TABLE public.account_audit_events DROP CONSTRAINT account_audit_events_event_check;
ALTER TABLE public.account_audit_events ADD CONSTRAINT account_audit_events_event_check CHECK (event IN (
  'SUSPENDED', 'RESTORED', 'ANONYMISED', 'REGISTRATION_CONSENT', 'ADMIN_READY_CHANGED',
  'team.invite.created', 'team.invite.resent', 'team.invite.accepted', 'team.member.removed', 'team.invite.cancelled'
));

COMMIT;
