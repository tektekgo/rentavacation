-- Migration 027: GDPR/CCPA Account Deletion & Data Export
-- Adds soft-delete fields to profiles for 14-day grace period before permanent deletion

-- ── Add deletion tracking fields to profiles ──
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_scheduled_for timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_reason text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_anonymized boolean NOT NULL DEFAULT false;
