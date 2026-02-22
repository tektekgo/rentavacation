import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  VoiceUsageStats,
  VoiceTopUser,
  VoiceSearchLog,
  VoiceUserOverride,
} from "@/types/voice";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc as any;

/** Daily aggregate stats for voice search observability */
export function useVoiceUsageStats(days = 30) {
  return useQuery<VoiceUsageStats[]>({
    queryKey: ["voice-usage-stats", days],
    queryFn: async () => {
      const { data, error } = await rpc("get_voice_usage_stats", {
        _days: days,
      });
      if (error) throw error;
      return (data ?? []) as VoiceUsageStats[];
    },
  });
}

/** Top voice search users by volume */
export function useVoiceTopUsers(days = 30, limit = 20) {
  return useQuery<VoiceTopUser[]>({
    queryKey: ["voice-top-users", days, limit],
    queryFn: async () => {
      const { data, error } = await rpc("get_voice_top_users", {
        _days: days,
        _limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as VoiceTopUser[];
    },
  });
}

interface SearchLogFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
}

/** Recent search logs with optional status/date filters */
export function useVoiceSearchLogs(filters?: SearchLogFilters) {
  return useQuery<VoiceSearchLog[]>({
    queryKey: ["voice-search-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("voice_search_logs")
        .select("*, profiles!voice_search_logs_user_id_fkey(email, full_name)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as VoiceSearchLog[];
    },
  });
}

/** All voice user overrides joined with profile emails */
export function useVoiceUserOverrides() {
  return useQuery<VoiceUserOverride[]>({
    queryKey: ["voice-user-overrides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voice_user_overrides")
        .select("*, profiles!voice_user_overrides_user_id_fkey(email, full_name)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as VoiceUserOverride[];
    },
  });
}
