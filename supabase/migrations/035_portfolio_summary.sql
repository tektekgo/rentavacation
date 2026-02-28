-- Migration 035: Portfolio summary RPC for multi-property owners
-- Groups analytics by property for portfolio dashboard

CREATE OR REPLACE FUNCTION get_owner_portfolio_summary(p_owner_id uuid)
RETURNS TABLE (
  property_id uuid,
  resort_name text,
  location text,
  brand text,
  listing_count bigint,
  active_listing_count bigint,
  total_revenue numeric,
  total_bookings bigint,
  avg_nightly_rate numeric
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id AS property_id,
    p.resort_name,
    p.location,
    p.brand,
    COUNT(DISTINCT l.id) AS listing_count,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'active') AS active_listing_count,
    COALESCE(SUM(b.owner_payout) FILTER (WHERE b.status IN ('confirmed', 'completed')), 0) AS total_revenue,
    COUNT(DISTINCT b.id) FILTER (WHERE b.status IN ('confirmed', 'completed')) AS total_bookings,
    COALESCE(AVG(l.nightly_rate), 0) AS avg_nightly_rate
  FROM properties p
  LEFT JOIN listings l ON l.property_id = p.id
  LEFT JOIN bookings b ON b.listing_id = l.id
  WHERE p.owner_id = p_owner_id
  GROUP BY p.id, p.resort_name, p.location, p.brand
  ORDER BY total_revenue DESC;
$$;
