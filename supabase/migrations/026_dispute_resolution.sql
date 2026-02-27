-- Migration 026: Dispute Resolution System
-- Provides admin tools for handling renter/owner disputes with communication thread and Stripe refund support

-- ── Dispute category enum ──
DO $$ BEGIN
  CREATE TYPE dispute_category AS ENUM (
    'property_not_as_described',
    'access_issues',
    'safety_concerns',
    'cleanliness',
    'cancellation_dispute',
    'payment_dispute',
    'owner_no_show',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Dispute status enum ──
DO $$ BEGIN
  CREATE TYPE dispute_status AS ENUM (
    'open',
    'investigating',
    'awaiting_response',
    'resolved_full_refund',
    'resolved_partial_refund',
    'resolved_no_refund',
    'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Dispute priority enum ──
DO $$ BEGIN
  CREATE TYPE dispute_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Disputes table ──
CREATE TABLE IF NOT EXISTS disputes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid NOT NULL REFERENCES bookings(id),
  reporter_id   uuid NOT NULL REFERENCES profiles(id),
  reported_user_id uuid REFERENCES profiles(id),  -- the other party
  category      dispute_category NOT NULL DEFAULT 'other',
  priority      dispute_priority NOT NULL DEFAULT 'medium',
  status        dispute_status NOT NULL DEFAULT 'open',
  description   text NOT NULL,
  evidence_urls text[] DEFAULT '{}',

  -- Resolution
  resolution_notes  text,
  resolved_by       uuid REFERENCES profiles(id),
  resolved_at       timestamptz,
  refund_amount     numeric(10,2),
  refund_reference  text,  -- Stripe refund ID

  -- Admin internal
  assigned_to       uuid REFERENCES profiles(id),
  admin_notes       text,

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Dispute messages (communication thread) ──
CREATE TABLE IF NOT EXISTS dispute_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id  uuid NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  sender_id   uuid NOT NULL REFERENCES profiles(id),
  message     text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,  -- true = admin-only note
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_disputes_booking_id ON disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_reporter_id ON disputes(reporter_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_priority ON disputes(priority);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);

-- ── Updated_at trigger ──
DROP TRIGGER IF EXISTS update_disputes_updated_at ON disputes;
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── RLS ──
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;

-- Disputes: users can read their own disputes, RAV team can read all
DO $$ BEGIN
  CREATE POLICY "Users can view own disputes"
    ON disputes FOR SELECT
    USING (auth.uid() = reporter_id OR auth.uid() = reported_user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create disputes"
    ON disputes FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "RAV team can view all disputes"
    ON disputes FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('rav_admin', 'rav_staff', 'rav_owner')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "RAV team can update disputes"
    ON disputes FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('rav_admin', 'rav_staff', 'rav_owner')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Messages: users see non-internal messages on their disputes, RAV team sees all
DO $$ BEGIN
  CREATE POLICY "Users can view non-internal messages on their disputes"
    ON dispute_messages FOR SELECT
    USING (
      NOT is_internal AND EXISTS (
        SELECT 1 FROM disputes
        WHERE disputes.id = dispute_messages.dispute_id
        AND (disputes.reporter_id = auth.uid() OR disputes.reported_user_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can send messages on their disputes"
    ON dispute_messages FOR INSERT
    WITH CHECK (
      auth.uid() = sender_id AND NOT is_internal AND EXISTS (
        SELECT 1 FROM disputes
        WHERE disputes.id = dispute_messages.dispute_id
        AND (disputes.reporter_id = auth.uid() OR disputes.reported_user_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "RAV team can view all messages"
    ON dispute_messages FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('rav_admin', 'rav_staff', 'rav_owner')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "RAV team can send messages"
    ON dispute_messages FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('rav_admin', 'rav_staff', 'rav_owner')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
