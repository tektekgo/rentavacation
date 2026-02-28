-- Migration 033: Post-stay review and rating system
-- Allows renters to leave reviews after completed bookings

CREATE TABLE IF NOT EXISTS reviews (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id             uuid NOT NULL UNIQUE REFERENCES bookings(id),
  listing_id             uuid NOT NULL REFERENCES listings(id),
  property_id            uuid NOT NULL REFERENCES properties(id),
  reviewer_id            uuid NOT NULL REFERENCES profiles(id),
  owner_id               uuid NOT NULL REFERENCES profiles(id),
  rating                 smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title                  text,
  body                   text,
  rating_cleanliness     smallint CHECK (rating_cleanliness >= 1 AND rating_cleanliness <= 5),
  rating_accuracy        smallint CHECK (rating_accuracy >= 1 AND rating_accuracy <= 5),
  rating_communication   smallint CHECK (rating_communication >= 1 AND rating_communication <= 5),
  rating_location        smallint CHECK (rating_location >= 1 AND rating_location <= 5),
  rating_value           smallint CHECK (rating_value >= 1 AND rating_value <= 5),
  owner_response         text,
  owner_responded_at     timestamptz,
  is_published           boolean NOT NULL DEFAULT true,
  flagged                boolean NOT NULL DEFAULT false,
  flagged_reason         text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_listing ON reviews(listing_id);
CREATE INDEX idx_reviews_property ON reviews(property_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_owner ON reviews(owner_id);

-- Auto-update updated_at
CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RPC: get property review summary
CREATE OR REPLACE FUNCTION get_property_review_summary(p_property_id uuid)
RETURNS TABLE (
  avg_rating numeric,
  review_count bigint,
  avg_cleanliness numeric,
  avg_accuracy numeric,
  avg_communication numeric,
  avg_location numeric,
  avg_value numeric
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ROUND(AVG(rating)::numeric, 1) AS avg_rating,
    COUNT(*) AS review_count,
    ROUND(AVG(rating_cleanliness)::numeric, 1) AS avg_cleanliness,
    ROUND(AVG(rating_accuracy)::numeric, 1) AS avg_accuracy,
    ROUND(AVG(rating_communication)::numeric, 1) AS avg_communication,
    ROUND(AVG(rating_location)::numeric, 1) AS avg_location,
    ROUND(AVG(rating_value)::numeric, 1) AS avg_value
  FROM reviews
  WHERE property_id = p_property_id
    AND is_published = true
    AND flagged = false;
$$;
