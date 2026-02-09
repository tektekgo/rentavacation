-- ============================================================
-- CANCELLATION POLICIES MIGRATION
-- Adds cancellation policy support to listings and booking cancellation tracking
-- ============================================================

-- Cancellation policy enum (owner selects when creating listing)
CREATE TYPE public.cancellation_policy AS ENUM (
  'flexible',    -- Full refund up to 24 hours before check-in
  'moderate',    -- Full refund up to 5 days before check-in, 50% after
  'strict',      -- 50% refund up to 7 days before check-in, no refund after
  'super_strict' -- No refunds after booking confirmed
);

-- Cancellation request status enum
CREATE TYPE public.cancellation_status AS ENUM (
  'pending',       -- Request submitted, awaiting owner response
  'approved',      -- Owner approved full/partial refund
  'denied',        -- Owner denied the request
  'counter_offer', -- Owner made a counter-offer
  'completed'      -- Cancellation processed, refund issued
);

-- Add cancellation policy to listings table
ALTER TABLE public.listings
ADD COLUMN cancellation_policy public.cancellation_policy NOT NULL DEFAULT 'moderate';

-- Create cancellation requests table for traveler-owner negotiation
CREATE TABLE public.cancellation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.cancellation_status NOT NULL DEFAULT 'pending',
  
  -- Request details
  reason TEXT NOT NULL,
  requested_refund_amount DECIMAL(10,2) NOT NULL, -- Amount traveler is asking for
  
  -- Policy-calculated amounts (for reference)
  policy_refund_amount DECIMAL(10,2) NOT NULL,    -- What policy says they should get
  days_until_checkin INTEGER NOT NULL,             -- Days until check-in at request time
  
  -- Owner response
  owner_response TEXT,
  counter_offer_amount DECIMAL(10,2),              -- Owner's counter-offer (if any)
  responded_at TIMESTAMPTZ,
  
  -- Final resolution
  final_refund_amount DECIMAL(10,2),               -- Actual refund processed
  refund_processed_at TIMESTAMPTZ,
  refund_reference TEXT,                           -- Stripe refund ID or manual reference
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_cancellation_requests_booking ON public.cancellation_requests(booking_id);
CREATE INDEX idx_cancellation_requests_requester ON public.cancellation_requests(requester_id);
CREATE INDEX idx_cancellation_requests_status ON public.cancellation_requests(status);
CREATE INDEX idx_listings_cancellation_policy ON public.listings(cancellation_policy);

-- RLS Policies for cancellation_requests
ALTER TABLE public.cancellation_requests ENABLE ROW LEVEL SECURITY;

-- Travelers can view and create requests for their bookings
CREATE POLICY "Travelers can view own cancellation requests"
  ON public.cancellation_requests FOR SELECT
  USING (requester_id = auth.uid());

CREATE POLICY "Travelers can create cancellation requests"
  ON public.cancellation_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

-- Owners can view requests for their listings
CREATE POLICY "Owners can view requests for their listings"
  ON public.cancellation_requests FOR SELECT
  USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.listings l ON b.listing_id = l.id
      WHERE l.owner_id = auth.uid()
    )
  );

-- Owners can update requests for their listings (to respond)
CREATE POLICY "Owners can respond to requests"
  ON public.cancellation_requests FOR UPDATE
  USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.listings l ON b.listing_id = l.id
      WHERE l.owner_id = auth.uid()
    )
  );

-- RAV team can view and update all requests
CREATE POLICY "RAV team full access to cancellation requests"
  ON public.cancellation_requests FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_roles 
      WHERE role IN ('rav_admin', 'rav_staff', 'rav_owner')
    )
  );

-- Function to calculate policy-based refund amount
CREATE OR REPLACE FUNCTION calculate_policy_refund(
  _total_amount DECIMAL,
  _policy public.cancellation_policy,
  _days_until_checkin INTEGER
) RETURNS DECIMAL AS $$
BEGIN
  CASE _policy
    WHEN 'flexible' THEN
      -- Full refund up to 24 hours before (1 day)
      IF _days_until_checkin >= 1 THEN
        RETURN _total_amount;
      ELSE
        RETURN 0;
      END IF;
    
    WHEN 'moderate' THEN
      -- Full refund 5+ days, 50% for 1-4 days, 0 for <1 day
      IF _days_until_checkin >= 5 THEN
        RETURN _total_amount;
      ELSIF _days_until_checkin >= 1 THEN
        RETURN _total_amount * 0.5;
      ELSE
        RETURN 0;
      END IF;
    
    WHEN 'strict' THEN
      -- 50% refund 7+ days, nothing after
      IF _days_until_checkin >= 7 THEN
        RETURN _total_amount * 0.5;
      ELSE
        RETURN 0;
      END IF;
    
    WHEN 'super_strict' THEN
      -- No refunds
      RETURN 0;
    
    ELSE
      RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DONE! Run this migration in your Supabase SQL Editor
-- on BOTH Dev and Prod projects
-- ============================================================
