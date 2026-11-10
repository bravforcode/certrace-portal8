-- Preserve access for existing accounts; newly registered accounts await approval.
ALTER TABLE public.users ADD COLUMN ready BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.users ALTER COLUMN ready SET DEFAULT false;
