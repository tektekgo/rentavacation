import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createHookWrapper } from "@/test/helpers/render";
import {
  mockTravelerTiers,
  mockOwnerTiers,
  mockUserMembershipWithTier,
} from "@/test/fixtures/memberships";

// Mock supabase
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
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

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "test@test.com" },
    isRavTeam: () => false,
    isPropertyOwner: () => false,
  }),
}));

function createChainedMock(data: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {};
  const resolved = Promise.resolve({ data, error: null });

  const methods = ["select", "eq", "neq", "in", "order", "single", "maybeSingle", "limit"];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain.then = (resolve: any) => resolve({ data, error: null });
  return Object.assign(resolved, chain);
}

describe("useMembership hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useMembershipTiers", () => {
    it("fetches all membership tiers", async () => {
      const allTiers = [...mockTravelerTiers(), ...mockOwnerTiers()];
      mockFrom.mockReturnValue(createChainedMock(allTiers));

      const { useMembershipTiers } = await import("./useMembership");
      const { result } = renderHook(() => useMembershipTiers(), {
        wrapper: createHookWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(6);
    });
  });

  describe("useTravelerTiers", () => {
    it("fetches traveler tiers only", async () => {
      const tiers = mockTravelerTiers();
      mockFrom.mockReturnValue(createChainedMock(tiers));

      const { useTravelerTiers } = await import("./useMembership");
      const { result } = renderHook(() => useTravelerTiers(), {
        wrapper: createHookWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(3);
      expect(result.current.data![0].role_category).toBe("traveler");
    });
  });

  describe("useOwnerTiers", () => {
    it("fetches owner tiers only", async () => {
      const tiers = mockOwnerTiers();
      mockFrom.mockReturnValue(createChainedMock(tiers));

      const { useOwnerTiers } = await import("./useMembership");
      const { result } = renderHook(() => useOwnerTiers(), {
        wrapper: createHookWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(3);
      expect(result.current.data![0].role_category).toBe("owner");
    });
  });

  describe("useMyMembership", () => {
    it("fetches current user membership with tier", async () => {
      const membership = mockUserMembershipWithTier();
      mockFrom.mockReturnValue(createChainedMock(membership));

      const { useMyMembership } = await import("./useMembership");
      const { result } = renderHook(() => useMyMembership(), {
        wrapper: createHookWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.tier.tier_name).toBe("Free");
      expect(result.current.data?.status).toBe("active");
    });

    it("returns null when no membership exists", async () => {
      mockFrom.mockReturnValue(createChainedMock(null));

      const { useMyMembership } = await import("./useMembership");
      const { result } = renderHook(() => useMyMembership(), {
        wrapper: createHookWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeNull();
    });
  });
});
