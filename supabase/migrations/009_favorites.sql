-- Favorites table for persisting user favorites
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Unique constraint: user can only favorite a property once
ALTER TABLE favorites ADD CONSTRAINT favorites_user_property_unique UNIQUE (user_id, property_id);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users can read their own favorites
CREATE POLICY "Users can read own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- RAV team can read all favorites
CREATE POLICY "RAV team can read all favorites"
  ON favorites FOR SELECT
  USING (is_rav_team(auth.uid()));
