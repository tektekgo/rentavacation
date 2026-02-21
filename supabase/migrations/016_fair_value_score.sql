-- Migration 016: Fair Value Score
-- Adds calculate_fair_value_score() RPC function
-- No new tables — uses existing listings, properties, listing_bids

CREATE OR REPLACE FUNCTION public.calculate_fair_value_score(p_listing_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_listing listings%ROWTYPE;
  v_property properties%ROWTYPE;
  v_p25 NUMERIC;
  v_p75 NUMERIC;
  v_avg_bid NUMERIC;
  v_bid_count INTEGER;
  v_tier TEXT;
  v_comparable_count INTEGER;
BEGIN
  -- Get listing and property
  SELECT * INTO v_listing FROM listings WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('tier', 'insufficient_data', 'comparable_count', 0);
  END IF;

  SELECT * INTO v_property FROM properties WHERE id = v_listing.property_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('tier', 'insufficient_data', 'comparable_count', 0);
  END IF;

  -- Find comparable accepted bids (same city, same bedrooms, ±45 days)
  SELECT
    percentile_cont(0.25) WITHIN GROUP (ORDER BY lb.bid_amount),
    percentile_cont(0.75) WITHIN GROUP (ORDER BY lb.bid_amount),
    AVG(lb.bid_amount),
    COUNT(*)
  INTO v_p25, v_p75, v_avg_bid, v_comparable_count
  FROM listing_bids lb
  JOIN listings l ON lb.listing_id = l.id
  JOIN properties p ON l.property_id = p.id
  WHERE lb.status = 'accepted'
    AND p.location ILIKE '%' || split_part(v_property.location, ',', 1) || '%'
    AND p.bedrooms = v_property.bedrooms
    AND l.check_in_date BETWEEN v_listing.check_in_date - 45
                             AND v_listing.check_in_date + 45
    AND lb.listing_id != p_listing_id;

  -- Widen search if insufficient data
  IF v_comparable_count < 3 THEN
    SELECT
      percentile_cont(0.25) WITHIN GROUP (ORDER BY lb.bid_amount),
      percentile_cont(0.75) WITHIN GROUP (ORDER BY lb.bid_amount),
      AVG(lb.bid_amount),
      COUNT(*)
    INTO v_p25, v_p75, v_avg_bid, v_comparable_count
    FROM listing_bids lb
    JOIN listings l ON lb.listing_id = l.id
    JOIN properties p ON l.property_id = p.id
    WHERE lb.status = 'accepted'
      AND p.bedrooms = v_property.bedrooms
      AND l.check_in_date BETWEEN v_listing.check_in_date - 90
                               AND v_listing.check_in_date + 90
      AND lb.listing_id != p_listing_id;
  END IF;

  -- Return null score if still insufficient
  IF v_comparable_count < 3 THEN
    RETURN jsonb_build_object(
      'tier', 'insufficient_data',
      'comparable_count', v_comparable_count
    );
  END IF;

  -- Calculate tier
  IF v_listing.final_price < v_p25 THEN
    v_tier := 'below_market';
  ELSIF v_listing.final_price > v_p75 THEN
    v_tier := 'above_market';
  ELSE
    v_tier := 'fair_value';
  END IF;

  RETURN jsonb_build_object(
    'tier', v_tier,
    'range_low', ROUND(v_p25),
    'range_high', ROUND(v_p75),
    'avg_accepted_bid', ROUND(v_avg_bid),
    'comparable_count', v_comparable_count,
    'listing_price', v_listing.final_price
  );
END;
$$;
