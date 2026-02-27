import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgeBadge } from "./AgeBadge";

describe("AgeBadge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows 'Today' for items created today", () => {
    render(<AgeBadge date="2026-03-10T10:00:00Z" />);
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("shows days for older items", () => {
    render(<AgeBadge date="2026-03-07T10:00:00Z" />);
    expect(screen.getByText("3d")).toBeInTheDocument();
  });

  it("applies green color for items within warning threshold", () => {
    const { container } = render(<AgeBadge date="2026-03-09T10:00:00Z" thresholds={{ warning: 3, critical: 7 }} />);
    const badge = container.querySelector("[class*='text-green']");
    expect(badge).toBeTruthy();
  });

  it("applies yellow color for items at warning threshold", () => {
    const { container } = render(<AgeBadge date="2026-03-07T10:00:00Z" thresholds={{ warning: 3, critical: 7 }} />);
    const badge = container.querySelector("[class*='text-yellow']");
    expect(badge).toBeTruthy();
  });

  it("applies red color for items at critical threshold", () => {
    const { container } = render(<AgeBadge date="2026-02-28T10:00:00Z" thresholds={{ warning: 3, critical: 7 }} />);
    const badge = container.querySelector("[class*='text-red']");
    expect(badge).toBeTruthy();
  });

  it("shows hours when useHours is true", () => {
    render(<AgeBadge date="2026-03-10T06:00:00Z" useHours />);
    expect(screen.getByText("6h")).toBeInTheDocument();
  });

  it("shows days+hours for >24h when useHours is true", () => {
    render(<AgeBadge date="2026-03-08T06:00:00Z" useHours />);
    expect(screen.getByText("2d 6h")).toBeInTheDocument();
  });
});
