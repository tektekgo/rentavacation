-- ============================================================
-- RENT-A-VACATION SEED DATA
-- Run this AFTER the initial schema migration
-- This creates sample data for development/testing
-- ============================================================

-- NOTE: Replace these UUIDs with actual user IDs after creating test users
-- You can create users via the Supabase Auth dashboard or your app's signup

-- ============================================================
-- SAMPLE VACATION CLUB BRANDS DATA
-- ============================================================

-- This is just a reference - the brand is stored as an enum on properties
-- Hilton Grand Vacations - hilton_grand_vacations
-- Marriott Vacation Club - marriott_vacation_club
-- Disney Vacation Club - disney_vacation_club
-- Wyndham Destinations - wyndham_destinations
-- Hyatt Residence Club - hyatt_residence_club
-- Bluegreen Vacations - bluegreen_vacations
-- Holiday Inn Club - holiday_inn_club
-- WorldMark - worldmark
-- Other - other

-- ============================================================
-- HOW TO ADD YOUR FIRST RAV ADMIN
-- ============================================================
-- 1. Create a user via your app's signup or Supabase Auth dashboard
-- 2. Get the user's UUID from auth.users table
-- 3. Run the following (replace YOUR_USER_ID):

-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('YOUR_USER_ID', 'rav_owner')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================
-- HOW TO MAKE A USER A PROPERTY OWNER
-- ============================================================
-- 1. Get the user's UUID
-- 2. Run:

-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('USER_ID', 'property_owner')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================
-- SAMPLE AGREEMENT TEMPLATE
-- ============================================================
-- This shows the standard commission structure

-- INSERT INTO public.owner_agreements (
--   owner_id,
--   status,
--   commission_rate,
--   markup_allowed,
--   max_markup_percent,
--   effective_date
-- ) VALUES (
--   'OWNER_USER_ID',
--   'active',
--   15.00,  -- 15% commission to RAV
--   true,   -- Owner can add markup
--   25.00,  -- Max 25% markup allowed
--   CURRENT_DATE
-- );

-- ============================================================
-- SAMPLE PROPERTY
-- ============================================================

-- INSERT INTO public.properties (
--   owner_id,
--   brand,
--   resort_name,
--   location,
--   description,
--   bedrooms,
--   bathrooms,
--   sleeps,
--   amenities,
--   images
-- ) VALUES (
--   'OWNER_USER_ID',
--   'hilton_grand_vacations',
--   'Hilton Grand Vacations Club at MarBrisa',
--   'Carlsbad, California',
--   'Beautiful oceanfront resort with stunning Pacific views. Features full kitchen, spacious living area, and private balcony.',
--   2,
--   2,
--   6,
--   ARRAY['Pool', 'Hot Tub', 'Ocean View', 'Full Kitchen', 'WiFi', 'Fitness Center', 'Beach Access'],
--   ARRAY[]
-- );

-- ============================================================
-- SAMPLE LISTING
-- ============================================================

-- INSERT INTO public.listings (
--   property_id,
--   owner_id,
--   status,
--   check_in_date,
--   check_out_date,
--   owner_price,
--   rav_markup,
--   final_price,
--   notes
-- ) VALUES (
--   'PROPERTY_ID',
--   'OWNER_USER_ID',
--   'active',
--   '2026-03-15',
--   '2026-03-22',
--   1200.00,  -- Owner wants $1200
--   300.00,   -- RAV markup
--   1500.00,  -- Renter pays $1500
--   'Spring break week - high demand period'
-- );
