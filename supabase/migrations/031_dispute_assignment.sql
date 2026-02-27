-- Migration 031: Dispute assignment
-- Adds assigned_to column for dispute ownership

ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_disputes_assigned_to ON disputes(assigned_to);

COMMENT ON COLUMN disputes.assigned_to IS 'RAV team member assigned to handle this dispute';
