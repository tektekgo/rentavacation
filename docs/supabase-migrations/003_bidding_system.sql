-- ============================================================
-- BIDDING SYSTEM DATABASE SCHEMA
-- Adds bidding, travel requests, proposals, and notifications
-- ============================================================

-- ============================================================
-- 1. NEW ENUMS
-- ============================================================

-- Bid status for listing bids
CREATE TYPE public.bid_status AS ENUM (
  'pending',      -- Bid submitted, awaiting owner review
  'accepted',     -- Owner accepted the bid
  'rejected',     -- Owner rejected the bid
  'expired',      -- Bidding period ended without action
  'withdrawn'     -- Traveler withdrew their bid
);

-- Travel request status
CREATE TYPE public.travel_request_status AS ENUM (
  'open',         -- Actively seeking proposals
  'closed',       -- No longer accepting proposals
  'fulfilled',    -- Request was matched with a booking
  'expired',      -- Deadline passed without fulfillment
  'cancelled'     -- Traveler cancelled the request
);

-- Budget preference for travel requests
CREATE TYPE public.budget_preference AS ENUM (
  'range',        -- Traveler specifies min-max
  'ceiling',      -- Traveler specifies max only
  'undisclosed'   -- Traveler doesn't reveal budget
);

-- Proposal status
CREATE TYPE public.proposal_status AS ENUM (
  'pending',      -- Proposal submitted, awaiting traveler review
  'accepted',     -- Traveler accepted the proposal
  'rejected',     -- Traveler rejected the proposal
  'expired',      -- Travel request closed without acceptance
  'withdrawn'     -- Owner withdrew their proposal
);

-- Notification type
CREATE TYPE public.notification_type AS ENUM (
  -- Bid-related
  'new_bid_received',
  'bid_accepted',
  'bid_rejected',
  'bid_expired',
  'bidding_ending_soon',
  -- Travel request-related
  'new_travel_request_match',
  'new_proposal_received',
  'proposal_accepted',
  'proposal_rejected',
  'request_expiring_soon',
  -- General
  'booking_confirmed',
  'payment_received',
  'message_received'
);

-- ============================================================
-- 2. UPDATE LISTINGS TABLE FOR BIDDING
-- ============================================================

-- Add bidding fields to existing listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS open_for_bidding BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS bidding_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS min_bid_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS reserve_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS allow_counter_offers BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- 3. NEW TABLES
-- ============================================================

-- Listing Bids (Traveler bids on owner's listing)
CREATE TABLE public.listing_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.bid_status NOT NULL DEFAULT 'pending',
  bid_amount NUMERIC(10,2) NOT NULL,
  message TEXT,
  guest_count INTEGER NOT NULL DEFAULT 1,
  counter_offer_amount NUMERIC(10,2), -- Owner's counter offer if any
  counter_offer_message TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT positive_bid CHECK (bid_amount > 0)
);

-- Travel Requests (Traveler posts their needs)
CREATE TABLE public.travel_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.travel_request_status NOT NULL DEFAULT 'open',
  -- Location preferences
  destination_location TEXT NOT NULL, -- City, state, region
  destination_flexibility TEXT, -- "Anywhere in Florida", "Beach destinations", etc.
  -- Date preferences
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  dates_flexible BOOLEAN NOT NULL DEFAULT false,
  flexibility_days INTEGER DEFAULT 0, -- +/- days
  -- Party details
  guest_count INTEGER NOT NULL DEFAULT 1,
  bedrooms_needed INTEGER NOT NULL DEFAULT 1,
  -- Budget
  budget_preference public.budget_preference NOT NULL DEFAULT 'undisclosed',
  budget_min NUMERIC(10,2),
  budget_max NUMERIC(10,2),
  -- Requirements
  special_requirements TEXT,
  preferred_brands TEXT[], -- Array of vacation_club_brand values
  amenities_required TEXT[],
  -- Timing
  proposals_deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_request_dates CHECK (check_out_date > check_in_date),
  CONSTRAINT valid_budget_range CHECK (
    budget_preference != 'range' OR (budget_min IS NOT NULL AND budget_max IS NOT NULL AND budget_max >= budget_min)
  ),
  CONSTRAINT valid_ceiling CHECK (
    budget_preference != 'ceiling' OR budget_max IS NOT NULL
  )
);

-- Travel Proposals (Owner proposes their property for a travel request)
CREATE TABLE public.travel_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.travel_requests(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL, -- Optional: link to existing listing
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.proposal_status NOT NULL DEFAULT 'pending',
  proposed_price NUMERIC(10,2) NOT NULL,
  message TEXT,
  -- Proposed dates (may differ from request if flexible)
  proposed_check_in DATE NOT NULL,
  proposed_check_out DATE NOT NULL,
  -- Validity
  valid_until TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT positive_proposal_price CHECK (proposed_price > 0),
  CONSTRAINT valid_proposal_dates CHECK (proposed_check_out > proposed_check_in),
  -- Prevent duplicate proposals from same owner for same request
  UNIQUE(request_id, owner_id)
);

-- Notifications (In-app notification center)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  -- Related entities (one will be populated based on type)
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  bid_id UUID REFERENCES public.listing_bids(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.travel_requests(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES public.travel_proposals(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  -- Status
  read_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  -- Email preferences
  email_new_bid BOOLEAN NOT NULL DEFAULT true,
  email_bid_accepted BOOLEAN NOT NULL DEFAULT true,
  email_new_travel_request BOOLEAN NOT NULL DEFAULT true,
  email_new_proposal BOOLEAN NOT NULL DEFAULT true,
  email_proposal_accepted BOOLEAN NOT NULL DEFAULT true,
  email_bidding_ending BOOLEAN NOT NULL DEFAULT true,
  email_request_expiring BOOLEAN NOT NULL DEFAULT true,
  -- In-app preferences (all default to true)
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. INDEXES
-- ============================================================

-- Listing bids
CREATE INDEX idx_listing_bids_listing_id ON public.listing_bids(listing_id);
CREATE INDEX idx_listing_bids_bidder_id ON public.listing_bids(bidder_id);
CREATE INDEX idx_listing_bids_status ON public.listing_bids(status);

-- Travel requests
CREATE INDEX idx_travel_requests_traveler_id ON public.travel_requests(traveler_id);
CREATE INDEX idx_travel_requests_status ON public.travel_requests(status);
CREATE INDEX idx_travel_requests_destination ON public.travel_requests(destination_location);
CREATE INDEX idx_travel_requests_dates ON public.travel_requests(check_in_date, check_out_date);
CREATE INDEX idx_travel_requests_deadline ON public.travel_requests(proposals_deadline);

-- Travel proposals
CREATE INDEX idx_travel_proposals_request_id ON public.travel_proposals(request_id);
CREATE INDEX idx_travel_proposals_owner_id ON public.travel_proposals(owner_id);
CREATE INDEX idx_travel_proposals_status ON public.travel_proposals(status);

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Listings open for bidding
CREATE INDEX idx_listings_open_bidding ON public.listings(open_for_bidding, bidding_ends_at) 
WHERE open_for_bidding = true;

-- ============================================================
-- 5. SECURITY DEFINER FUNCTIONS
-- ============================================================

-- Check if user owns a listing
CREATE OR REPLACE FUNCTION public.owns_listing(_user_id UUID, _listing_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.listings
    WHERE id = _listing_id AND owner_id = _user_id
  )
$$;

-- Check if user owns a travel request
CREATE OR REPLACE FUNCTION public.owns_travel_request(_user_id UUID, _request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.travel_requests
    WHERE id = _request_id AND traveler_id = _user_id
  )
$$;

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS
ALTER TABLE public.listing_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- ----- LISTING BIDS -----
CREATE POLICY "Bidders can view own bids"
  ON public.listing_bids FOR SELECT
  TO authenticated
  USING (bidder_id = auth.uid());

CREATE POLICY "Listing owners can view bids on their listings"
  ON public.listing_bids FOR SELECT
  TO authenticated
  USING (public.owns_listing(auth.uid(), listing_id));

CREATE POLICY "Authenticated users can create bids"
  ON public.listing_bids FOR INSERT
  TO authenticated
  WITH CHECK (bidder_id = auth.uid());

CREATE POLICY "Bidders can update own pending bids"
  ON public.listing_bids FOR UPDATE
  TO authenticated
  USING (bidder_id = auth.uid() AND status = 'pending')
  WITH CHECK (bidder_id = auth.uid());

CREATE POLICY "Listing owners can update bids on their listings"
  ON public.listing_bids FOR UPDATE
  TO authenticated
  USING (public.owns_listing(auth.uid(), listing_id))
  WITH CHECK (public.owns_listing(auth.uid(), listing_id));

CREATE POLICY "RAV team can manage all bids"
  ON public.listing_bids FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()))
  WITH CHECK (public.is_rav_team(auth.uid()));

-- ----- TRAVEL REQUESTS -----
CREATE POLICY "Anyone can view open travel requests"
  ON public.travel_requests FOR SELECT
  TO authenticated
  USING (status = 'open' OR traveler_id = auth.uid() OR public.is_rav_team(auth.uid()));

CREATE POLICY "Travelers can create requests"
  ON public.travel_requests FOR INSERT
  TO authenticated
  WITH CHECK (traveler_id = auth.uid());

CREATE POLICY "Travelers can update own requests"
  ON public.travel_requests FOR UPDATE
  TO authenticated
  USING (traveler_id = auth.uid())
  WITH CHECK (traveler_id = auth.uid());

CREATE POLICY "Travelers can delete own open requests"
  ON public.travel_requests FOR DELETE
  TO authenticated
  USING (traveler_id = auth.uid() AND status = 'open');

CREATE POLICY "RAV team can manage all requests"
  ON public.travel_requests FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()))
  WITH CHECK (public.is_rav_team(auth.uid()));

-- ----- TRAVEL PROPOSALS -----
CREATE POLICY "Travelers can view proposals for their requests"
  ON public.travel_proposals FOR SELECT
  TO authenticated
  USING (public.owns_travel_request(auth.uid(), request_id));

CREATE POLICY "Owners can view own proposals"
  ON public.travel_proposals FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Property owners can create proposals"
  ON public.travel_proposals FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND 
    public.is_property_owner(auth.uid())
  );

CREATE POLICY "Owners can update own pending proposals"
  ON public.travel_proposals FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid() AND status = 'pending')
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Travelers can update proposal status on their requests"
  ON public.travel_proposals FOR UPDATE
  TO authenticated
  USING (public.owns_travel_request(auth.uid(), request_id))
  WITH CHECK (public.owns_travel_request(auth.uid(), request_id));

CREATE POLICY "RAV team can manage all proposals"
  ON public.travel_proposals FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()))
  WITH CHECK (public.is_rav_team(auth.uid()));

-- ----- NOTIFICATIONS -----
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Will be restricted by service role in edge functions

CREATE POLICY "RAV team can manage all notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()))
  WITH CHECK (public.is_rav_team(auth.uid()));

-- ----- NOTIFICATION PREFERENCES -----
CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own preferences"
  ON public.notification_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 7. TRIGGERS
-- ============================================================

-- Auto-update timestamps
CREATE TRIGGER update_listing_bids_updated_at
  BEFORE UPDATE ON public.listing_bids
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_travel_requests_updated_at
  BEFORE UPDATE ON public.travel_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_travel_proposals_updated_at
  BEFORE UPDATE ON public.travel_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 8. HELPER FUNCTIONS FOR BIDDING
-- ============================================================

-- Get highest bid for a listing
CREATE OR REPLACE FUNCTION public.get_highest_bid(_listing_id UUID)
RETURNS NUMERIC(10,2)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT MAX(bid_amount) FROM public.listing_bids
  WHERE listing_id = _listing_id AND status = 'pending'
$$;

-- Get bid count for a listing
CREATE OR REPLACE FUNCTION public.get_bid_count(_listing_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.listing_bids
  WHERE listing_id = _listing_id AND status = 'pending'
$$;

-- Get proposal count for a travel request
CREATE OR REPLACE FUNCTION public.get_proposal_count(_request_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.travel_proposals
  WHERE request_id = _request_id AND status = 'pending'
$$;

-- ============================================================
-- DONE! Bidding system schema is ready.
-- ============================================================
