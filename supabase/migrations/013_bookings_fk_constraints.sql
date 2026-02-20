-- Migration 013: Add missing FK constraints on bookings table
-- Fixes: PROD admin dashboard 400 errors on Bookings, Financials, Escrow tabs
-- PostgREST requires explicit FK constraints for join queries like:
--   renter:profiles!bookings_renter_id_fkey(*)

DO $$
BEGIN
  -- bookings.renter_id → profiles.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_renter_id_fkey'
      AND table_name = 'bookings'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE bookings
    ADD CONSTRAINT bookings_renter_id_fkey
    FOREIGN KEY (renter_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  -- bookings.listing_id → listings.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_listing_id_fkey'
      AND table_name = 'bookings'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE bookings
    ADD CONSTRAINT bookings_listing_id_fkey
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;
  END IF;
END $$;
