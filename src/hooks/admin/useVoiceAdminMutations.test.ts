import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createHookWrapper } from "@/test/helpers/render";

// Mock supabase — use vi.hoisted to declare mocks safely
const { mockUpdate, mockUpsert, mockDelete, mockFrom, mockRpc } = vi.hoisted(() => {
  const mockUpdate = vi.fn();
  const mockUpsert = vi.fn();
  const mockDelete = vi.fn();
  const mockFrom = vi.fn();
  const mockRpc = vi.fn();
  return { mockUpdate, mockUpsert, mockDelete, mockFrom, mockRpc };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
  },
  isSupabaseConfigured: () => true,
}));

import {
  useUpdateTierQuota,
  useUpsertVoiceOverride,
  useDeleteVoiceOverride,
  useUpdateVoiceAlertSettings,
} from "./useVoiceAdminMutations";

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdate.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  mockDelete.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  mockUpsert.mockResolvedValue({ error: null });
  mockRpc.mockResolvedValue({ data: null, error: null });
  mockFrom.mockReturnValue({
    update: mockUpdate,
    upsert: mockUpsert,
    delete: mockDelete,
  });
});

describe("useUpdateTierQuota", () => {
  it("updates membership tier voice quota", async () => {
    const { result } = renderHook(() => useUpdateTierQuota(), {
      wrapper: createHookWrapper(),
    });

    act(() => {
      result.current.mutate({ tierId: "tier-1", voiceQuotaDaily: 50 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith("membership_tiers");
    expect(mockUpdate).toHaveBeenCalledWith({ voice_quota_daily: 50 });
  });
});

describe("useUpsertVoiceOverride", () => {
  it("upserts a voice user override", async () => {
    const { result } = renderHook(() => useUpsertVoiceOverride(), {
      wrapper: createHookWrapper(),
    });

    act(() => {
      result.current.mutate({
        userId: "user-1",
        voiceDisabled: true,
        customQuotaDaily: null,
        reason: "Abuse detected",
        createdBy: "admin-1",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith("voice_user_overrides");
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: "user-1",
        voice_disabled: true,
        custom_quota_daily: null,
        reason: "Abuse detected",
        created_by: "admin-1",
      },
      { onConflict: "user_id" }
    );
  });
});

describe("useDeleteVoiceOverride", () => {
  it("deletes a voice user override", async () => {
    const { result } = renderHook(() => useDeleteVoiceOverride(), {
      wrapper: createHookWrapper(),
    });

    act(() => {
      result.current.mutate("user-1");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith("voice_user_overrides");
    expect(mockDelete).toHaveBeenCalled();
  });
});

describe("useUpdateVoiceAlertSettings", () => {
  it("updates alert threshold settings", async () => {
    const { result } = renderHook(() => useUpdateVoiceAlertSettings(), {
      wrapper: createHookWrapper(),
    });

    act(() => {
      result.current.mutate({
        settingKey: "voice_alert_error_rate_threshold",
        settingValue: { threshold_pct: 15, window_hours: 2, enabled: true },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith("system_settings");
    expect(mockUpdate).toHaveBeenCalledWith({
      setting_value: { threshold_pct: 15, window_hours: 2, enabled: true },
    });
  });
});
