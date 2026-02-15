import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface VoiceFeatureFlags {
  voiceEnabled: boolean;
  voiceSearchEnabled: boolean;
  voiceListingEnabled: boolean;
  voiceBiddingEnabled: boolean;
  loading: boolean;
  isFeatureActive: (feature: "search" | "listing" | "bidding") => boolean;
}

const VOICE_SETTING_KEYS = [
  "voice_enabled",
  "voice_search_enabled",
  "voice_listing_enabled",
  "voice_bidding_enabled",
] as const;

export function useVoiceFeatureFlags(): VoiceFeatureFlags {
  const { data, isLoading } = useQuery({
    queryKey: ["voice-feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [...VOICE_SETTING_KEYS]);

      if (error) throw error;

      const flags: Record<string, boolean> = {};
      for (const row of data || []) {
        const val = row.setting_value as Record<string, unknown>;
        flags[row.setting_key] = val.enabled as boolean;
      }
      return flags;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const voiceEnabled = data?.voice_enabled ?? true;
  const voiceSearchEnabled = data?.voice_search_enabled ?? true;
  const voiceListingEnabled = data?.voice_listing_enabled ?? false;
  const voiceBiddingEnabled = data?.voice_bidding_enabled ?? false;

  const isFeatureActive = (feature: "search" | "listing" | "bidding") => {
    if (!voiceEnabled) return false;
    switch (feature) {
      case "search":
        return voiceSearchEnabled;
      case "listing":
        return voiceListingEnabled;
      case "bidding":
        return voiceBiddingEnabled;
    }
  };

  return {
    voiceEnabled,
    voiceSearchEnabled,
    voiceListingEnabled,
    voiceBiddingEnabled,
    loading: isLoading,
    isFeatureActive,
  };
}
