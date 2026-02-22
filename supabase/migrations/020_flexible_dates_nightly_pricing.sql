-- Phase 19: Flexible Date Booking + Per-Night Pricing
-- Adds nightly_rate to listings, proposed dates to bids, source listing to travel requests

-- PART 1: nightly_rate on listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS nightly_rate NUMERIC;

-- Backfill: nightly_rate = owner_price / num_nights (minimum 1 night)
UPDATE public.listings
SET nightly_rate = ROUND(owner_price / GREATEST((check_out_date::date - check_in_date::date), 1), 2)
WHERE nightly_rate IS NULL;

ALTER TABLE public.listings
  ALTER COLUMN nightly_rate SET NOT NULL,
  ALTER COLUMN nightly_rate SET DEFAULT 0;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_nightly_rate_nonneg CHECK (nightly_rate >= 0);

-- PART 2: Proposed dates on listing_bids (for "Propose Different Dates" feature)
ALTER TABLE public.listing_bids
  ADD COLUMN IF NOT EXISTS requested_check_in DATE,
  ADD COLUMN IF NOT EXISTS requested_check_out DATE;

ALTER TABLE public.listing_bids
  ADD CONSTRAINT bids_requested_dates_pair CHECK (
    (requested_check_in IS NULL AND requested_check_out IS NULL)
    OR (requested_check_in IS NOT NULL AND requested_check_out IS NOT NULL
        AND requested_check_out > requested_check_in)
  );

-- PART 3: source_listing_id + target_owner_only on travel_requests (for "Inspired By" feature)
ALTER TABLE public.travel_requests
  ADD COLUMN IF NOT EXISTS source_listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL;

ALTER TABLE public.travel_requests
  ADD COLUMN IF NOT EXISTS target_owner_only BOOLEAN NOT NULL DEFAULT false;
