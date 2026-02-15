-- ============================================================
-- Migration 011: Voice Toggles, Membership Tiers & Commission
-- ============================================================
-- Enables:
-- 1. Admin-controlled voice feature toggles (master + per-section)
-- 2. Membership tier data model (free/paid tiers for travelers & owners)
-- 3. Configurable platform commission with tier-based discounts
-- 4. Tier-aware voice quotas replacing hardcoded limits
-- ============================================================

-- ============================================================
-- A1. VOICE TOGGLE SETTINGS
-- ============================================================

INSERT INTO system_settings (setting_key, setting_value, description)
VALUES
  ('voice_enabled', '{"enabled": true}'::jsonb,
   'Master kill switch for all voice features'),
  ('voice_search_enabled', '{"enabled": true}'::jsonb,
   'Voice search on Rentals page'),
  ('voice_listing_enabled', '{"enabled": false}'::jsonb,
   'Voice-assisted listing creation (future)'),
  ('voice_bidding_enabled', '{"enabled": false}'::jsonb,
   'Voice-assisted bidding (future)')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================
-- A2. PLATFORM COMMISSION SETTING
-- ============================================================

INSERT INTO system_settings (setting_key, setting_value, description)
VALUES
  ('platform_commission_rate',
   '{"rate": 15, "pro_discount": 2, "business_discount": 5}'::jsonb,
   'Platform commission rate and tier-based discounts for owners')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================
-- A3. MEMBERSHIP TIERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS membership_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_key TEXT UNIQUE NOT NULL,
  role_category TEXT NOT NULL CHECK (role_category IN ('traveler', 'owner')),
  tier_name TEXT NOT NULL,
  tier_level INTEGER NOT NULL DEFAULT 0 CHECK (tier_level >= 0),
  monthly_price_cents INTEGER NOT NULL DEFAULT 0,
  voice_quota_daily INTEGER NOT NULL DEFAULT 5, -- -1 = unlimited
  commission_discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_active_listings INTEGER, -- NULL = unlimited
  features JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE membership_tiers IS 'Reference table defining membership tier configurations';
COMMENT ON COLUMN membership_tiers.voice_quota_daily IS '-1 means unlimited voice searches per day';
COMMENT ON COLUMN membership_tiers.max_active_listings IS 'NULL means unlimited active listings';

CREATE INDEX IF NOT EXISTS idx_membership_tiers_key ON membership_tiers(tier_key);
CREATE INDEX IF NOT EXISTS idx_membership_tiers_category ON membership_tiers(role_category);

-- Seed tier data
INSERT INTO membership_tiers (tier_key, role_category, tier_name, tier_level, monthly_price_cents, voice_quota_daily, commission_discount_pct, max_active_listings, is_default, description, features)
VALUES
  ('traveler_free', 'traveler', 'Free', 0, 0, 5, 0, NULL, TRUE,
   'Basic traveler access with limited voice searches',
   '["Browse listings", "Book properties", "Voice search (5/day)", "Favorites & alerts"]'::jsonb),
  ('traveler_plus', 'traveler', 'Plus', 1, 500, 25, 0, NULL, FALSE,
   'Enhanced traveler experience with more voice searches',
   '["Everything in Free", "Voice search (25/day)", "Priority support", "Early access to new listings"]'::jsonb),
  ('traveler_premium', 'traveler', 'Premium', 2, 1500, -1, 0, NULL, FALSE,
   'Unlimited traveler access with premium perks',
   '["Everything in Plus", "Unlimited voice searches", "Concierge support", "Price drop alerts", "Exclusive deals"]'::jsonb),
  ('owner_free', 'owner', 'Free', 0, 0, 5, 0, 3, TRUE,
   'Basic owner access to list vacation properties',
   '["List up to 3 properties", "Voice search (5/day)", "Basic analytics", "Email support"]'::jsonb),
  ('owner_pro', 'owner', 'Pro', 1, 1000, 25, 2, 10, FALSE,
   'Professional owner tools with reduced commission',
   '["Everything in Free", "List up to 10 properties", "Voice search (25/day)", "2% commission discount", "Priority listing placement"]'::jsonb),
  ('owner_business', 'owner', 'Business', 2, 2500, -1, 5, NULL, FALSE,
   'Unlimited owner access with maximum savings',
   '["Everything in Pro", "Unlimited listings", "Unlimited voice searches", "5% commission discount", "Dedicated account manager", "API access"]'::jsonb)
ON CONFLICT (tier_key) DO NOTHING;

-- ============================================================
-- A4. USER MEMBERSHIPS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES membership_tiers(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_memberships IS 'One active membership per user, linking to their membership tier';

CREATE INDEX IF NOT EXISTS idx_user_memberships_user ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_tier ON user_memberships(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);

-- Auto-update trigger
CREATE TRIGGER update_user_memberships_updated_at
  BEFORE UPDATE ON user_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_membership_tiers_updated_at
  BEFORE UPDATE ON membership_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- A5. RLS POLICIES
-- ============================================================

-- membership_tiers: readable by all authenticated, full access for RAV team
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can read membership tiers"
  ON membership_tiers FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "RAV team can manage membership tiers"
  ON membership_tiers FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

-- user_memberships: users read own, RAV team full access
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own membership"
  ON user_memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "RAV team can read all memberships"
  ON user_memberships FOR SELECT
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

CREATE POLICY "RAV team can manage all memberships"
  ON user_memberships FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

-- system_settings: add SELECT for all authenticated (needed for voice flags)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'system_settings'
      AND policyname = 'All authenticated can read system settings'
  ) THEN
    CREATE POLICY "All authenticated can read system settings"
      ON system_settings FOR SELECT
      TO authenticated
      USING (TRUE);
  END IF;
END $$;

-- ============================================================
-- A6. TIER-AWARE VOICE QUOTA RPCs
-- ============================================================

-- Helper: get user's daily voice quota from membership tier
CREATE OR REPLACE FUNCTION get_user_voice_quota(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _quota INTEGER;
  _is_rav BOOLEAN;
BEGIN
  -- RAV team always unlimited
  _is_rav := public.is_rav_team(_user_id);
  IF _is_rav THEN
    RETURN -1;
  END IF;

  -- Check membership tier
  SELECT mt.voice_quota_daily INTO _quota
  FROM user_memberships um
  JOIN membership_tiers mt ON mt.id = um.tier_id
  WHERE um.user_id = _user_id
    AND um.status = 'active';

  -- Default to 5 if no membership found
  RETURN COALESCE(_quota, 5);
END;
$$;

COMMENT ON FUNCTION get_user_voice_quota IS 'Returns daily voice search limit from user membership tier (-1=unlimited)';

-- Update can_use_voice_search to use tier quota
CREATE OR REPLACE FUNCTION can_use_voice_search(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  daily_limit INTEGER;
  current_count INTEGER;
BEGIN
  daily_limit := public.get_user_voice_quota(_user_id);

  -- Unlimited
  IF daily_limit = -1 THEN
    RETURN TRUE;
  END IF;

  -- Check quota
  current_count := COALESCE(public.get_voice_search_count(_user_id), 0);
  RETURN current_count < daily_limit;
END;
$$;

-- Update get_voice_searches_remaining to use tier quota
CREATE OR REPLACE FUNCTION get_voice_searches_remaining(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  daily_limit INTEGER;
  current_count INTEGER;
BEGIN
  daily_limit := public.get_user_voice_quota(_user_id);

  -- Unlimited
  IF daily_limit = -1 THEN
    RETURN 999;
  END IF;

  -- Calculate remaining
  current_count := COALESCE(public.get_voice_search_count(_user_id), 0);
  RETURN GREATEST(0, daily_limit - current_count);
END;
$$;

-- ============================================================
-- A7. COMMISSION RATE RPC
-- ============================================================

CREATE OR REPLACE FUNCTION get_owner_commission_rate(_owner_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _agreement_rate NUMERIC;
  _base_rate NUMERIC;
  _tier_discount NUMERIC;
  _commission_setting JSONB;
BEGIN
  -- 1. Check owner_agreements for per-owner override
  SELECT commission_rate INTO _agreement_rate
  FROM owner_agreements
  WHERE owner_id = _owner_id
    AND status = 'active'
  LIMIT 1;

  IF _agreement_rate IS NOT NULL THEN
    RETURN _agreement_rate;
  END IF;

  -- 2. Get platform base rate from system_settings
  SELECT setting_value INTO _commission_setting
  FROM system_settings
  WHERE setting_key = 'platform_commission_rate';

  _base_rate := COALESCE((_commission_setting->>'rate')::NUMERIC, 15);

  -- 3. Get tier discount
  SELECT COALESCE(mt.commission_discount_pct, 0) INTO _tier_discount
  FROM user_memberships um
  JOIN membership_tiers mt ON mt.id = um.tier_id
  WHERE um.user_id = _owner_id
    AND um.status = 'active';

  _tier_discount := COALESCE(_tier_discount, 0);

  RETURN _base_rate - _tier_discount;
END;
$$;

COMMENT ON FUNCTION get_owner_commission_rate IS 'Returns effective commission rate for an owner (agreement override > base rate - tier discount)';

-- ============================================================
-- A8. UPDATE handle_new_user TRIGGER
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
  _role_category TEXT;
  _default_tier_id UUID;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, approval_status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'pending_approval'
  );

  -- Read account_type from signup metadata (default: traveler)
  _account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'traveler');

  IF _account_type = 'owner' THEN
    _role := 'property_owner';
    _role_category := 'owner';
  ELSE
    _role := 'renter';
    _role_category := 'traveler';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  -- Auto-assign default free membership tier
  SELECT id INTO _default_tier_id
  FROM membership_tiers
  WHERE role_category = _role_category
    AND is_default = TRUE
  LIMIT 1;

  IF _default_tier_id IS NOT NULL THEN
    INSERT INTO user_memberships (user_id, tier_id, status)
    VALUES (NEW.id, _default_tier_id, 'active');
  END IF;

  RETURN NEW;
END;
$$;
