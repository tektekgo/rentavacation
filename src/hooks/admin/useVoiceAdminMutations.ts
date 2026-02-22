import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc as any;

/** Update a membership tier's voice_quota_daily */
export function useUpdateTierQuota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tierId,
      voiceQuotaDaily,
    }: {
      tierId: string;
      voiceQuotaDaily: number;
    }) => {
      const { error } = await supabase
        .from("membership_tiers")
        .update({ voice_quota_daily: voiceQuotaDaily })
        .eq("id", tierId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-tiers"] });
    },
  });
}

/** Upsert a per-user voice override */
export function useUpsertVoiceOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      voiceDisabled,
      customQuotaDaily,
      reason,
      createdBy,
    }: {
      userId: string;
      voiceDisabled: boolean;
      customQuotaDaily: number | null;
      reason: string | null;
      createdBy: string;
    }) => {
      const { error } = await supabase.from("voice_user_overrides").upsert(
        {
          user_id: userId,
          voice_disabled: voiceDisabled,
          custom_quota_daily: customQuotaDaily,
          reason,
          created_by: createdBy,
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-user-overrides"] });
    },
  });
}

/** Delete a per-user voice override (revert to tier defaults) */
export function useDeleteVoiceOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("voice_user_overrides")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-user-overrides"] });
    },
  });
}

/** Update voice alert threshold system_settings */
export function useUpdateVoiceAlertSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      settingKey,
      settingValue,
    }: {
      settingKey: string;
      settingValue: Record<string, unknown>;
    }) => {
      const { error } = await supabase
        .from("system_settings")
        .update({ setting_value: settingValue })
        .eq("setting_key", settingKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-alert-settings"] });
    },
  });
}

/** Log a voice search (called from useVoiceSearch) */
export function useLogVoiceSearch() {
  return useMutation({
    mutationFn: async (params: {
      search_params: Record<string, unknown>;
      results_count: number;
      latency_ms: number | null;
      status: string;
      error_message: string | null;
      source: string;
    }) => {
      const { error } = await rpc("log_voice_search", {
        _search_params: params.search_params,
        _results_count: params.results_count,
        _latency_ms: params.latency_ms,
        _status: params.status,
        _error_message: params.error_message,
        _source: params.source,
      });
      if (error) throw error;
    },
  });
}
