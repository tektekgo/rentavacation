-- Migration 034: Renter-owner in-platform messaging per booking
-- Enables direct communication between booking parties

CREATE TABLE IF NOT EXISTS booking_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL REFERENCES bookings(id),
  sender_id   uuid NOT NULL REFERENCES profiles(id),
  body        text NOT NULL,
  is_read     boolean NOT NULL DEFAULT false,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_messages_booking ON booking_messages(booking_id, created_at);
CREATE INDEX idx_booking_messages_sender ON booking_messages(sender_id);

-- RPC: get unread message count per booking for a user
CREATE OR REPLACE FUNCTION get_unread_message_counts(p_user_id uuid)
RETURNS TABLE (
  booking_id uuid,
  unread_count bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    bm.booking_id,
    COUNT(*) AS unread_count
  FROM booking_messages bm
  WHERE bm.sender_id != p_user_id
    AND bm.is_read = false
    AND bm.booking_id IN (
      SELECT b.id FROM bookings b
      JOIN listings l ON l.id = b.listing_id
      WHERE b.renter_id = p_user_id OR l.owner_id = p_user_id
    )
  GROUP BY bm.booking_id;
$$;
