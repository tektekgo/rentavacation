import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createHookWrapper } from "@/test/helpers/render";
import { mockUser } from "@/test/fixtures/users";

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
  isSupabaseConfigured: () => true,
}));

const { useFavoriteIds, useToggleFavorite } = await import("./useFavorites");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useFavoriteIds", () => {
  it("returns favorite IDs for logged-in user", async () => {
    const user = mockUser();
    mockUseAuth.mockReturnValue({ user });

    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockResolvedValue({
          data: [{ property_id: "p1" }, { property_id: "p2" }],
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useFavoriteIds(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(["p1", "p2"]);
  });

  it("returns empty array when not logged in", async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useFavoriteIds(), {
      wrapper: createHookWrapper(),
    });

    // Query should be disabled, fetchStatus idle
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("handles database error", async () => {
    const user = mockUser();
    mockUseAuth.mockReturnValue({ user });

    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockResolvedValue({
          data: null,
          error: { message: "DB error" },
        }),
      }),
    });

    const { result } = renderHook(() => useFavoriteIds(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useToggleFavorite", () => {
  it("throws error when not logged in", async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useToggleFavorite(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate("p1");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Must be logged in");
  });

  it("removes favorite when already favorited", async () => {
    const user = mockUser();
    mockUseAuth.mockReturnValue({ user });

    // First call: .from("favorites").select("id").eq().eq().maybeSingle()
    // returns existing favorite
    const chainForCheck = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle.mockResolvedValue({
              data: { id: "fav-1" },
              error: null,
            }),
          }),
        }),
      }),
      delete: mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    };

    mockFrom.mockReturnValue(chainForCheck);

    const { result } = renderHook(() => useToggleFavorite(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate("p1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.action).toBe("removed");
  });

  it("adds favorite when not yet favorited", async () => {
    const user = mockUser();
    mockUseAuth.mockReturnValue({ user });

    const chainForCheck = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle.mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
      insert: mockInsert.mockResolvedValue({ error: null }),
    };

    mockFrom.mockReturnValue(chainForCheck);

    const { result } = renderHook(() => useToggleFavorite(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate("p1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.action).toBe("added");
  });
});
