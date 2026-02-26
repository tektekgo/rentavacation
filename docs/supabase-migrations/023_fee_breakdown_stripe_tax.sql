-- Migration 023: Fee breakdown fields for Phase 20A/B
-- Adds cleaning_fee, resort_fee to listings
-- Adds fee breakdown fields to bookings for itemized receipts + tax tracking

-- Listings: optional cleaning fee and resort fee (display only)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS cleaning_fee numeric DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS resort_fee numeric DEFAULT 0;

-- Bookings: itemized fee breakdown + tax fields
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS base_amount numeric;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_fee numeric;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cleaning_fee numeric DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tax_rate numeric DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tax_jurisdiction text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_tax_calculation_id text;

-- Backfill base_amount and service_fee from existing bookings
-- base_amount = total_amount - rav_commission (approximate)
-- service_fee = rav_commission
UPDATE bookings SET
  base_amount = total_amount - rav_commission,
  service_fee = rav_commission
WHERE base_amount IS NULL;
