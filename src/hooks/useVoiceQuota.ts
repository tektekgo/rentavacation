import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

interface VoiceQuota {
  remaining: number;
  dailyLimit: number;
  isUnlimited: boolean;
  canSearch: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useVoiceQuota(): VoiceQuota {
  const { user, isRavTeam } = useAuth();
  const [remaining, setRemaining] = useState<number>(5);
  const [dailyLimit, setDailyLimit] = useState<number>(5);
  const [loading, setLoading] = useState(true);

  const fetchQuota = useCallback(async () => {
    if (!user) {
      setRemaining(0);
      setDailyLimit(5);
      setLoading(false);
      return;
    }

    try {
      if (isRavTeam()) {
        setRemaining(999);
        setDailyLimit(-1);
        setLoading(false);
        return;
      }

      // Fetch remaining and daily limit in parallel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rpc = supabase.rpc as any;
      const [remainingResult, quotaResult] = await Promise.all([
        rpc("get_voice_searches_remaining", { _user_id: user.id }),
        rpc("get_user_voice_quota", { _user_id: user.id }),
      ]);

      if (remainingResult.error) {
        console.error("Error fetching voice remaining:", remainingResult.error);
        setRemaining(0);
      } else {
        setRemaining(remainingResult.data ?? 0);
      }

      if (quotaResult.error) {
        console.error("Error fetching voice quota:", quotaResult.error);
        setDailyLimit(5);
      } else {
        setDailyLimit(quotaResult.data ?? 5);
      }
    } catch (error) {
      console.error("Voice quota fetch error:", error);
      setRemaining(0);
      setDailyLimit(5);
    } finally {
      setLoading(false);
    }
  }, [user, isRavTeam]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return {
    remaining,
    dailyLimit,
    isUnlimited: dailyLimit === -1,
    canSearch: dailyLimit === -1 || remaining > 0,
    loading,
    refresh: fetchQuota,
  };
}
