ALTER TABLE users ADD COLUMN plan_id text NOT NULL DEFAULT 'trial';
ALTER TABLE users ADD COLUMN trial_started_at timestamptz NOT NULL DEFAULT now();
UPDATE users SET trial_started_at = created_at;
