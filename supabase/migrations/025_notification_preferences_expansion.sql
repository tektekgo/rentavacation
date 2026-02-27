-- Migration 025: Expand notification preferences for booking updates and marketing
-- The notification_preferences table already exists with bidding/proposal columns.
-- This adds booking-related and marketing preference columns.

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_booking_confirmed boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_booking_cancelled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_payout_sent boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_marketing boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_product_updates boolean DEFAULT true;

-- RLS: users can read/update their own preferences
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notification_preferences'
      AND policyname = 'Users can view own notification preferences'
  ) THEN
    CREATE POLICY "Users can view own notification preferences"
      ON notification_preferences FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notification_preferences'
      AND policyname = 'Users can update own notification preferences'
  ) THEN
    CREATE POLICY "Users can update own notification preferences"
      ON notification_preferences FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notification_preferences'
      AND policyname = 'Users can insert own notification preferences'
  ) THEN
    CREATE POLICY "Users can insert own notification preferences"
      ON notification_preferences FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Enable RLS if not already
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
