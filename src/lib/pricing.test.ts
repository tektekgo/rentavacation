import { describe, it, expect } from 'vitest';
import { calculateNights, computeListingPricing } from './pricing';

describe('calculateNights', () => {
  it('returns correct nights for a standard week', () => {
    expect(calculateNights('2026-03-15', '2026-03-22')).toBe(7);
  });

  it('returns 1 for a single night stay', () => {
    expect(calculateNights('2026-06-01', '2026-06-02')).toBe(1);
  });

  it('returns 0 when check-in equals check-out', () => {
    expect(calculateNights('2026-06-01', '2026-06-01')).toBe(0);
  });

  it('returns 0 when check-out is before check-in', () => {
    expect(calculateNights('2026-06-05', '2026-06-01')).toBe(0);
  });

  it('handles month boundaries correctly', () => {
    expect(calculateNights('2026-01-29', '2026-02-05')).toBe(7);
  });

  it('handles year boundaries correctly', () => {
    expect(calculateNights('2025-12-28', '2026-01-04')).toBe(7);
  });
});

describe('computeListingPricing', () => {
  it('computes correct pricing for $200/night x 7 nights', () => {
    const result = computeListingPricing(200, 7);
    expect(result.ownerPrice).toBe(1400);
    expect(result.ravMarkup).toBe(210);
    expect(result.finalPrice).toBe(1610);
  });

  it('computes correct pricing for $150/night x 3 nights', () => {
    const result = computeListingPricing(150, 3);
    expect(result.ownerPrice).toBe(450);
    expect(result.ravMarkup).toBe(68); // round(450 * 0.15) = round(67.5) = 68
    expect(result.finalPrice).toBe(518);
  });

  it('returns zeros for 0 nights', () => {
    const result = computeListingPricing(200, 0);
    expect(result.ownerPrice).toBe(0);
    expect(result.ravMarkup).toBe(0);
    expect(result.finalPrice).toBe(0);
  });

  it('returns zeros for $0/night', () => {
    const result = computeListingPricing(0, 7);
    expect(result.ownerPrice).toBe(0);
    expect(result.ravMarkup).toBe(0);
    expect(result.finalPrice).toBe(0);
  });

  it('rounds to whole dollars', () => {
    const result = computeListingPricing(99, 5);
    expect(result.ownerPrice).toBe(495);
    expect(result.ravMarkup).toBe(74); // round(495 * 0.15) = round(74.25) = 74
    expect(result.finalPrice).toBe(569);
  });
});
