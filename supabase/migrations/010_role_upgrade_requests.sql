-- ============================================================
-- Migration 010: Role Upgrade Requests
-- ============================================================
-- Enables:
-- 1. Signup role selection (traveler vs owner)
-- 2. Self-service role upgrade requests with approval workflow
-- 3. Auto-approve system setting
-- ============================================================

-- ============================================================
-- 1. UPDATE SIGNUP TRIGGER TO RESPECT ROLE SELECTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _account_type TEXT;
  _role app_role;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, approval_status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'pending_approval'
  );

  -- Read account_type from signup metadata (default: renter)
  _account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'traveler');

  IF _account_type = 'owner' THEN
    _role := 'property_owner';
  ELSE
    _role := 'renter';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. ROLE UPGRADE REQUESTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS role_upgrade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role app_role NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one pending request per user per role
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_upgrade_one_pending
  ON role_upgrade_requests (user_id, requested_role)
  WHERE status = 'pending';

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_role_upgrade_status
  ON role_upgrade_requests (status, created_at);

-- Updated_at trigger
CREATE TRIGGER set_role_upgrade_updated_at
  BEFORE UPDATE ON role_upgrade_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================

ALTER TABLE role_upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own requests
CREATE POLICY "Users read own role upgrade requests"
  ON role_upgrade_requests FOR SELECT
  USING (auth.uid() = user_id);

-- RAV team can read all requests
CREATE POLICY "RAV team reads all role upgrade requests"
  ON role_upgrade_requests FOR SELECT
  USING (is_rav_team(auth.uid()));

-- Users can insert their own requests
CREATE POLICY "Users insert own role upgrade requests"
  ON role_upgrade_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RAV team can update requests (approve/reject)
CREATE POLICY "RAV team updates role upgrade requests"
  ON role_upgrade_requests FOR UPDATE
  USING (is_rav_team(auth.uid()));

-- ============================================================
-- 4. RPC FUNCTIONS
-- ============================================================

-- Request a role upgrade
CREATE OR REPLACE FUNCTION request_role_upgrade(
  _requested_role app_role,
  _reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _request_id UUID;
  _auto_approve BOOLEAN := FALSE;
BEGIN
  -- Check user is authenticated
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check user doesn't already have this role
  IF EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _requested_role
  ) THEN
    RAISE EXCEPTION 'You already have the % role', _requested_role;
  END IF;

  -- Check no pending request exists
  IF EXISTS (
    SELECT 1 FROM role_upgrade_requests
    WHERE user_id = _user_id AND requested_role = _requested_role AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You already have a pending request for this role';
  END IF;

  -- Insert the request
  INSERT INTO role_upgrade_requests (user_id, requested_role, reason)
  VALUES (_user_id, _requested_role, _reason)
  RETURNING id INTO _request_id;

  -- Check auto-approve setting
  SELECT (setting_value->>'enabled')::boolean INTO _auto_approve
  FROM system_settings
  WHERE setting_key = 'auto_approve_role_upgrades';

  IF _auto_approve THEN
    -- Auto-approve: add role and update request
    INSERT INTO user_roles (user_id, role)
    VALUES (_user_id, _requested_role)
    ON CONFLICT DO NOTHING;

    UPDATE role_upgrade_requests
    SET status = 'approved', reviewed_at = NOW()
    WHERE id = _request_id;
  END IF;

  RETURN _request_id;
END;
$$;

-- Approve a role upgrade request (admin)
CREATE OR REPLACE FUNCTION approve_role_upgrade(
  _request_id UUID,
  _approved_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _req RECORD;
BEGIN
  -- Fetch request
  SELECT * INTO _req FROM role_upgrade_requests WHERE id = _request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF _req.status != 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  -- Add the role
  INSERT INTO user_roles (user_id, role)
  VALUES (_req.user_id, _req.requested_role)
  ON CONFLICT DO NOTHING;

  -- Update request
  UPDATE role_upgrade_requests
  SET status = 'approved',
      reviewed_by = _approved_by,
      reviewed_at = NOW()
  WHERE id = _request_id;

  RETURN TRUE;
END;
$$;

-- Reject a role upgrade request (admin)
CREATE OR REPLACE FUNCTION reject_role_upgrade(
  _request_id UUID,
  _rejected_by UUID,
  _reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _req RECORD;
BEGIN
  -- Fetch request
  SELECT * INTO _req FROM role_upgrade_requests WHERE id = _request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF _req.status != 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  -- Update request
  UPDATE role_upgrade_requests
  SET status = 'rejected',
      reviewed_by = _rejected_by,
      reviewed_at = NOW(),
      rejection_reason = _reason
  WHERE id = _request_id;

  RETURN TRUE;
END;
$$;

-- ============================================================
-- 5. SYSTEM SETTING: AUTO-APPROVE ROLE UPGRADES
-- ============================================================

INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'auto_approve_role_upgrades',
  '{"enabled": false}'::jsonb,
  'When enabled, role upgrade requests are automatically approved without admin review'
)
ON CONFLICT (setting_key) DO NOTHING;
