-- Existing accounts also wait for an admin to grant access.
UPDATE public.users SET ready = false WHERE ready = true;
