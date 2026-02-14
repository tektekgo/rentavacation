import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

interface SystemSettings {
  requireUserApproval: boolean;
  autoApproveRoleUpgrades: boolean;
  loading: boolean;
  updateSetting: (key: string, value: Record<string, unknown>) => Promise<void>;
}

export function useSystemSettings(): SystemSettings {
  const { isRavTeam } = useAuth();
  const [requireUserApproval, setRequireUserApproval] = useState(true);
  const [autoApproveRoleUpgrades, setAutoApproveRoleUpgrades] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["require_user_approval", "auto_approve_role_upgrades"]);

      if (error) throw error;

      for (const row of data || []) {
        const val = row.setting_value as Record<string, unknown>;
        if (row.setting_key === "require_user_approval") {
          setRequireUserApproval(val.enabled as boolean);
        } else if (row.setting_key === "auto_approve_role_upgrades") {
          setAutoApproveRoleUpgrades(val.enabled as boolean);
        }
      }
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
    autoApproveRoleUpgrades,
    loading,
    updateSetting,
  };
}
