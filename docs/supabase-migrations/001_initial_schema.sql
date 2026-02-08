-- ============================================================
-- RENT-A-VACATION DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

-- User roles: RAV team, Property Owners, Renters
CREATE TYPE public.app_role AS ENUM (
  'rav_owner',      -- RAV superuser/owner
  'rav_admin',      -- RAV admin
  'rav_staff',      -- RAV staff member
  'property_owner', -- Vacation property owner
  'renter'          -- Property renter
);

-- Vacation club brands
CREATE TYPE public.vacation_club_brand AS ENUM (
  'hilton_grand_vacations',
  'marriott_vacation_club',
  'disney_vacation_club',
  'wyndham_destinations',
  'hyatt_residence_club',
  'bluegreen_vacations',
  'holiday_inn_club',
  'worldmark',
  'other'
);

-- Listing status workflow
CREATE TYPE public.listing_status AS ENUM (
  'draft',            -- Owner drafting
  'pending_approval', -- Awaiting RAV review
  'active',           -- Live and bookable
  'booked',           -- Reserved
  'completed',        -- Stay completed
  'cancelled'         -- Cancelled
);

-- Booking status
CREATE TYPE public.booking_status AS ENUM (
  'pending',    -- Awaiting confirmation/payment
  'confirmed',  -- Confirmed and paid
  'cancelled',  -- Cancelled
  'completed'   -- Stay completed
);

-- Owner agreement status
CREATE TYPE public.agreement_status AS ENUM (
  'pending',    -- Awaiting approval
  'active',     -- Active agreement
  'suspended',  -- Temporarily suspended
  'terminated'  -- Ended
);

-- ============================================================
-- 2. TABLES
-- ============================================================

-- User profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User roles (separate table to avoid privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Properties (vacation club memberships)
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand public.vacation_club_brand NOT NULL,
  resort_name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  bedrooms INTEGER NOT NULL DEFAULT 1,
  bathrooms NUMERIC(3,1) NOT NULL DEFAULT 1,
  sleeps INTEGER NOT NULL DEFAULT 2,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Owner agreements (pricing/commission terms between RAV and owners)
CREATE TABLE public.owner_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.agreement_status NOT NULL DEFAULT 'pending',
  commission_rate NUMERIC(5,2) NOT NULL, -- Percentage RAV takes (e.g., 15.00 = 15%)
  markup_allowed BOOLEAN NOT NULL DEFAULT true,
  max_markup_percent NUMERIC(5,2), -- Max markup owner can add
  terms_accepted_at TIMESTAMPTZ,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Listings (available rental periods)
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.listing_status NOT NULL DEFAULT 'draft',
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  owner_price NUMERIC(10,2) NOT NULL, -- What owner wants
  rav_markup NUMERIC(10,2) NOT NULL DEFAULT 0, -- RAV's markup
  final_price NUMERIC(10,2) NOT NULL, -- What renter pays
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
  CONSTRAINT valid_prices CHECK (final_price >= owner_price)
);

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  renter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status public.booking_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10,2) NOT NULL,
  rav_commission NUMERIC(10,2) NOT NULL,
  owner_payout NUMERIC(10,2) NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  special_requests TEXT,
  payment_intent_id TEXT, -- Stripe payment intent
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX idx_properties_brand ON public.properties(brand);
CREATE INDEX idx_listings_property_id ON public.listings(property_id);
CREATE INDEX idx_listings_owner_id ON public.listings(owner_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_dates ON public.listings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_listing_id ON public.bookings(listing_id);
CREATE INDEX idx_bookings_renter_id ON public.bookings(renter_id);
CREATE INDEX idx_owner_agreements_owner_id ON public.owner_agreements(owner_id);

-- ============================================================
-- 4. SECURITY DEFINER FUNCTIONS (for RLS without recursion)
-- ============================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS public.app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(role) FROM public.user_roles WHERE user_id = _user_id
$$;

-- Check if user is part of RAV team
CREATE OR REPLACE FUNCTION public.is_rav_team(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('rav_owner', 'rav_admin', 'rav_staff')
  )
$$;

-- Check if user is a property owner
CREATE OR REPLACE FUNCTION public.is_property_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'property_owner'
  )
$$;

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- ----- PROFILES -----
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "RAV team can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

-- ----- USER ROLES -----
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "RAV owner/admin can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'rav_owner') OR 
    public.has_role(auth.uid(), 'rav_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'rav_owner') OR 
    public.has_role(auth.uid(), 'rav_admin')
  );

-- ----- PROPERTIES -----
CREATE POLICY "Anyone can view properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners can manage own properties"
  ON public.properties FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "RAV team can manage all properties"
  ON public.properties FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()))
  WITH CHECK (public.is_rav_team(auth.uid()));

-- ----- OWNER AGREEMENTS -----
CREATE POLICY "Owners can view own agreements"
  ON public.owner_agreements FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "RAV team can manage all agreements"
  ON public.owner_agreements FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()))
  WITH CHECK (public.is_rav_team(auth.uid()));

-- ----- LISTINGS -----
CREATE POLICY "Anyone can view active listings"
  ON public.listings FOR SELECT
  TO authenticated
  USING (status = 'active' OR owner_id = auth.uid() OR public.is_rav_team(auth.uid()));

CREATE POLICY "Owners can manage own listings"
  ON public.listings FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "RAV team can manage all listings"
  ON public.listings FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()))
  WITH CHECK (public.is_rav_team(auth.uid()));

-- ----- BOOKINGS -----
CREATE POLICY "Renters can view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (renter_id = auth.uid());

CREATE POLICY "Owners can view bookings for their properties"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.owner_id = auth.uid()
    )
  );

CREATE POLICY "Renters can create bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (renter_id = auth.uid());

CREATE POLICY "RAV team can manage all bookings"
  ON public.bookings FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()))
  WITH CHECK (public.is_rav_team(auth.uid()));

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Default role: renter
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'renter');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_owner_agreements_updated_at
  BEFORE UPDATE ON public.owner_agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 7. STORAGE BUCKET (for property images)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "Owners can upload property images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-images' AND
    (public.is_property_owner(auth.uid()) OR public.is_rav_team(auth.uid()))
  );

CREATE POLICY "Owners can update own property images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-images' AND
    (owner = auth.uid()::text OR public.is_rav_team(auth.uid()))
  );

CREATE POLICY "Owners can delete own property images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-images' AND
    (owner = auth.uid()::text OR public.is_rav_team(auth.uid()))
  );

-- ============================================================
-- DONE! Your database schema is ready.
-- ============================================================
