import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";

const mockTiers = [
  {
    id: "t1",
    tier_key: "traveler_free",
    tier_name: "Free",
    role_category: "traveler",
    voice_quota_daily: 5,
  },
  {
    id: "t2",
    tier_key: "traveler_plus",
    tier_name: "Plus",
    role_category: "traveler",
    voice_quota_daily: 25,
  },
  {
    id: "t3",
    tier_key: "owner_business",
    tier_name: "Business",
    role_category: "owner",
    voice_quota_daily: -1,
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

import { VoiceTierQuotaManager } from "./VoiceTierQuotaManager";

beforeEach(() => {
  vi.clearAllMocks();
  // Default chain that resolves with tier data
  const chain = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  };
  // Make it thenable
  Object.assign(chain, {
    then: (resolve: (v: unknown) => void) =>
      resolve({ data: mockTiers, error: null }),
  });
  mockFrom.mockReturnValue(chain);
});

describe("VoiceTierQuotaManager", () => {
  it("renders tier names and quotas", async () => {
    renderWithProviders(<VoiceTierQuotaManager />);

    await waitFor(() => {
      expect(screen.getByText("Free")).toBeInTheDocument();
    });
    expect(screen.getByText("Plus")).toBeInTheDocument();
    expect(screen.getByText("Business")).toBeInTheDocument();
    expect(screen.getByText("5/day")).toBeInTheDocument();
    expect(screen.getByText("25/day")).toBeInTheDocument();
  });

  it("shows unlimited badge for -1 quota", async () => {
    renderWithProviders(<VoiceTierQuotaManager />);

    await waitFor(() => {
      expect(screen.getByText("Unlimited")).toBeInTheDocument();
    });
  });

  it("enters edit mode on Edit click", async () => {
    renderWithProviders(<VoiceTierQuotaManager />);

    await waitFor(() => {
      expect(screen.getByText("Free")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    expect(screen.getByLabelText("Voice quota")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });
});
