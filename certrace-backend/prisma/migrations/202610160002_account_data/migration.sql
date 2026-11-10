CREATE TABLE account_records (
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 key text NOT NULL, value jsonb NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id, key),
 CHECK (length(key) BETWEEN 1 AND 250)
);
ALTER TABLE account_records ENABLE ROW LEVEL SECURITY;
CREATE TABLE account_files (
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 id text NOT NULL, filename text NOT NULL, content_type text NOT NULL,
 data bytea NOT NULL, sha256 varchar(64) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,id)
);
ALTER TABLE account_files ENABLE ROW LEVEL SECURITY;
CREATE TABLE rate_limits (
 key text PRIMARY KEY, count integer NOT NULL DEFAULT 1,
 expires_at timestamptz NOT NULL
);
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
