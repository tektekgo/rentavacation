import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DateRangeFilter } from "./DateRangeFilter";
import { subDays, startOfMonth, format } from "date-fns";

describe("DateRangeFilter", () => {
  it("renders with default label when no value is set", () => {
    render(<DateRangeFilter value={undefined} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /date range/i })).toBeInTheDocument();
  });

  it("displays formatted date range when value is set", () => {
    const from = new Date(2026, 0, 10);
    const to = new Date(2026, 0, 20);
    render(<DateRangeFilter value={{ from, to }} onChange={vi.fn()} />);
    expect(screen.getByText(/Jan 10 - Jan 20, 2026/)).toBeInTheDocument();
  });

  it("displays single date when only from is set", () => {
    const from = new Date(2026, 2, 15);
    render(<DateRangeFilter value={{ from, to: undefined }} onChange={vi.fn()} />);
    expect(screen.getByText(/Mar 15, 2026/)).toBeInTheDocument();
  });

  it("shows clear button when value is set", () => {
    const from = new Date(2026, 0, 1);
    const to = new Date(2026, 0, 31);
    render(<DateRangeFilter value={{ from, to }} onChange={vi.fn()} />);
    expect(screen.getByTitle("Clear date filter")).toBeInTheDocument();
  });

  it("does not show clear button when no value", () => {
    render(<DateRangeFilter value={undefined} onChange={vi.fn()} />);
    expect(screen.queryByTitle("Clear date filter")).not.toBeInTheDocument();
  });

  it("calls onChange with undefined when clear is clicked", () => {
    const onChange = vi.fn();
    const from = new Date(2026, 0, 1);
    const to = new Date(2026, 0, 31);
    render(<DateRangeFilter value={{ from, to }} onChange={onChange} />);

    fireEvent.click(screen.getByTitle("Clear date filter"));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("shows preset buttons when popover is opened", async () => {
    render(<DateRangeFilter value={undefined} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /date range/i }));

    expect(await screen.findByText("Last 7 days")).toBeInTheDocument();
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
    expect(screen.getByText("This month")).toBeInTheDocument();
    expect(screen.getByText("Last month")).toBeInTheDocument();
  });

  it("calls onChange with preset dates when a preset is clicked", async () => {
    const onChange = vi.fn();
    render(<DateRangeFilter value={undefined} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /date range/i }));
    const preset = await screen.findByText("This month");
    fireEvent.click(preset);

    expect(onChange).toHaveBeenCalledTimes(1);
    const call = onChange.mock.calls[0][0];
    expect(call.from).toBeDefined();
    expect(call.to).toBeDefined();
    // "This month" starts at 1st of current month
    expect(call.from.getDate()).toBe(1);
  });
});
