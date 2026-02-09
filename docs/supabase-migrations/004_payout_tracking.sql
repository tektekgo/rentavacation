-- ============================================================
-- PAYOUT TRACKING MIGRATION
-- Adds payout status tracking to bookings for owner visibility
-- ============================================================

-- Payout status enum
CREATE TYPE public.payout_status AS ENUM (
  'pending',      -- Awaiting stay completion
  'processing',   -- Stay completed, payout being processed
  'paid',         -- Payout sent to owner
  'failed'        -- Payout failed (requires retry)
);

-- Add payout tracking columns to bookings
ALTER TABLE public.bookings
ADD COLUMN payout_status public.payout_status DEFAULT 'pending',
ADD COLUMN payout_date TIMESTAMPTZ,
ADD COLUMN payout_reference TEXT,  -- Zelle confirmation, bank transfer ID, etc.
ADD COLUMN payout_notes TEXT;

-- Create index for payout queries
CREATE INDEX idx_bookings_payout_status ON public.bookings(payout_status);

-- Update existing completed bookings to have 'processing' payout status
UPDATE public.bookings 
SET payout_status = 'processing' 
WHERE status = 'completed' AND payout_status = 'pending';

-- ============================================================
-- DONE! Run this migration in your Supabase SQL Editor
-- ============================================================
