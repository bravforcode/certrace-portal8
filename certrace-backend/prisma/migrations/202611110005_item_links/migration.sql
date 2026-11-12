BEGIN;
CREATE TABLE public.item_links (
  token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  installation_id text NOT NULL CHECK (installation_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  year integer NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  item_key text NOT NULL CHECK (char_length(item_key) BETWEEN 1 AND 200),
  created_by uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX item_links_workbook_idx ON public.item_links (user_id, installation_id, year);
COMMIT;
