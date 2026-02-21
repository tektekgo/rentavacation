-- Migration 015: Seed Foundation Flag
-- Adds is_seed_foundation column to profiles for seed data management.
-- Foundation users (Layer 1) are never wiped during reseed operations.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_seed_foundation BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_seed_foundation
  ON profiles(is_seed_foundation) WHERE is_seed_foundation = true;
