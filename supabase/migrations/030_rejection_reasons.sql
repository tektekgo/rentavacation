-- Migration 030: Rejection reasons for listings and profiles
-- Adds rejection_reason columns so users see why they were rejected

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rejection_reason text;

COMMENT ON COLUMN listings.rejection_reason IS 'Admin-provided reason when listing is rejected';
COMMENT ON COLUMN profiles.rejection_reason IS 'Admin-provided reason when user account is rejected';
