-- Phase 18: Travel Request Enhancements
-- Adds 2 notification type values used by new automation

-- Note: migration number is 018 (016 taken by fair_value_score, 017 by owner_dashboard)

DO $$
BEGIN
  -- Check if the enum type exists and add values if not already present
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    -- Add travel_request_expiring_soon if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      WHERE enumtypid = 'notification_type'::regtype
        AND enumlabel = 'travel_request_expiring_soon'
    ) THEN
      ALTER TYPE public.notification_type ADD VALUE 'travel_request_expiring_soon';
    END IF;

    -- Add travel_request_matched if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      WHERE enumtypid = 'notification_type'::regtype
        AND enumlabel = 'travel_request_matched'
    ) THEN
      ALTER TYPE public.notification_type ADD VALUE 'travel_request_matched';
    END IF;
  END IF;
END $$;

-- Verify:
-- SELECT unnest(enum_range(NULL::notification_type));
-- Should include travel_request_expiring_soon and travel_request_matched
