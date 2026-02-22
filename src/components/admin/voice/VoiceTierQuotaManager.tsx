import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUpdateTierQuota } from "@/hooks/admin/useVoiceAdminMutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Crown, Save, Infinity as InfinityIcon } from "lucide-react";

interface MembershipTier {
  id: string;
  tier_key: string;
  tier_name: string;
  role_category: string;
  voice_quota_daily: number;
}

export function VoiceTierQuotaManager() {
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: tiers, isLoading } = useQuery<MembershipTier[]>({
    queryKey: ["membership-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_tiers")
        .select("id, tier_key, tier_name, role_category, voice_quota_daily")
        .order("role_category")
        .order("tier_level");
      if (error) throw error;
      return data as MembershipTier[];
    },
  });

  const updateQuota = useUpdateTierQuota();

  const handleEdit = (tier: MembershipTier) => {
    setEditingTier(tier.id);
    setEditValue(String(tier.voice_quota_daily));
  };

  const handleSave = (tierId: string) => {
    const value = parseInt(editValue, 10);
    if (isNaN(value) || value < -1) {
      toast.error("Enter a valid number (-1 for unlimited, 0+ for limit)");
      return;
    }
    updateQuota.mutate(
      { tierId, voiceQuotaDaily: value },
      {
        onSuccess: () => {
          toast.success("Quota updated");
          setEditingTier(null);
        },
        onError: (err) => toast.error(`Failed: ${err.message}`),
      }
    );
  };

  const isRavTier = (tierKey: string) =>
    tierKey.startsWith("rav_") || tierKey.includes("rav");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Tier Voice Quotas
        </CardTitle>
        <CardDescription>
          Daily voice search limits per membership tier. Use -1 for unlimited.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tier</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Daily Quota</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers?.map((tier) => (
              <TableRow key={tier.id}>
                <TableCell className="font-medium">{tier.tier_name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {tier.role_category}
                  </Badge>
                </TableCell>
                <TableCell>
                  {editingTier === tier.id ? (
                    <Input
                      type="number"
                      min={-1}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-24 h-8"
                      aria-label="Voice quota"
                    />
                  ) : tier.voice_quota_daily === -1 ? (
                    <span className="flex items-center gap-1 text-sm">
                      <InfinityIcon className="h-4 w-4" /> Unlimited
                    </span>
                  ) : (
                    <span className="text-sm">{tier.voice_quota_daily}/day</span>
                  )}
                </TableCell>
                <TableCell>
                  {isRavTier(tier.tier_key) ? (
                    <Badge variant="secondary">Always unlimited</Badge>
                  ) : editingTier === tier.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleSave(tier.id)}
                        disabled={updateQuota.isPending}
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingTier(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(tier)}
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
