-- ============================================================
-- VOICE USAGE LIMITS
-- Migration 008
-- ============================================================

-- ============================================================
-- 1. CREATE VOICE SEARCH USAGE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS voice_search_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  search_date DATE NOT NULL DEFAULT CURRENT_DATE,
  search_count INTEGER DEFAULT 0 CHECK (search_count >= 0),
  last_search_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, search_date)
);

COMMENT ON TABLE voice_search_usage IS 'Tracks daily voice search usage per user for quota enforcement';
COMMENT ON COLUMN voice_search_usage.search_count IS 'Number of voice searches used today';
COMMENT ON COLUMN voice_search_usage.last_search_at IS 'Timestamp of most recent voice search';

-- ============================================================
-- 2. CREATE INDEXES FOR FAST LOOKUPS
-- ============================================================

CREATE INDEX idx_voice_search_usage_user_date
  ON voice_search_usage(user_id, search_date);

CREATE INDEX idx_voice_search_usage_date
  ON voice_search_usage(search_date DESC);

-- ============================================================
-- 3. CREATE QUOTA MANAGEMENT FUNCTIONS
-- ============================================================

-- Function to increment voice search count
CREATE OR REPLACE FUNCTION increment_voice_search_count(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO voice_search_usage (user_id, search_date, search_count, last_search_at)
  VALUES (_user_id, CURRENT_DATE, 1, NOW())
  ON CONFLICT (user_id, search_date)
  DO UPDATE SET
    search_count = voice_search_usage.search_count + 1,
    last_search_at = NOW(),
    updated_at = NOW();
END;
$$;

COMMENT ON FUNCTION increment_voice_search_count IS 'Increments daily voice search counter for a user';

-- Function to get today's search count
CREATE OR REPLACE FUNCTION get_voice_search_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(search_count, 0)
  FROM voice_search_usage
  WHERE user_id = _user_id AND search_date = CURRENT_DATE;
$$;

COMMENT ON FUNCTION get_voice_search_count IS 'Returns number of voice searches used today by a user';

-- Function to check if user can make voice search
CREATE OR REPLACE FUNCTION can_use_voice_search(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  daily_limit INTEGER := 10;
  current_count INTEGER;
  user_is_rav_team BOOLEAN;
BEGIN
  -- RAV team has unlimited access
  user_is_rav_team := public.is_rav_team(_user_id);
  IF user_is_rav_team THEN
    RETURN TRUE;
  END IF;

  -- Check quota
  current_count := COALESCE(public.get_voice_search_count(_user_id), 0);
  RETURN current_count < daily_limit;
END;
$$;

COMMENT ON FUNCTION can_use_voice_search IS 'Checks if user has remaining voice search quota for today';

-- Function to get voice searches remaining
CREATE OR REPLACE FUNCTION get_voice_searches_remaining(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  daily_limit INTEGER := 10;
  current_count INTEGER;
  user_is_rav_team BOOLEAN;
BEGIN
  -- RAV team has unlimited
  user_is_rav_team := public.is_rav_team(_user_id);
  IF user_is_rav_team THEN
    RETURN 999;
  END IF;

  -- Calculate remaining
  current_count := COALESCE(public.get_voice_search_count(_user_id), 0);
  RETURN GREATEST(0, daily_limit - current_count);
END;
$$;

COMMENT ON FUNCTION get_voice_searches_remaining IS 'Returns number of voice searches remaining today';

-- ============================================================
-- 4. AUTO-UPDATE TRIGGER FOR updated_at
-- ============================================================

CREATE TRIGGER update_voice_search_usage_updated_at
  BEFORE UPDATE ON voice_search_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. ROW LEVEL SECURITY FOR VOICE_SEARCH_USAGE
-- ============================================================

ALTER TABLE voice_search_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own voice search usage"
  ON voice_search_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RAV team can view all usage (for analytics)
CREATE POLICY "RAV team can view all voice search usage"
  ON voice_search_usage FOR SELECT
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

-- ============================================================
-- 6. CLEANUP FUNCTION (for old data >90 days)
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_old_voice_usage()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM voice_search_usage
  WHERE search_date < CURRENT_DATE - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_voice_usage IS 'Deletes voice usage records older than 90 days';
