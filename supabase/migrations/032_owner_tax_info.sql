-- Migration 032: Owner tax info fields for 1099-K compliance
-- Required for owners earning >$600/year

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_id_type text CHECK (tax_id_type IN ('ssn', 'ein'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_id_last4 text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS w9_submitted_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_business_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_address_line1 text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_address_line2 text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_state text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_zip text;
