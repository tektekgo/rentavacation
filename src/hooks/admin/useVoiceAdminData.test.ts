import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createHookWrapper } from "@/test/helpers/render";

const { mockRpc, mockFrom } = vi.hoisted(() => {
  const mockRpc = vi.fn();
  const mockFrom = vi.fn();
  return { mockRpc, mockFrom };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
  },
  isSupabaseConfigured: () => true,
}));

import {
  useVoiceUsageStats,
  useVoiceTopUsers,
  useVoiceSearchLogs,
  useVoiceUserOverrides,
} from "./useVoiceAdminData";

beforeEach(() => {
  vi.clearAllMocks();
  // Default from() mock — empty data
  const chain = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
  };
  Object.assign(chain, {
    then: (resolve: (v: unknown) => void) =>
      resolve({ data: [], error: null }),
  });
  mockFrom.mockReturnValue(chain);
});

describe("useVoiceUsageStats", () => {
  it("calls get_voice_usage_stats RPC with correct params", async () => {
    const mockStats = [
      {
        search_date: "2026-02-20",
        total_searches: 42,
        unique_users: 10,
        success_count: 38,
        error_count: 4,
        no_results_count: 0,
        timeout_count: 0,
        avg_latency_ms: 850,
        avg_results_count: 3.2,
      },
    ];

    mockRpc.mockResolvedValue({ data: mockStats, error: null });

    const { result } = renderHook(() => useVoiceUsageStats(7), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith("get_voice_usage_stats", {
      _days: 7,
    });
    expect(result.current.data).toEqual(mockStats);
  });
});

describe("useVoiceTopUsers", () => {
  it("calls get_voice_top_users RPC with correct params", async () => {
    const mockUsers = [
      {
        user_id: "u1",
        email: "test@example.com",
        full_name: "Test User",
        total_searches: 100,
        success_count: 90,
        error_count: 10,
        success_rate: 90.0,
        last_search_at: "2026-02-20T12:00:00Z",
      },
    ];

    mockRpc.mockResolvedValue({ data: mockUsers, error: null });

    const { result } = renderHook(() => useVoiceTopUsers(14, 10), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith("get_voice_top_users", {
      _days: 14,
      _limit: 10,
    });
    expect(result.current.data).toEqual(mockUsers);
  });
});

describe("useVoiceSearchLogs", () => {
  it("fetches logs from voice_search_logs table", async () => {
    const { result } = renderHook(() => useVoiceSearchLogs(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith("voice_search_logs");
  });
});

describe("useVoiceUserOverrides", () => {
  it("fetches overrides from voice_user_overrides table", async () => {
    const { result } = renderHook(() => useVoiceUserOverrides(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith("voice_user_overrides");
  });
});
