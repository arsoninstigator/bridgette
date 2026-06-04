
ALTER TABLE public.published_boards ADD COLUMN IF NOT EXISTS owner_id uuid;

DROP POLICY IF EXISTS "anyone can publish" ON public.published_boards;
DROP POLICY IF EXISTS "anyone can update published snapshots" ON public.published_boards;

CREATE POLICY "authenticated users can publish own boards"
ON public.published_boards
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owners can update their published boards"
ON public.published_boards
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owners can delete their published boards"
ON public.published_boards
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());
