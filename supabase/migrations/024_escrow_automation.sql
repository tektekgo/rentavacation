-- Migration 024: Escrow release automation
-- Adds payout hold capability and tracks automated releases

-- Add payout hold columns to booking_confirmations
ALTER TABLE booking_confirmations
  ADD COLUMN IF NOT EXISTS payout_held boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_held_reason text,
  ADD COLUMN IF NOT EXISTS payout_held_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS auto_released boolean DEFAULT false;

-- Add index for the automation query: find verified escrows ready for release
CREATE INDEX IF NOT EXISTS idx_booking_confirmations_escrow_release
  ON booking_confirmations (escrow_status)
  WHERE escrow_status = 'verified' AND payout_held = false;
