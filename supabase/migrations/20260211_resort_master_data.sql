-- Resort Master Data Migration
-- Creates resorts and resort_unit_types tables for 117 vacation club resorts
-- Phase 2: Resort master data to streamline property listings

-- ============================================================
-- 1. Create vacation_club_brand enum (if not exists)
-- Note: VacationClubBrand already exists in the app types,
-- but we need the DB enum for the resorts table
-- ============================================================
DO $$ BEGIN
  CREATE TYPE vacation_club_brand AS ENUM (
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
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. Create resorts table
-- ============================================================
CREATE TABLE IF NOT EXISTS resorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand vacation_club_brand NOT NULL,
  resort_name TEXT UNIQUE NOT NULL,
  location JSONB NOT NULL,  -- {city, state, country, full_address}
  description TEXT,
  contact JSONB,  -- {phone, email, website}
  resort_amenities TEXT[],
  policies JSONB,  -- {check_in, check_out, parking, pets}
  nearby_airports TEXT[],
  guest_rating NUMERIC(2,1),
  main_image_url TEXT,
  additional_images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. Create resort_unit_types table
-- ============================================================
CREATE TABLE IF NOT EXISTS resort_unit_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resort_id UUID REFERENCES resorts(id) ON DELETE CASCADE,
  unit_type_name TEXT NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms NUMERIC(3,1) NOT NULL,
  max_occupancy INTEGER NOT NULL,
  square_footage INTEGER,
  kitchen_type TEXT,
  bedding_config TEXT,
  features JSONB,  -- {balcony, view_type, washer_dryer, accessible}
  unit_amenities TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resort_id, unit_type_name)
);

-- ============================================================
-- 4. Add resort references to existing properties table
-- ============================================================
DO $$ BEGIN
  ALTER TABLE properties
    ADD COLUMN resort_id UUID REFERENCES resorts(id);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE properties
    ADD COLUMN unit_type_id UUID REFERENCES resort_unit_types(id);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- 5. Create indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_resorts_brand ON resorts(brand);
CREATE INDEX IF NOT EXISTS idx_resorts_location ON resorts USING gin(location);
CREATE INDEX IF NOT EXISTS idx_resorts_resort_name ON resorts(resort_name);
CREATE INDEX IF NOT EXISTS idx_unit_types_resort ON resort_unit_types(resort_id);
CREATE INDEX IF NOT EXISTS idx_unit_types_bedrooms ON resort_unit_types(bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_resort_id ON properties(resort_id);
CREATE INDEX IF NOT EXISTS idx_properties_unit_type_id ON properties(unit_type_id);

-- ============================================================
-- 6. Create updated_at trigger function (if not exists)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_resorts_updated_at ON resorts;
CREATE TRIGGER update_resorts_updated_at
  BEFORE UPDATE ON resorts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resort_unit_types_updated_at ON resort_unit_types;
CREATE TRIGGER update_resort_unit_types_updated_at
  BEFORE UPDATE ON resort_unit_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. Enable Row Level Security (RLS)
-- ============================================================
ALTER TABLE resorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE resort_unit_types ENABLE ROW LEVEL SECURITY;

-- Resorts are public read (anyone can browse resorts)
CREATE POLICY "Resorts are viewable by everyone"
  ON resorts FOR SELECT
  USING (true);

-- Unit types are public read
CREATE POLICY "Unit types are viewable by everyone"
  ON resort_unit_types FOR SELECT
  USING (true);

-- Only authenticated users with admin role can modify resorts
CREATE POLICY "Only admins can insert resorts"
  ON resorts FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only admins can update resorts"
  ON resorts FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Only admins can insert unit types"
  ON resort_unit_types FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only admins can update unit types"
  ON resort_unit_types FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================
-- 8. Create useful views
-- ============================================================
CREATE OR REPLACE VIEW resort_summary AS
SELECT
  r.id,
  r.brand,
  r.resort_name,
  r.location->>'city' AS city,
  r.location->>'state' AS state,
  r.location->>'country' AS country,
  r.guest_rating,
  COUNT(ut.id) AS unit_type_count,
  MIN(ut.bedrooms) AS min_bedrooms,
  MAX(ut.bedrooms) AS max_bedrooms,
  MIN(ut.max_occupancy) AS min_occupancy,
  MAX(ut.max_occupancy) AS max_occupancy
FROM resorts r
LEFT JOIN resort_unit_types ut ON ut.resort_id = r.id
GROUP BY r.id, r.brand, r.resort_name, r.location, r.guest_rating;
