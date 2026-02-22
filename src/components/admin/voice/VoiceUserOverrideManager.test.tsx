import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";

const mockOverrides = [
  {
    id: "o1",
    user_id: "u1",
    voice_disabled: true,
    custom_quota_daily: null,
    reason: "Abuse",
    created_by: "admin-1",
    created_at: "2026-02-20T00:00:00Z",
    updated_at: "2026-02-20T00:00:00Z",
    profiles: { email: "user@example.com", full_name: "Test User" },
  },
];

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "admin-1", email: "admin@rav.com" },
    isRavTeam: () => true,
    hasRole: () => true,
    isLoading: false,
  }),
}));

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

import { VoiceUserOverrideManager } from "./VoiceUserOverrideManager";

beforeEach(() => {
  vi.clearAllMocks();
  const chain = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  };
  Object.assign(chain, {
    then: (resolve: (v: unknown) => void) =>
      resolve({ data: mockOverrides, error: null }),
  });
  mockFrom.mockReturnValue(chain);
});

describe("VoiceUserOverrideManager", () => {
  it("renders existing overrides", async () => {
    renderWithProviders(<VoiceUserOverrideManager />);

    await waitFor(() => {
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });
    expect(screen.getByText("Disabled")).toBeInTheDocument();
    expect(screen.getByText("Abuse")).toBeInTheDocument();
  });

  it("shows add override form with search", async () => {
    renderWithProviders(<VoiceUserOverrideManager />);

    await waitFor(() => {
      expect(screen.getByText("Add Override")).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("Search by email...")).toBeInTheDocument();
  });

  it("shows remove button for overrides", async () => {
    renderWithProviders(<VoiceUserOverrideManager />);

    await waitFor(() => {
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });

    // Trash icon button is present
    const deleteButtons = screen.getAllByRole("button");
    const trashButton = deleteButtons.find(
      (btn) => btn.querySelector("svg")
    );
    expect(trashButton).toBeTruthy();
  });
});
