import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { useMyMembership } from "./useMembership";

interface OwnerCommission {
  effectiveRate: number;
  tierDiscount: number;
  tierName: string;
  loading: boolean;
}

export function useOwnerCommission(): OwnerCommission {
  const { user } = useAuth();
  const { data: membership } = useMyMembership();

  const { data: rate, isLoading } = useQuery<number>({
    queryKey: ["owner-commission-rate", user?.id],
    queryFn: async () => {
      if (!user) return 15;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("get_owner_commission_rate", {
        _owner_id: user.id,
      });

      if (error) {
        console.error("Error fetching commission rate:", error);
        return 15;
      }

      return data ?? 15;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return {
    effectiveRate: rate ?? 15,
    tierDiscount: membership?.tier?.commission_discount_pct ?? 0,
    tierName: membership?.tier?.tier_name ?? "Free",
    loading: isLoading,
  };
}
