import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

interface VoiceQuota {
  remaining: number;
  isUnlimited: boolean;
  canSearch: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useVoiceQuota(): VoiceQuota {
  const { user, isRavTeam } = useAuth();
  const [remaining, setRemaining] = useState<number>(10);
  const [loading, setLoading] = useState(true);

  const fetchQuota = useCallback(async () => {
    if (!user) {
      setRemaining(0);
      setLoading(false);
      return;
    }

    try {
      if (isRavTeam()) {
        setRemaining(999);
        setLoading(false);
        return;
      }

      const { data, error } = await (supabase.rpc as any)(
        "get_voice_searches_remaining",
        { _user_id: user.id }
      );

      if (error) {
        console.error("Error fetching voice quota:", error);
        setRemaining(0);
      } else {
        setRemaining(data ?? 0);
      }
    } catch (error) {
      console.error("Voice quota fetch error:", error);
      setRemaining(0);
    } finally {
      setLoading(false);
    }
  }, [user, isRavTeam]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return {
    remaining,
    isUnlimited: remaining === 999,
    canSearch: remaining > 0,
    loading,
    refresh: fetchQuota,
  };
}
