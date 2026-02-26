-- Migration 022: Stripe Connect for automated owner payouts
-- Adds Stripe Connect account fields to profiles and transfer tracking to bookings

-- 1. Add Stripe Connect fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;

-- 2. Add Stripe transfer tracking to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;

-- 3. Index for looking up bookings by transfer ID (webhook event lookup)
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_transfer_id ON bookings(stripe_transfer_id) WHERE stripe_transfer_id IS NOT NULL;

-- 4. Index for finding owners with Stripe Connect accounts
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id ON profiles(stripe_account_id) WHERE stripe_account_id IS NOT NULL;
