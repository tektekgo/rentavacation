# Fair Value Score — Project Brief

**Feature Name:** Fair Value Score  
**Phase:** 15  
**Route:** Appears on listing cards, listing detail pages, and owner listing management  
**Status:** 🟡 Planning  
**Created:** February 20, 2026  
**Migration:** 014  
**Docs:** `docs/features/fair-value-score/`

---

## Overview

A RAV-calculated price confidence score displayed on every listing, visible to both
travelers and owners. Shows whether a listing is priced below, at, or above the
current market based on real bid and booking data from the platform.

**Displayed as:** A colored badge + price range on every listing card and detail page.

```
┌─────────────────────────────────┐
│  🟢 Fair Value  $3,200 – $3,800  │
│     Your price is within range   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  🔴 Above Market  $3,200–$3,800  │
│     Current bids avg $2,950      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  🟡 Below Market  $3,200–$3,800  │
│     You may be underpricing      │
└─────────────────────────────────┘
```

---

## Problem It Solves

- Owners price arbitrarily — no data to guide them
- Travelers don't know if they're getting a deal or overpaying
- Bid acceptance rate suffers when owner price is misaligned with demand
- No competitor offers this for timeshare rentals specifically

---

## Goals

- ✅ Give owners real-time pricing guidance based on comparable bids
- ✅ Give travelers confidence that they're seeing fair prices
- ✅ Reduce bid rejection rate by helping owners price correctly from the start
- ✅ Show up on listing cards, listing detail page, and owner's listing management view
- ✅ Different messaging for owner view vs traveler view
- ✅ Feeds into the Executive Dashboard Bid Spread Index™

---

## How the Score is Calculated

**Comparable listings** = same destination city + same bedroom count + check-in within
±45 days + status active or booked in last 90 days.

**Fair Value Range** = P25 to P75 of accepted bid amounts for comparable listings.
If fewer than 3 comparables exist, widen to ±90 days and same state.
If still fewer than 3, show "Insufficient data" — do not show a score.

**Score tiers:**
```
Below Market:  listing final_price < P25 of comparable bids
Fair Value:    listing final_price between P25 and P75
Above Market:  listing final_price > P75 of comparable bids
```

**Calculated via:** Supabase PostgreSQL function `calculate_fair_value_score(listing_id)`
Called on listing load — NOT stored (recalculates live from current bid data).

---

## Messaging — Owner vs Traveler View

Same score, different language:

| Tier | Traveler sees | Owner sees |
|------|--------------|-----------|
| Below Market | 🟡 "Great Deal — below typical prices" | 🟡 "Priced below market — consider raising your ask" |
| Fair Value | 🟢 "Fair Price — within normal range" | 🟢 "Well priced — aligned with current demand" |
| Above Market | 🔴 "Above Market — bids may be lower" | 🔴 "Above market — you may receive fewer bids" |

---

## Where It Appears

1. **Listing cards** (browse/search results) — small badge, tier color + label only
2. **Listing detail page** — full card: tier + range + context sentence + bid average
3. **Owner's listing management** — full card with owner-specific messaging
4. **Executive Dashboard** — feeds Bid Spread Index™ data (no new UI needed)

---

## Database Changes

**New migration: `014_fair_value_score.sql`**

No new tables. One new PostgreSQL function:

```sql
CREATE OR REPLACE FUNCTION public.calculate_fair_value_score(p_listing_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_listing listings%ROWTYPE;
  v_property properties%ROWTYPE;
  v_p25 NUMERIC;
  v_p75 NUMERIC;
  v_avg_bid NUMERIC;
  v_bid_count INTEGER;
  v_tier TEXT;
  v_comparable_count INTEGER;
BEGIN
  -- Get listing and property
  SELECT * INTO v_listing FROM listings WHERE id = p_listing_id;
  SELECT * INTO v_property FROM properties WHERE id = v_listing.property_id;

  -- Find comparable accepted bids (same city, same bedrooms, ±45 days)
  SELECT
    percentile_cont(0.25) WITHIN GROUP (ORDER BY lb.bid_amount),
    percentile_cont(0.75) WITHIN GROUP (ORDER BY lb.bid_amount),
    AVG(lb.bid_amount),
    COUNT(*)
  INTO v_p25, v_p75, v_avg_bid, v_comparable_count
  FROM listing_bids lb
  JOIN listings l ON lb.listing_id = l.id
  JOIN properties p ON l.property_id = p.id
  WHERE lb.status = 'accepted'
    AND p.location ILIKE '%' || split_part(v_property.location, ',', 1) || '%'
    AND p.bedrooms = v_property.bedrooms
    AND l.check_in_date BETWEEN v_listing.check_in_date - 45
                             AND v_listing.check_in_date + 45
    AND lb.listing_id != p_listing_id;

  -- Widen search if insufficient data
  IF v_comparable_count < 3 THEN
    SELECT
      percentile_cont(0.25) WITHIN GROUP (ORDER BY lb.bid_amount),
      percentile_cont(0.75) WITHIN GROUP (ORDER BY lb.bid_amount),
      AVG(lb.bid_amount),
      COUNT(*)
    INTO v_p25, v_p75, v_avg_bid, v_comparable_count
    FROM listing_bids lb
    JOIN listings l ON lb.listing_id = l.id
    JOIN properties p ON l.property_id = p.id
    WHERE lb.status = 'accepted'
      AND p.bedrooms = v_property.bedrooms
      AND l.check_in_date BETWEEN v_listing.check_in_date - 90
                               AND v_listing.check_in_date + 90
      AND lb.listing_id != p_listing_id;
  END IF;

  -- Return null score if still insufficient
  IF v_comparable_count < 3 THEN
    RETURN jsonb_build_object(
      'tier', 'insufficient_data',
      'comparable_count', v_comparable_count
    );
  END IF;

  -- Calculate tier
  IF v_listing.final_price < v_p25 THEN
    v_tier := 'below_market';
  ELSIF v_listing.final_price > v_p75 THEN
    v_tier := 'above_market';
  ELSE
    v_tier := 'fair_value';
  END IF;

  RETURN jsonb_build_object(
    'tier', v_tier,
    'range_low', ROUND(v_p25),
    'range_high', ROUND(v_p75),
    'avg_accepted_bid', ROUND(v_avg_bid),
    'comparable_count', v_comparable_count,
    'listing_price', v_listing.final_price
  );
END;
$$;
```

---

## File Structure

```
src/
├── components/
│   └── fair-value/
│       ├── FairValueBadge.tsx      # Small badge for listing cards
│       ├── FairValueCard.tsx       # Full card for listing detail + owner view
│       └── FairValueTooltip.tsx    # Explanation tooltip (uses TooltipIcon pattern)
├── hooks/
│   └── useFairValueScore.ts        # Calls calculate_fair_value_score RPC
docs/supabase-migrations/
└── 014_fair_value_score.sql
```

---

## Implementation Plan — 1 Session

Single agent session. Mostly database function + two React components.

---

## Success Criteria

- [ ] `calculate_fair_value_score()` function deployed to DEV
- [ ] Returns correct tier for below/fair/above market listings
- [ ] Returns `insufficient_data` when fewer than 3 comparables
- [ ] `FairValueBadge` renders on listing cards with correct color
- [ ] `FairValueCard` renders on listing detail page with full context
- [ ] Owner view shows owner-specific messaging
- [ ] Traveler view shows traveler-specific messaging
- [ ] Loading state while score calculates
- [ ] No score shown when `insufficient_data` (no broken UI)
- [ ] `npm run build` passes, all existing tests pass
- [ ] 5+ new tests covering score calculation logic and component rendering

---

## Key Decisions

### DEC-019: Calculated Live, Not Stored
**Decision:** Score recalculates on every listing load via RPC — not stored in DB  
**Reasoning:** Bid data changes constantly. A stored score would go stale within hours.
Supabase RPC is fast enough (<100ms) that live calculation is preferable to stale data.  
**Status:** ✅ Final

### DEC-020: P25-P75 Range (Not Mean)
**Decision:** Use 25th–75th percentile range, not average  
**Reasoning:** Averages are skewed by outlier bids. P25-P75 represents the realistic
"fair zone" where most successful transactions land. More defensible to VCs.  
**Status:** ✅ Final
