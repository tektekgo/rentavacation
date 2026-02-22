-- ============================================================
-- Migration 021: Voice Admin Controls & Observability
-- ============================================================
-- Enables:
-- 1. Per-search logging for observability (voice_search_logs)
-- 2. Per-user voice access overrides (voice_user_overrides)
-- 3. Alert threshold system_settings
-- 4. Updated get_user_voice_quota() with override support
-- 5. RPCs: log_voice_search, get_voice_usage_stats, get_voice_top_users
-- ============================================================

-- ============================================================
-- B1. VOICE SEARCH LOGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS voice_search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  search_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  results_count INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'no_results', 'timeout')),
  error_message TEXT,
  source TEXT NOT NULL DEFAULT 'voice' CHECK (source IN ('voice', 'text_chat')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE voice_search_logs IS 'Per-search log for voice/chat observability (not a daily aggregate)';
COMMENT ON COLUMN voice_search_logs.search_params IS 'Anonymized: destination, dates, budget, bedrooms — never raw transcript';
COMMENT ON COLUMN voice_search_logs.latency_ms IS 'Client-measured round-trip time in milliseconds';

CREATE INDEX IF NOT EXISTS idx_voice_search_logs_created ON voice_search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_search_logs_user ON voice_search_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_search_logs_status ON voice_search_logs(status);

-- ============================================================
-- B2. VOICE USER OVERRIDES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS voice_user_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  voice_disabled BOOLEAN NOT NULL DEFAULT FALSE,
  custom_quota_daily INTEGER, -- NULL = tier default, -1 = unlimited
  reason TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE voice_user_overrides IS 'Per-user voice access controls set by admin (separate from profiles per CLAUDE.md convention)';
COMMENT ON COLUMN voice_user_overrides.custom_quota_daily IS 'NULL = tier default, -1 = unlimited, 0 = disabled';

CREATE INDEX IF NOT EXISTS idx_voice_user_overrides_user ON voice_user_overrides(user_id);

CREATE TRIGGER update_voice_user_overrides_updated_at
  BEFORE UPDATE ON voice_user_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- B3. RLS POLICIES
-- ============================================================

-- voice_search_logs: RAV team SELECT all, users INSERT own + SELECT own
ALTER TABLE voice_search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own voice search logs"
  ON voice_search_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own voice search logs"
  ON voice_search_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "RAV team can read all voice search logs"
  ON voice_search_logs FOR SELECT
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

-- voice_user_overrides: RAV team full access, users read own
ALTER TABLE voice_user_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own voice override"
  ON voice_user_overrides FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "RAV team can manage voice overrides"
  ON voice_user_overrides FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

-- ============================================================
-- B4. ALERT THRESHOLD SYSTEM SETTINGS
-- ============================================================

INSERT INTO system_settings (setting_key, setting_value, description)
VALUES
  ('voice_alert_error_rate_threshold',
   '{"threshold_pct": 10, "window_hours": 1, "enabled": false}'::jsonb,
   'Alert when voice search error rate exceeds threshold in rolling window'),
  ('voice_alert_daily_volume_threshold',
   '{"min_expected": 5, "max_expected": 500, "enabled": false}'::jsonb,
   'Alert when daily voice search volume is outside expected range')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================
-- B5. UPDATED get_user_voice_quota() WITH OVERRIDE SUPPORT
-- ============================================================

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
  _override RECORD;
BEGIN
  -- RAV team always unlimited (immune to overrides)
  _is_rav := public.is_rav_team(_user_id);
  IF _is_rav THEN
    RETURN -1;
  END IF;

  -- Check per-user overrides
  SELECT voice_disabled, custom_quota_daily
  INTO _override
  FROM voice_user_overrides
  WHERE user_id = _user_id;

  IF FOUND THEN
    -- voice_disabled = true → return 0 (blocked)
    IF _override.voice_disabled THEN
      RETURN 0;
    END IF;
    -- custom_quota_daily set → use it
    IF _override.custom_quota_daily IS NOT NULL THEN
      RETURN _override.custom_quota_daily;
    END IF;
  END IF;

  -- Fall back to membership tier
  SELECT mt.voice_quota_daily INTO _quota
  FROM user_memberships um
  JOIN membership_tiers mt ON mt.id = um.tier_id
  WHERE um.user_id = _user_id
    AND um.status = 'active';

  -- Default to 5 if no membership found
  RETURN COALESCE(_quota, 5);
END;
$$;

-- ============================================================
-- B6. log_voice_search RPC
-- ============================================================

CREATE OR REPLACE FUNCTION log_voice_search(
  _search_params JSONB DEFAULT '{}'::jsonb,
  _results_count INTEGER DEFAULT 0,
  _latency_ms INTEGER DEFAULT NULL,
  _status TEXT DEFAULT 'success',
  _error_message TEXT DEFAULT NULL,
  _source TEXT DEFAULT 'voice'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
  _user_id UUID;
BEGIN
  _user_id := auth.uid();

  INSERT INTO voice_search_logs (user_id, search_params, results_count, latency_ms, status, error_message, source)
  VALUES (_user_id, _search_params, _results_count, _latency_ms, _status, _error_message, _source)
  RETURNING id INTO _log_id;

  RETURN _log_id;
END;
$$;

COMMENT ON FUNCTION log_voice_search IS 'Logs a single voice/chat search for observability';

-- ============================================================
-- B7. get_voice_usage_stats RPC
-- ============================================================

CREATE OR REPLACE FUNCTION get_voice_usage_stats(_days INTEGER DEFAULT 30)
RETURNS TABLE (
  search_date DATE,
  total_searches BIGINT,
  unique_users BIGINT,
  success_count BIGINT,
  error_count BIGINT,
  no_results_count BIGINT,
  timeout_count BIGINT,
  avg_latency_ms NUMERIC,
  avg_results_count NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- RAV team only
  IF NOT public.is_rav_team(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    (vsl.created_at AT TIME ZONE 'UTC')::DATE AS search_date,
    COUNT(*)::BIGINT AS total_searches,
    COUNT(DISTINCT vsl.user_id)::BIGINT AS unique_users,
    COUNT(*) FILTER (WHERE vsl.status = 'success')::BIGINT AS success_count,
    COUNT(*) FILTER (WHERE vsl.status = 'error')::BIGINT AS error_count,
    COUNT(*) FILTER (WHERE vsl.status = 'no_results')::BIGINT AS no_results_count,
    COUNT(*) FILTER (WHERE vsl.status = 'timeout')::BIGINT AS timeout_count,
    ROUND(AVG(vsl.latency_ms)::NUMERIC, 0) AS avg_latency_ms,
    ROUND(AVG(vsl.results_count)::NUMERIC, 1) AS avg_results_count
  FROM voice_search_logs vsl
  WHERE vsl.created_at >= NOW() - (_days || ' days')::INTERVAL
  GROUP BY (vsl.created_at AT TIME ZONE 'UTC')::DATE
  ORDER BY search_date DESC;
END;
$$;

COMMENT ON FUNCTION get_voice_usage_stats IS 'Daily aggregate stats for voice search observability (RAV team only)';

-- ============================================================
-- B8. get_voice_top_users RPC
-- ============================================================

CREATE OR REPLACE FUNCTION get_voice_top_users(
  _days INTEGER DEFAULT 30,
  _limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  total_searches BIGINT,
  success_count BIGINT,
  error_count BIGINT,
  success_rate NUMERIC,
  last_search_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- RAV team only
  IF NOT public.is_rav_team(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    vsl.user_id,
    p.email,
    p.full_name,
    COUNT(*)::BIGINT AS total_searches,
    COUNT(*) FILTER (WHERE vsl.status = 'success')::BIGINT AS success_count,
    COUNT(*) FILTER (WHERE vsl.status = 'error')::BIGINT AS error_count,
    CASE
      WHEN COUNT(*) > 0 THEN ROUND(
        (COUNT(*) FILTER (WHERE vsl.status = 'success')::NUMERIC / COUNT(*)::NUMERIC) * 100, 1
      )
      ELSE 0
    END AS success_rate,
    MAX(vsl.created_at) AS last_search_at
  FROM voice_search_logs vsl
  LEFT JOIN profiles p ON p.id = vsl.user_id
  WHERE vsl.created_at >= NOW() - (_days || ' days')::INTERVAL
    AND vsl.user_id IS NOT NULL
  GROUP BY vsl.user_id, p.email, p.full_name
  ORDER BY total_searches DESC
  LIMIT _limit;
END;
$$;

COMMENT ON FUNCTION get_voice_top_users IS 'Top voice search users by volume with success rates (RAV team only)';
