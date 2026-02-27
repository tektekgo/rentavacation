-- Migration 028: Rate limiting for edge functions
-- Protects payment, chat, and sensitive endpoints from abuse

-- Rate limit entries table (sliding window tracking)
CREATE TABLE IF NOT EXISTS rate_limit_entries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_user_endpoint ON rate_limit_entries (user_id, endpoint, created_at DESC);

-- Auto-cleanup: entries older than 10 minutes are useless
-- (longest window is 60 seconds, but keep buffer for clock skew)

-- RPC: check_rate_limit — returns TRUE if allowed, FALSE if rate-limited
-- Also records the request if allowed, and prunes old entries
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INT,
  p_window_seconds INT DEFAULT 60
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_count INT;
  cutoff TIMESTAMPTZ;
BEGIN
  cutoff := NOW() - (p_window_seconds || ' seconds')::interval;

  -- Count recent requests within window
  SELECT COUNT(*) INTO request_count
  FROM rate_limit_entries
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND created_at > cutoff;

  IF request_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;

  -- Record this request
  INSERT INTO rate_limit_entries (user_id, endpoint)
  VALUES (p_user_id, p_endpoint);

  -- Prune old entries for this user/endpoint (keep table lean)
  DELETE FROM rate_limit_entries
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND created_at <= cutoff;

  RETURN TRUE;
END;
$$;

-- RLS: Only service_role can access this table (edge functions use service role)
ALTER TABLE rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- No user-facing policies — only service_role (used by edge functions) can read/write
-- This is intentional: rate limiting is a server-side concern
