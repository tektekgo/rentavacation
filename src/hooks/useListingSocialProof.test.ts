import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getDaysAgo,
  getFreshnessLabel,
  getPopularityLabel,
} from "./useListingSocialProof";

describe("getDaysAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 0 for today", () => {
    expect(getDaysAgo("2026-03-10T10:00:00Z")).toBe(0);
  });

  it("returns 1 for yesterday", () => {
    expect(getDaysAgo("2026-03-09T12:00:00Z")).toBe(1);
  });

  it("returns 7 for a week ago", () => {
    expect(getDaysAgo("2026-03-03T12:00:00Z")).toBe(7);
  });

  it("returns 30 for a month ago", () => {
    expect(getDaysAgo("2026-02-08T12:00:00Z")).toBe(30);
  });

  it("returns large number for old dates", () => {
    expect(getDaysAgo("2025-01-01T00:00:00Z")).toBeGreaterThan(400);
  });
});

describe("getFreshnessLabel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just Listed" for listings created today', () => {
    expect(getFreshnessLabel("2026-03-10T08:00:00Z")).toBe("Just Listed");
  });

  it('returns "Just Listed" for listings created yesterday', () => {
    expect(getFreshnessLabel("2026-03-09T12:00:00Z")).toBe("Just Listed");
  });

  it('returns "New" for listings 2-3 days old', () => {
    expect(getFreshnessLabel("2026-03-08T12:00:00Z")).toBe("New");
    expect(getFreshnessLabel("2026-03-07T12:00:00Z")).toBe("New");
  });

  it('returns "This Week" for listings 4-7 days old', () => {
    expect(getFreshnessLabel("2026-03-06T12:00:00Z")).toBe("This Week");
    expect(getFreshnessLabel("2026-03-03T12:00:00Z")).toBe("This Week");
  });

  it("returns null for listings older than 7 days", () => {
    expect(getFreshnessLabel("2026-03-02T12:00:00Z")).toBeNull();
    expect(getFreshnessLabel("2026-02-01T12:00:00Z")).toBeNull();
  });
});

describe("getPopularityLabel", () => {
  it("returns null for 0 favorites", () => {
    expect(getPopularityLabel(0)).toBeNull();
  });

  it("returns null for 1-2 favorites", () => {
    expect(getPopularityLabel(1)).toBeNull();
    expect(getPopularityLabel(2)).toBeNull();
  });

  it('returns "Trending" for 3-4 favorites', () => {
    expect(getPopularityLabel(3)).toBe("Trending");
    expect(getPopularityLabel(4)).toBe("Trending");
  });

  it('returns "Popular" for 5-9 favorites', () => {
    expect(getPopularityLabel(5)).toBe("Popular");
    expect(getPopularityLabel(9)).toBe("Popular");
  });

  it('returns "Very Popular" for 10+ favorites', () => {
    expect(getPopularityLabel(10)).toBe("Very Popular");
    expect(getPopularityLabel(50)).toBe("Very Popular");
  });
});
