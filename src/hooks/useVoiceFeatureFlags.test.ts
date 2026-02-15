import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createHookWrapper } from "@/test/helpers/render";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
  isSupabaseConfigured: () => true,
}));

function createChainedMock(data: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {};
  const resolved = Promise.resolve({ data, error: null });
  const methods = ["select", "eq", "in", "order", "single", "maybeSingle"];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain.then = (resolve: any) => resolve({ data, error: null });
  return Object.assign(resolved, chain);
}

describe("useVoiceFeatureFlags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all flags enabled when all are true", async () => {
    mockFrom.mockReturnValue(
      createChainedMock([
        { setting_key: "voice_enabled", setting_value: { enabled: true } },
        { setting_key: "voice_search_enabled", setting_value: { enabled: true } },
        { setting_key: "voice_listing_enabled", setting_value: { enabled: false } },
        { setting_key: "voice_bidding_enabled", setting_value: { enabled: false } },
      ])
    );

    const { useVoiceFeatureFlags } = await import("./useVoiceFeatureFlags");
    const { result } = renderHook(() => useVoiceFeatureFlags(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.voiceEnabled).toBe(true);
    expect(result.current.voiceSearchEnabled).toBe(true);
    expect(result.current.isFeatureActive("search")).toBe(true);
    expect(result.current.isFeatureActive("listing")).toBe(false);
    expect(result.current.isFeatureActive("bidding")).toBe(false);
  });

  it("disables all features when master is off", async () => {
    mockFrom.mockReturnValue(
      createChainedMock([
        { setting_key: "voice_enabled", setting_value: { enabled: false } },
        { setting_key: "voice_search_enabled", setting_value: { enabled: true } },
        { setting_key: "voice_listing_enabled", setting_value: { enabled: true } },
        { setting_key: "voice_bidding_enabled", setting_value: { enabled: true } },
      ])
    );

    const { useVoiceFeatureFlags } = await import("./useVoiceFeatureFlags");
    const { result } = renderHook(() => useVoiceFeatureFlags(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.voiceEnabled).toBe(false);
    expect(result.current.isFeatureActive("search")).toBe(false);
    expect(result.current.isFeatureActive("listing")).toBe(false);
    expect(result.current.isFeatureActive("bidding")).toBe(false);
  });
});
