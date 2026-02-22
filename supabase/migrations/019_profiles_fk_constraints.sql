-- ============================================================
-- Migration 019: Add direct FK constraints to profiles table
-- ============================================================
-- Fixes: PostgREST 400 errors on all profile embedding queries
--
-- Root cause: All user-related FK columns reference auth.users(id),
-- which lives in the 'auth' schema. PostgREST can only traverse FKs
-- within the exposed 'public' schema. So queries like:
--   .select('*, owner:profiles!listings_owner_id_fkey(*)')
-- fail with PGRST200 "Could not find a relationship".
--
-- Fix: Drop the auth.users FKs and recreate with the same constraint
-- names pointing to profiles(id). Since profiles.id references
-- auth.users(id), referential integrity is maintained transitively.
-- ============================================================

DO $$
BEGIN

  -- ========================================
  -- 1. properties.owner_id → profiles(id)
  -- ========================================
  ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;
  ALTER TABLE properties
    ADD CONSTRAINT properties_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

  -- ========================================
  -- 2. listings.owner_id → profiles(id)
  -- ========================================
  ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_owner_id_fkey;
  ALTER TABLE listings
    ADD CONSTRAINT listings_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

  -- ========================================
  -- 3. bookings.renter_id → profiles(id)
  -- ========================================
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_renter_id_fkey;
  ALTER TABLE bookings
    ADD CONSTRAINT bookings_renter_id_fkey
    FOREIGN KEY (renter_id) REFERENCES profiles(id) ON DELETE RESTRICT;

  -- ========================================
  -- 4. listing_bids.bidder_id → profiles(id)
  -- ========================================
  ALTER TABLE listing_bids DROP CONSTRAINT IF EXISTS listing_bids_bidder_id_fkey;
  ALTER TABLE listing_bids
    ADD CONSTRAINT listing_bids_bidder_id_fkey
    FOREIGN KEY (bidder_id) REFERENCES profiles(id) ON DELETE CASCADE;

  -- ========================================
  -- 5. travel_requests.traveler_id → profiles(id)
  -- ========================================
  ALTER TABLE travel_requests DROP CONSTRAINT IF EXISTS travel_requests_traveler_id_fkey;
  ALTER TABLE travel_requests
    ADD CONSTRAINT travel_requests_traveler_id_fkey
    FOREIGN KEY (traveler_id) REFERENCES profiles(id) ON DELETE CASCADE;

  -- ========================================
  -- 6. travel_proposals.owner_id → profiles(id)
  -- ========================================
  ALTER TABLE travel_proposals DROP CONSTRAINT IF EXISTS travel_proposals_owner_id_fkey;
  ALTER TABLE travel_proposals
    ADD CONSTRAINT travel_proposals_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

  -- ========================================
  -- 7. booking_confirmations.owner_id → profiles(id)
  -- ========================================
  ALTER TABLE booking_confirmations DROP CONSTRAINT IF EXISTS booking_confirmations_owner_id_fkey;
  ALTER TABLE booking_confirmations
    ADD CONSTRAINT booking_confirmations_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

  -- ========================================
  -- 8. checkin_confirmations.traveler_id → profiles(id)
  -- ========================================
  ALTER TABLE checkin_confirmations DROP CONSTRAINT IF EXISTS checkin_confirmations_traveler_id_fkey;
  ALTER TABLE checkin_confirmations
    ADD CONSTRAINT checkin_confirmations_traveler_id_fkey
    FOREIGN KEY (traveler_id) REFERENCES profiles(id) ON DELETE CASCADE;

  -- ========================================
  -- 9. role_upgrade_requests.user_id → profiles(id)
  -- ========================================
  ALTER TABLE role_upgrade_requests DROP CONSTRAINT IF EXISTS role_upgrade_requests_user_id_fkey;
  ALTER TABLE role_upgrade_requests
    ADD CONSTRAINT role_upgrade_requests_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

  -- ========================================
  -- 10. owner_verifications.owner_id → profiles(id)
  -- ========================================
  ALTER TABLE owner_verifications DROP CONSTRAINT IF EXISTS owner_verifications_owner_id_fkey;
  ALTER TABLE owner_verifications
    ADD CONSTRAINT owner_verifications_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

END $$;
