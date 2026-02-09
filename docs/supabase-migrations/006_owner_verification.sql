-- Migration 006: Owner Verification, Trust Levels & Escrow Milestones
-- This creates a comprehensive trust & safety system for the RAV platform

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Owner trust levels (graduated trust system)
CREATE TYPE public.owner_trust_level AS ENUM (
  'new',           -- Just signed up, no verified stays
  'verified',      -- Documents verified, < 3 successful stays
  'trusted',       -- 3+ successful stays, good standing
  'premium'        -- 10+ stays, zero issues, priority support
);

-- Verification document types
CREATE TYPE public.verification_doc_type AS ENUM (
  'timeshare_deed',
  'membership_certificate',
  'resort_contract',
  'points_statement',
  'government_id',
  'utility_bill',
  'other'
);

-- Verification status
CREATE TYPE public.verification_status AS ENUM (
  'pending',
  'under_review',
  'approved',
  'rejected',
  'expired'
);

-- Escrow milestone status
CREATE TYPE public.escrow_status AS ENUM (
  'pending_confirmation',   -- Waiting for owner to provide resort confirmation
  'confirmation_submitted', -- Owner submitted, RAV verifying
  'verified',               -- RAV verified with resort
  'released',               -- Funds released to owner
  'refunded',               -- Funds refunded to traveler
  'disputed'                -- Under investigation
);

-- =============================================================================
-- OWNER VERIFICATION TABLE
-- =============================================================================

CREATE TABLE public.owner_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trust level (starts as 'new')
  trust_level owner_trust_level NOT NULL DEFAULT 'new',
  
  -- KYC Status
  kyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
  kyc_verified_at TIMESTAMPTZ,
  kyc_provider VARCHAR(50), -- e.g., 'stripe_identity'
  kyc_reference_id VARCHAR(255), -- External provider reference
  
  -- Identity verification
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_number VARCHAR(20),
  phone_verified_at TIMESTAMPTZ,
  
  -- Overall verification status
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Trust metrics
  successful_stays INTEGER NOT NULL DEFAULT 0,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  cancellation_count INTEGER NOT NULL DEFAULT 0,
  dispute_count INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3, 2),
  
  -- Limits based on trust level
  max_active_listings INTEGER NOT NULL DEFAULT 3,
  max_listing_value DECIMAL(10, 2) NOT NULL DEFAULT 5000.00,
  security_deposit_required BOOLEAN NOT NULL DEFAULT TRUE,
  security_deposit_amount DECIMAL(10, 2) DEFAULT 500.00,
  security_deposit_paid BOOLEAN NOT NULL DEFAULT FALSE,
  security_deposit_paid_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(owner_id)
);

-- =============================================================================
-- VERIFICATION DOCUMENTS TABLE
-- =============================================================================

CREATE TABLE public.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_id UUID NOT NULL REFERENCES public.owner_verifications(id) ON DELETE CASCADE,
  
  -- Document details
  doc_type verification_doc_type NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase storage
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Verification
  status verification_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason TEXT,
  
  -- Expiry tracking
  expires_at DATE,
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- BOOKING CONFIRMATIONS TABLE (Resort Confirmation Tracking)
-- =============================================================================

CREATE TABLE public.booking_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Confirmation details (submitted by owner after traveler books)
  resort_confirmation_number VARCHAR(100),
  confirmation_screenshot_path TEXT, -- Path in storage
  confirmation_submitted_at TIMESTAMPTZ,
  confirmation_deadline TIMESTAMPTZ NOT NULL, -- 48 hours after booking
  
  -- RAV verification
  verified_by_rav BOOLEAN NOT NULL DEFAULT FALSE,
  rav_verifier_id UUID REFERENCES auth.users(id),
  rav_verified_at TIMESTAMPTZ,
  rav_verification_notes TEXT,
  resort_contact_name VARCHAR(255),
  resort_contact_phone VARCHAR(50),
  
  -- Escrow status
  escrow_status escrow_status NOT NULL DEFAULT 'pending_confirmation',
  escrow_amount DECIMAL(10, 2) NOT NULL,
  escrow_released_at TIMESTAMPTZ,
  escrow_refunded_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(booking_id)
);

-- =============================================================================
-- PLATFORM GUARANTEE FUND TABLE
-- =============================================================================

CREATE TABLE public.platform_guarantee_fund (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contribution tracking (from each booking commission)
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  contribution_amount DECIMAL(10, 2) NOT NULL,
  contribution_percentage DECIMAL(5, 2) NOT NULL DEFAULT 3.00, -- 3% of commission
  
  -- Claim tracking (if used for fraud protection)
  claim_id UUID,
  claimed_amount DECIMAL(10, 2),
  claimed_at TIMESTAMPTZ,
  claim_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TRAVELER CHECK-IN CONFIRMATIONS
-- =============================================================================

CREATE TABLE public.checkin_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Check-in confirmation
  confirmed_arrival BOOLEAN,
  confirmed_at TIMESTAMPTZ,
  confirmation_deadline TIMESTAMPTZ NOT NULL, -- 24 hours after check-in date
  
  -- Issue reporting
  issue_reported BOOLEAN NOT NULL DEFAULT FALSE,
  issue_type VARCHAR(100), -- 'property_not_found', 'different_from_listing', 'access_denied', etc.
  issue_description TEXT,
  issue_reported_at TIMESTAMPTZ,
  
  -- Photo verification (optional)
  verification_photo_path TEXT,
  photo_uploaded_at TIMESTAMPTZ,
  
  -- Resolution
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(booking_id)
);

-- =============================================================================
-- STORAGE BUCKET FOR VERIFICATION DOCUMENTS
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  FALSE, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_owner_verifications_owner_id ON public.owner_verifications(owner_id);
CREATE INDEX idx_owner_verifications_status ON public.owner_verifications(verification_status);
CREATE INDEX idx_owner_verifications_trust_level ON public.owner_verifications(trust_level);

CREATE INDEX idx_verification_documents_owner_id ON public.verification_documents(owner_id);
CREATE INDEX idx_verification_documents_status ON public.verification_documents(status);

CREATE INDEX idx_booking_confirmations_booking_id ON public.booking_confirmations(booking_id);
CREATE INDEX idx_booking_confirmations_escrow_status ON public.booking_confirmations(escrow_status);
CREATE INDEX idx_booking_confirmations_deadline ON public.booking_confirmations(confirmation_deadline);

CREATE INDEX idx_checkin_confirmations_booking_id ON public.checkin_confirmations(booking_id);
CREATE INDEX idx_checkin_confirmations_deadline ON public.checkin_confirmations(confirmation_deadline);
CREATE INDEX idx_checkin_confirmations_issue ON public.checkin_confirmations(issue_reported) WHERE issue_reported = TRUE;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.owner_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_guarantee_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_confirmations ENABLE ROW LEVEL SECURITY;

-- Owner Verifications policies
CREATE POLICY "Owners can view their own verification"
  ON public.owner_verifications FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "RAV team can view all verifications"
  ON public.owner_verifications FOR SELECT
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

CREATE POLICY "RAV team can update verifications"
  ON public.owner_verifications FOR UPDATE
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

CREATE POLICY "System can insert verifications"
  ON public.owner_verifications FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Verification Documents policies
CREATE POLICY "Owners can view their own documents"
  ON public.verification_documents FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can upload their own documents"
  ON public.verification_documents FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "RAV team can view all documents"
  ON public.verification_documents FOR SELECT
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

CREATE POLICY "RAV team can update documents"
  ON public.verification_documents FOR UPDATE
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

-- Booking Confirmations policies
CREATE POLICY "Owners can view their booking confirmations"
  ON public.booking_confirmations FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can submit confirmations"
  ON public.booking_confirmations FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Travelers can view their booking confirmations"
  ON public.booking_confirmations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND b.renter_id = auth.uid()
    )
  );

CREATE POLICY "RAV team can manage all confirmations"
  ON public.booking_confirmations FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

-- Platform Guarantee Fund policies (RAV team only)
CREATE POLICY "RAV team can manage guarantee fund"
  ON public.platform_guarantee_fund FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

-- Check-in Confirmations policies
CREATE POLICY "Travelers can view and update their check-in"
  ON public.checkin_confirmations FOR ALL
  TO authenticated
  USING (traveler_id = auth.uid());

CREATE POLICY "Owners can view check-in for their bookings"
  ON public.checkin_confirmations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.listings l ON l.id = b.listing_id
      WHERE b.id = booking_id AND l.owner_id = auth.uid()
    )
  );

CREATE POLICY "RAV team can manage all check-ins"
  ON public.checkin_confirmations FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

-- =============================================================================
-- STORAGE RLS POLICIES
-- =============================================================================

CREATE POLICY "Owners can upload verification documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'verification-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can view their verification documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verification-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "RAV team can view all verification documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verification-documents' AND
    public.is_rav_team(auth.uid())
  );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to create owner verification record on signup
CREATE OR REPLACE FUNCTION public.create_owner_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create if user has property_owner role
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.user_id AND role = 'property_owner'
  ) THEN
    INSERT INTO public.owner_verifications (owner_id)
    VALUES (NEW.user_id)
    ON CONFLICT (owner_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-create verification record when property_owner role assigned
CREATE TRIGGER on_property_owner_role_assigned
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  WHEN (NEW.role = 'property_owner')
  EXECUTE FUNCTION public.create_owner_verification();

-- Function to update trust level based on successful stays
CREATE OR REPLACE FUNCTION public.update_owner_trust_level(_owner_id UUID)
RETURNS owner_trust_level
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verification owner_verifications%ROWTYPE;
  v_new_level owner_trust_level;
BEGIN
  SELECT * INTO v_verification
  FROM owner_verifications
  WHERE owner_id = _owner_id;
  
  IF NOT FOUND THEN
    RETURN 'new';
  END IF;
  
  -- Determine new trust level
  IF v_verification.successful_stays >= 10 AND v_verification.dispute_count = 0 THEN
    v_new_level := 'premium';
  ELSIF v_verification.successful_stays >= 3 THEN
    v_new_level := 'trusted';
  ELSIF v_verification.verification_status = 'approved' THEN
    v_new_level := 'verified';
  ELSE
    v_new_level := 'new';
  END IF;
  
  -- Update if changed
  IF v_new_level != v_verification.trust_level THEN
    UPDATE owner_verifications
    SET 
      trust_level = v_new_level,
      -- Update limits based on level
      max_active_listings = CASE v_new_level
        WHEN 'premium' THEN 20
        WHEN 'trusted' THEN 10
        WHEN 'verified' THEN 5
        ELSE 3
      END,
      max_listing_value = CASE v_new_level
        WHEN 'premium' THEN 50000.00
        WHEN 'trusted' THEN 20000.00
        WHEN 'verified' THEN 10000.00
        ELSE 5000.00
      END,
      security_deposit_required = CASE v_new_level
        WHEN 'premium' THEN FALSE
        WHEN 'trusted' THEN FALSE
        ELSE TRUE
      END,
      updated_at = NOW()
    WHERE owner_id = _owner_id;
  END IF;
  
  RETURN v_new_level;
END;
$$;

-- Function to get owner's trust level
CREATE OR REPLACE FUNCTION public.get_owner_trust_level(_owner_id UUID)
RETURNS owner_trust_level
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(trust_level, 'new'::owner_trust_level)
  FROM owner_verifications
  WHERE owner_id = _owner_id
$$;

-- Function to check if owner can create new listing
CREATE OR REPLACE FUNCTION public.can_owner_create_listing(_owner_id UUID, _listing_value DECIMAL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM owner_verifications ov
    WHERE ov.owner_id = _owner_id
      AND ov.verification_status = 'approved'
      AND (
        SELECT COUNT(*) FROM listings l
        WHERE l.owner_id = _owner_id
          AND l.status IN ('active', 'pending_approval')
      ) < ov.max_active_listings
      AND _listing_value <= ov.max_listing_value
      AND (NOT ov.security_deposit_required OR ov.security_deposit_paid)
  )
$$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.owner_verifications IS 'Tracks owner verification status, trust level, and limits';
COMMENT ON TABLE public.verification_documents IS 'Stores references to uploaded ownership/identity documents';
COMMENT ON TABLE public.booking_confirmations IS 'Tracks resort confirmation numbers and RAV verification for escrow';
COMMENT ON TABLE public.platform_guarantee_fund IS 'Tracks contributions to fraud protection fund from commissions';
COMMENT ON TABLE public.checkin_confirmations IS 'Tracks traveler arrival confirmation and issue reporting';
