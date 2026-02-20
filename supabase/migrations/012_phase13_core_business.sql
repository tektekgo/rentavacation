-- Phase 13: Core Business Flow Completion
-- 1. Property images storage bucket
-- 2. Owner confirmation columns on booking_confirmations
-- 3. System settings for confirmation timer
-- 4. RPC: extend_owner_confirmation_deadline

-- =============================================================
-- 1. PROPERTY IMAGES STORAGE BUCKET
-- =============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Owners can upload to their own folder
CREATE POLICY "Owners can upload property images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owners can update their own images
CREATE POLICY "Owners can update own property images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owners can delete their own images
CREATE POLICY "Owners can delete own property images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read access for property images
CREATE POLICY "Public can view property images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'property-images');

-- =============================================================
-- 2. OWNER CONFIRMATION COLUMNS ON booking_confirmations
-- =============================================================

DO $$
BEGIN
  -- owner_confirmation_status enum-like text column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_confirmations'
    AND column_name = 'owner_confirmation_status'
  ) THEN
    ALTER TABLE booking_confirmations
      ADD COLUMN owner_confirmation_status text
        CHECK (owner_confirmation_status IN (
          'pending_owner', 'owner_confirmed', 'owner_timed_out', 'owner_declined'
        ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_confirmations'
    AND column_name = 'owner_confirmation_deadline'
  ) THEN
    ALTER TABLE booking_confirmations
      ADD COLUMN owner_confirmation_deadline timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_confirmations'
    AND column_name = 'extensions_used'
  ) THEN
    ALTER TABLE booking_confirmations
      ADD COLUMN extensions_used integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_confirmations'
    AND column_name = 'owner_extension_requested_at'
  ) THEN
    ALTER TABLE booking_confirmations
      ADD COLUMN owner_extension_requested_at timestamptz[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_confirmations'
    AND column_name = 'owner_confirmed_at'
  ) THEN
    ALTER TABLE booking_confirmations
      ADD COLUMN owner_confirmed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_confirmations'
    AND column_name = 'owner_declined_at'
  ) THEN
    ALTER TABLE booking_confirmations
      ADD COLUMN owner_declined_at timestamptz;
  END IF;
END $$;

-- =============================================================
-- 3. SYSTEM SETTINGS FOR CONFIRMATION TIMER
-- =============================================================

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('owner_confirmation_window_minutes', '{"value": 60}', 'Minutes an owner has to confirm a booking after payment'),
  ('owner_confirmation_extension_minutes', '{"value": 30}', 'Minutes added per extension request'),
  ('owner_confirmation_max_extensions', '{"value": 2}', 'Maximum number of time extensions an owner can request')
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================================
-- 4. RPC: extend_owner_confirmation_deadline
-- =============================================================

CREATE OR REPLACE FUNCTION extend_owner_confirmation_deadline(
  p_booking_confirmation_id uuid,
  p_owner_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conf booking_confirmations%ROWTYPE;
  v_max_extensions integer;
  v_extension_minutes integer;
  v_new_deadline timestamptz;
BEGIN
  -- Fetch the confirmation
  SELECT * INTO v_conf
  FROM booking_confirmations
  WHERE id = p_booking_confirmation_id AND owner_id = p_owner_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Confirmation not found or not owned by you');
  END IF;

  IF v_conf.owner_confirmation_status != 'pending_owner' THEN
    RETURN json_build_object('success', false, 'error', 'Confirmation is not in pending_owner status');
  END IF;

  -- Get max extensions from system settings
  SELECT (setting_value->>'value')::integer INTO v_max_extensions
  FROM system_settings WHERE setting_key = 'owner_confirmation_max_extensions';
  v_max_extensions := COALESCE(v_max_extensions, 2);

  -- Check if max extensions exceeded
  IF COALESCE(v_conf.extensions_used, 0) >= v_max_extensions THEN
    RETURN json_build_object('success', false, 'error', 'Maximum extensions already used');
  END IF;

  -- Get extension minutes
  SELECT (setting_value->>'value')::integer INTO v_extension_minutes
  FROM system_settings WHERE setting_key = 'owner_confirmation_extension_minutes';
  v_extension_minutes := COALESCE(v_extension_minutes, 30);

  -- Calculate new deadline
  v_new_deadline := GREATEST(v_conf.owner_confirmation_deadline, NOW()) + (v_extension_minutes || ' minutes')::interval;

  -- Update the confirmation
  UPDATE booking_confirmations SET
    owner_confirmation_deadline = v_new_deadline,
    extensions_used = COALESCE(extensions_used, 0) + 1,
    owner_extension_requested_at = COALESCE(owner_extension_requested_at, ARRAY[]::timestamptz[]) || ARRAY[NOW()]
  WHERE id = p_booking_confirmation_id;

  RETURN json_build_object(
    'success', true,
    'new_deadline', v_new_deadline,
    'extensions_used', COALESCE(v_conf.extensions_used, 0) + 1,
    'max_extensions', v_max_extensions
  );
END;
$$;
