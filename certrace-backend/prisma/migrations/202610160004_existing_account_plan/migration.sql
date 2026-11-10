-- The previous backend had no plan assignment. Keep existing accounts usable
-- instead of turning their historic creation dates into expired trials.
UPDATE users
SET plan_id = 'standard'
WHERE created_at <= (
  SELECT finished_at
  FROM _prisma_migrations
  WHERE migration_name = '202610160003_account_plan'
  LIMIT 1
);
