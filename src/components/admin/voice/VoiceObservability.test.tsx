import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";

const mockLogs = [
  {
    id: "log1",
    user_id: "u1",
    search_params: { destination: "Hawaii" },
    results_count: 5,
    latency_ms: 850,
    status: "success",
    error_message: null,
    source: "voice",
    created_at: "2026-02-20T14:30:00Z",
    profiles: { email: "user@example.com", full_name: "Test User" },
  },
  {
    id: "log2",
    user_id: "u2",
    search_params: { destination: "Miami" },
    results_count: 0,
    latency_ms: 2100,
    status: "error",
    error_message: "Timeout exceeded",
    source: "voice",
    created_at: "2026-02-20T13:15:00Z",
    profiles: { email: "other@example.com", full_name: null },
  },
];

const mockAlertSettings = [
  {
    setting_key: "voice_alert_error_rate_threshold",
    setting_value: { threshold_pct: 10, window_hours: 1, enabled: false },
  },
  {
    setting_key: "voice_alert_daily_volume_threshold",
    setting_value: { min_expected: 5, max_expected: 500, enabled: false },
  },
];

const { mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn();
  return { mockFrom };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    rpc: vi.fn(),
  },
  isSupabaseConfigured: () => true,
}));

import { VoiceObservability } from "./VoiceObservability";

function createThenableChain(data: unknown, methods: string[] = []) {
  const resolvedValue = { data, error: null };
  const chain: Record<string, unknown> = {};
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Make it awaitable — critical for React Query
  const promise = Promise.resolve(resolvedValue);
  chain.then = promise.then.bind(promise);
  chain.catch = promise.catch.bind(promise);
  chain.finally = promise.finally.bind(promise);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockImplementation((table: string) => {
    if (table === "voice_search_logs") {
      return createThenableChain(mockLogs, [
        "select", "order", "limit", "eq", "gte", "lte",
      ]);
    }
    // system_settings
    return createThenableChain(mockAlertSettings, [
      "select", "in", "update",
    ]);
  });
});

describe("VoiceObservability", () => {
  it("renders recent search logs", async () => {
    renderWithProviders(<VoiceObservability />);

    await waitFor(() => {
      expect(screen.getByText("Hawaii")).toBeInTheDocument();
    });
    expect(screen.getByText("Miami")).toBeInTheDocument();
  });

  it("shows status badges for log entries", async () => {
    renderWithProviders(<VoiceObservability />);

    await waitFor(() => {
      expect(screen.getByText("success")).toBeInTheDocument();
    });
    expect(screen.getByText("error")).toBeInTheDocument();
  });

  it("renders alert threshold settings", async () => {
    renderWithProviders(<VoiceObservability />);

    await waitFor(() => {
      expect(screen.getByText("Alert Thresholds")).toBeInTheDocument();
    });
    expect(screen.getByText("Error Rate Alert")).toBeInTheDocument();
    expect(screen.getByText("Daily Volume Alert")).toBeInTheDocument();
  });
});
