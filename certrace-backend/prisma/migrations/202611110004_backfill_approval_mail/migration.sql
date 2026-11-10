-- Accounts already approved before the lifecycle emails existed must not get the
-- "approved, trial starts today" mail when an admin re-saves them. Record the
-- delivery as already sent for every ready account.
INSERT INTO public.email_deliveries (user_id, kind)
SELECT id, 'account_approved' FROM public.users WHERE ready
ON CONFLICT DO NOTHING;
