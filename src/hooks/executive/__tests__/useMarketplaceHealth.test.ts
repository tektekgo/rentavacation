import { describe, it, expect } from 'vitest';
import { calculateLiquidityScore } from '../useMarketplaceHealth';

describe('calculateLiquidityScore', () => {
  it('returns 0 for all-zero components', () => {
    const score = calculateLiquidityScore({
      bidAcceptanceRate: 0,
      avgTimeToBook: 20,
      activeListingRatio: 0,
      repeatBookingRate: 0,
    });
    expect(score).toBe(0);
  });

  it('returns 100 for perfect components', () => {
    const score = calculateLiquidityScore({
      bidAcceptanceRate: 1.0,
      avgTimeToBook: 0,
      activeListingRatio: 1.0,
      repeatBookingRate: 1.0,
    });
    expect(score).toBe(100);
  });

  it('clamps score to max 100', () => {
    const score = calculateLiquidityScore({
      bidAcceptanceRate: 2.0,
      avgTimeToBook: 0,
      activeListingRatio: 2.0,
      repeatBookingRate: 2.0,
    });
    expect(score).toBeLessThanOrEqual(100);
  });

  it('clamps score to min 0', () => {
    const score = calculateLiquidityScore({
      bidAcceptanceRate: 0,
      avgTimeToBook: 100,
      activeListingRatio: 0,
      repeatBookingRate: 0,
    });
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('calculates a moderate score correctly', () => {
    const score = calculateLiquidityScore({
      bidAcceptanceRate: 0.5,    // 50 * 0.3 = 15
      avgTimeToBook: 10,         // (100-50) * 0.25 = 12.5
      activeListingRatio: 0.6,   // 60 * 0.25 = 15
      repeatBookingRate: 0.3,    // 30 * 0.20 = 6
    });
    // 15 + 12.5 + 15 + 6 = 48.5 → rounded to 49
    expect(score).toBe(49);
  });

  it('higher bid acceptance rate increases score', () => {
    const base = calculateLiquidityScore({
      bidAcceptanceRate: 0.3,
      avgTimeToBook: 5,
      activeListingRatio: 0.5,
      repeatBookingRate: 0.2,
    });
    const better = calculateLiquidityScore({
      bidAcceptanceRate: 0.8,
      avgTimeToBook: 5,
      activeListingRatio: 0.5,
      repeatBookingRate: 0.2,
    });
    expect(better).toBeGreaterThan(base);
  });

  it('lower time-to-book increases score', () => {
    const slow = calculateLiquidityScore({
      bidAcceptanceRate: 0.5,
      avgTimeToBook: 15,
      activeListingRatio: 0.5,
      repeatBookingRate: 0.2,
    });
    const fast = calculateLiquidityScore({
      bidAcceptanceRate: 0.5,
      avgTimeToBook: 2,
      activeListingRatio: 0.5,
      repeatBookingRate: 0.2,
    });
    expect(fast).toBeGreaterThan(slow);
  });
});
