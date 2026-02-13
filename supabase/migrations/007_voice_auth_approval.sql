-- ============================================================
-- VOICE AUTH & APPROVAL SYSTEM
-- Migration 007
-- ============================================================

-- ============================================================
-- 1. ADD APPROVAL COLUMNS TO PROFILES TABLE
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending_approval'
  CHECK (approval_status IN ('pending_approval', 'approved', 'rejected'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN profiles.approval_status IS 'User approval status for platform access';
COMMENT ON COLUMN profiles.approved_by IS 'RAV team member who approved/rejected the user';
COMMENT ON COLUMN profiles.approved_at IS 'Timestamp when user was approved';
COMMENT ON COLUMN profiles.rejection_reason IS 'Optional reason for rejection';

-- ============================================================
-- 2. CREATE INDEXES FOR APPROVAL QUERIES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_approval_status
  ON profiles(approval_status);

CREATE INDEX IF NOT EXISTS idx_profiles_approved_at
  ON profiles(approved_at DESC);

-- ============================================================
-- 3. MIGRATE EXISTING USERS TO 'APPROVED' STATUS
-- ============================================================

-- Approve all existing users (they signed up before this system)
UPDATE profiles
SET approval_status = 'approved',
    approved_at = NOW()
WHERE approval_status = 'pending_approval';

-- ============================================================
-- 4. UPDATE SIGNUP TRIGGER TO SET PENDING STATUS
-- ============================================================

-- Modify existing handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, approval_status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'pending_approval'  -- Default to pending
  );

  -- Default role: renter
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'renter');

  RETURN NEW;
END;
$$;

-- ============================================================
-- 5. CREATE SYSTEM SETTINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default setting: Approval required = ON
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'require_user_approval',
  '{"enabled": true}'::jsonb,
  'When enabled, new user signups must be approved by RAV admin before they can access the platform'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key
  ON system_settings(setting_key);

-- ============================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================

-- Function to check if user can access platform
CREATE OR REPLACE FUNCTION can_access_platform(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approval_required BOOLEAN;
  user_status TEXT;
  user_is_rav_team BOOLEAN;
BEGIN
  -- Check if approval is required
  SELECT (setting_value->>'enabled')::boolean INTO approval_required
  FROM system_settings
  WHERE setting_key = 'require_user_approval';

  -- If approval not required, everyone can access
  IF approval_required IS NULL OR NOT approval_required THEN
    RETURN TRUE;
  END IF;

  -- Check if user is RAV team (they always have access)
  user_is_rav_team := public.is_rav_team(_user_id);
  IF user_is_rav_team THEN
    RETURN TRUE;
  END IF;

  -- Check user approval status
  SELECT approval_status INTO user_status
  FROM profiles
  WHERE id = _user_id;

  RETURN user_status = 'approved';
END;
$$;

-- Function to approve user
CREATE OR REPLACE FUNCTION approve_user(
  _user_id UUID,
  _approved_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify approver is RAV team
  IF NOT public.is_rav_team(_approved_by) THEN
    RAISE EXCEPTION 'Only RAV team members can approve users';
  END IF;

  -- Update user status
  UPDATE profiles
  SET
    approval_status = 'approved',
    approved_by = _approved_by,
    approved_at = NOW(),
    rejection_reason = NULL
  WHERE id = _user_id;

  RETURN FOUND;
END;
$$;

-- Function to reject user
CREATE OR REPLACE FUNCTION reject_user(
  _user_id UUID,
  _rejected_by UUID,
  _reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify rejector is RAV team
  IF NOT public.is_rav_team(_rejected_by) THEN
    RAISE EXCEPTION 'Only RAV team members can reject users';
  END IF;

  -- Update user status
  UPDATE profiles
  SET
    approval_status = 'rejected',
    approved_by = _rejected_by,
    approved_at = NOW(),
    rejection_reason = _reason
  WHERE id = _user_id;

  RETURN FOUND;
END;
$$;

-- ============================================================
-- 7. ROW LEVEL SECURITY FOR SYSTEM SETTINGS
-- ============================================================

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read system settings
CREATE POLICY "Anyone can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only RAV team can update system settings
CREATE POLICY "Only RAV team can update system settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()))
  WITH CHECK (public.is_rav_team(auth.uid()));

-- ============================================================
-- 8. UPDATE PROFILES RLS TO ALLOW APPROVAL STATUS QUERIES
-- ============================================================

-- RAV team can see all profiles (for approval dashboard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'RAV team can view all profiles'
  ) THEN
    CREATE POLICY "RAV team can view all profiles"
      ON profiles FOR SELECT
      TO authenticated
      USING (public.is_rav_team(auth.uid()));
  END IF;
END
$$;
