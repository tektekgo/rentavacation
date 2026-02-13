import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

interface SystemSettings {
  requireUserApproval: boolean;
  loading: boolean;
  updateSetting: (key: string, value: Record<string, unknown>) => Promise<void>;
}

export function useSystemSettings(): SystemSettings {
  const { isRavTeam } = useAuth();
  const [requireUserApproval, setRequireUserApproval] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "require_user_approval")
        .single();

      if (error) throw error;

      setRequireUserApproval(
        (data.setting_value as Record<string, unknown>).enabled as boolean
      );
    } catch (error) {
      console.error("Error fetching system settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isRavTeam()) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [isRavTeam, fetchSettings]);

  const updateSetting = async (
    key: string,
    value: Record<string, unknown>
  ) => {
    if (!isRavTeam()) {
      throw new Error("Only RAV team can update system settings");
    }

    const { error } = await supabase
      .from("system_settings")
      .update({
        setting_value: value,
        updated_at: new Date().toISOString(),
      })
      .eq("setting_key", key);

    if (error) throw error;

    await fetchSettings();
  };

  return {
    requireUserApproval,
    loading,
    updateSetting,
  };
}
