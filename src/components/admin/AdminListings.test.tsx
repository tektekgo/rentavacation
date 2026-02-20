import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();
const mockInvoke = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
  isSupabaseConfigured: () => true,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "admin-1" },
    hasRole: () => true,
    isRavTeam: () => true,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("AdminListings email notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: from().select()...order() for initial fetch
    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        order: mockOrder.mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
      update: mockUpdate.mockReturnValue({
        eq: mockEq.mockResolvedValue({ error: null }),
      }),
    });

    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
  });

  it("calls send-approval-email after approving a listing", async () => {
    // Import dynamically so mocks are in place
    const { default: AdminListings } = await import("./AdminListings");
    const { renderWithProviders } = await import("@/test/helpers/render");

    // Simulate listings data being loaded
    const listingData = [
      {
        id: "listing-1",
        status: "pending_approval" as const,
        check_in_date: "2026-04-01",
        check_out_date: "2026-04-07",
        final_price: 1200,
        owner_price: 1000,
        rav_markup: 200,
        owner: { id: "owner-1", full_name: "Test Owner", email: "owner@test.com" },
        property: { resort_name: "Test Resort", location: "Orlando, FL" },
      },
    ];

    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        order: mockOrder.mockResolvedValue({
          data: listingData,
          error: null,
        }),
      }),
      update: mockUpdate.mockReturnValue({
        eq: mockEq.mockResolvedValue({ error: null }),
      }),
    });

    const { findByText } = renderWithProviders(<AdminListings />);

    // Wait for data to load and click approve
    const approveBtn = await findByText("Approve");
    approveBtn.click();

    // The email invoke should be called with the owner's user_id
    await vi.waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("send-approval-email", {
        body: {
          user_id: "owner-1",
          action: "approved",
          email_type: "user_approval",
        },
      });
    });
  });

  it("calls send-approval-email after rejecting a listing", async () => {
    const { default: AdminListings } = await import("./AdminListings");
    const { renderWithProviders } = await import("@/test/helpers/render");

    const listingData = [
      {
        id: "listing-2",
        status: "pending_approval" as const,
        check_in_date: "2026-05-01",
        check_out_date: "2026-05-07",
        final_price: 900,
        owner_price: 750,
        rav_markup: 150,
        owner: { id: "owner-2", full_name: "Another Owner", email: "owner2@test.com" },
        property: { resort_name: "Beach Resort", location: "Miami, FL" },
      },
    ];

    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        order: mockOrder.mockResolvedValue({
          data: listingData,
          error: null,
        }),
      }),
      update: mockUpdate.mockReturnValue({
        eq: mockEq.mockResolvedValue({ error: null }),
      }),
    });

    const { findByText } = renderWithProviders(<AdminListings />);

    const rejectBtn = await findByText("Reject");
    rejectBtn.click();

    await vi.waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("send-approval-email", {
        body: {
          user_id: "owner-2",
          action: "rejected",
          email_type: "user_approval",
        },
      });
    });
  });
});
