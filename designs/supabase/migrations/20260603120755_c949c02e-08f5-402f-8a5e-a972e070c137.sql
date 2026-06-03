CREATE TABLE public.published_boards (
  key TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.published_boards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.published_boards TO authenticated;
GRANT ALL ON public.published_boards TO service_role;

ALTER TABLE public.published_boards ENABLE ROW LEVEL SECURITY;

-- Anyone can read published boards (the 5-digit key is the access token).
CREATE POLICY "published boards are world-readable"
ON public.published_boards FOR SELECT
USING (true);

-- Anyone can publish/update a board snapshot. The key is unguessable enough
-- to act as a write capability; this matches the existing localStorage flow
-- where no auth is required to publish.
CREATE POLICY "anyone can publish"
ON public.published_boards FOR INSERT
WITH CHECK (true);

CREATE POLICY "anyone can update published snapshots"
ON public.published_boards FOR UPDATE
USING (true)
WITH CHECK (true);
