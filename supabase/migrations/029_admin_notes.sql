-- Migration 029: Admin internal notes on user profiles
-- Adds a JSONB column for admin notes with timestamps and author tracking

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_notes jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN profiles.admin_notes IS 'Array of {id, text, author_id, author_name, created_at} objects for internal RAV team notes';

-- RLS: only RAV team can read/write admin_notes
-- The existing profiles RLS allows select for authenticated users, but we need to ensure
-- only RAV team can update the admin_notes column. We handle this in the application layer
-- since column-level RLS isn't supported in PostgreSQL. The existing update policy on profiles
-- already restricts updates to the user's own row, so admin updates use service role or
-- specific admin policies.

-- Create policy for RAV team to update any profile's admin_notes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'rav_team_update_admin_notes'
  ) THEN
    CREATE POLICY rav_team_update_admin_notes ON profiles
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid()
          AND user_roles.role IN ('rav_owner', 'rav_admin', 'rav_staff')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid()
          AND user_roles.role IN ('rav_owner', 'rav_admin', 'rav_staff')
        )
      );
  END IF;
END $$;
