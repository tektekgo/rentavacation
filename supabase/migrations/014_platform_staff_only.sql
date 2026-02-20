-- Phase: Pre-launch safety net
-- Add "Staff Only" mode to lock platform access to RAV team only

-- 1. Insert the system setting
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'platform_staff_only',
  '{"enabled": true}'::jsonb,
  'When enabled, only RAV team members can access the platform. All other users see a "Coming Soon" message.'
)
ON CONFLICT (setting_key) DO NOTHING;

-- 2. Update can_access_platform() to check staff-only mode
CREATE OR REPLACE FUNCTION can_access_platform(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approval_required BOOLEAN;
  staff_only BOOLEAN;
  user_status TEXT;
  user_is_rav_team BOOLEAN;
BEGIN
  -- Check if user is RAV team (they always have access)
  user_is_rav_team := public.is_rav_team(_user_id);
  IF user_is_rav_team THEN
    RETURN TRUE;
  END IF;

  -- Check if platform is in staff-only mode
  SELECT (setting_value->>'enabled')::boolean INTO staff_only
  FROM system_settings
  WHERE setting_key = 'platform_staff_only';

  IF staff_only IS TRUE THEN
    RETURN FALSE;
  END IF;

  -- Check if approval is required
  SELECT (setting_value->>'enabled')::boolean INTO approval_required
  FROM system_settings
  WHERE setting_key = 'require_user_approval';

  -- If approval not required, everyone can access
  IF approval_required IS NULL OR NOT approval_required THEN
    RETURN TRUE;
  END IF;

  -- Check user approval status
  SELECT approval_status INTO user_status
  FROM profiles
  WHERE id = _user_id;

  RETURN user_status = 'approved';
END;
$$;
