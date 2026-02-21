-- Migration 017: Owner Dashboard
-- Adds maintenance fee tracking to profiles + RPC functions for owner dashboard

-- Add maintenance fees to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS annual_maintenance_fees NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS maintenance_fee_updated_at TIMESTAMPTZ;

-- Owner dashboard stats RPC
CREATE OR REPLACE FUNCTION public.get_owner_dashboard_stats(p_owner_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_total_earned NUMERIC;
  v_active_listings INTEGER;
  v_active_bids INTEGER;
  v_maintenance_fees NUMERIC;
  v_year_start DATE;
BEGIN
  v_year_start := DATE_TRUNC('year', CURRENT_DATE);

  -- Total earned this year (owner_payout from confirmed bookings)
  SELECT COALESCE(SUM(b.owner_payout), 0)
  INTO v_total_earned
  FROM bookings b
  JOIN listings l ON b.listing_id = l.id
  WHERE l.owner_id = p_owner_id
    AND b.status IN ('confirmed', 'completed')
    AND b.paid_at >= v_year_start;

  -- Active listings count
  SELECT COUNT(*) INTO v_active_listings
  FROM listings
  WHERE owner_id = p_owner_id AND status = 'active';

  -- Active bids count (pending bids across all owner's active listings)
  SELECT COUNT(*) INTO v_active_bids
  FROM listing_bids lb
  JOIN listings l ON lb.listing_id = l.id
  WHERE l.owner_id = p_owner_id AND lb.status = 'pending';

  -- Maintenance fees from profile
  SELECT annual_maintenance_fees INTO v_maintenance_fees
  FROM profiles WHERE id = p_owner_id;

  RETURN jsonb_build_object(
    'total_earned_ytd', v_total_earned,
    'active_listings', v_active_listings,
    'active_bids', v_active_bids,
    'annual_maintenance_fees', v_maintenance_fees,
    'fees_covered_percent',
      CASE WHEN v_maintenance_fees > 0
        THEN ROUND((v_total_earned / v_maintenance_fees) * 100)
        ELSE NULL
      END
  );
END;
$$;

-- Monthly earnings for chart (last 12 months)
CREATE OR REPLACE FUNCTION public.get_owner_monthly_earnings(p_owner_id UUID)
RETURNS TABLE(month DATE, earnings NUMERIC, booking_count INTEGER)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('month', b.paid_at)::DATE AS month,
    COALESCE(SUM(b.owner_payout), 0) AS earnings,
    COUNT(*)::INTEGER AS booking_count
  FROM bookings b
  JOIN listings l ON b.listing_id = l.id
  WHERE l.owner_id = p_owner_id
    AND b.status IN ('confirmed', 'completed')
    AND b.paid_at >= NOW() - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', b.paid_at)
  ORDER BY month ASC;
END;
$$;
