BEGIN;
CREATE TABLE public.cookie_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  necessary boolean NOT NULL DEFAULT true,
  analytics boolean NOT NULL,
  marketing boolean NOT NULL,
  policy_version text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cookie_consents_visitor ON public.cookie_consents (visitor_id, created_at DESC);
COMMIT;
