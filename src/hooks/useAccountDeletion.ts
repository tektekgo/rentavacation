import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface DeletionResponse {
  success: boolean;
  action: string;
  scheduled_for?: string;
  grace_period_days?: number;
  error?: string;
}

export function useRequestDeletion() {
  return useMutation({
    mutationFn: async (reason?: string) => {
      const { data, error } = await supabase.functions.invoke("delete-user-account", {
        body: { action: "request", reason },
      });
      if (error) throw new Error(error.message);
      const result = data as DeletionResponse;
      if (!result.success) throw new Error(result.error || "Failed to request deletion");
      return result;
    },
  });
}

export function useCancelDeletion() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("delete-user-account", {
        body: { action: "cancel" },
      });
      if (error) throw new Error(error.message);
      const result = data as DeletionResponse;
      if (!result.success) throw new Error(result.error || "Failed to cancel deletion");
      return result;
    },
  });
}

export function useExportUserData() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("export-user-data");
      if (error) throw new Error(error.message);

      // Trigger browser download
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rav-data-export-${user?.id?.slice(0, 8) || "user"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return data;
    },
  });
}
