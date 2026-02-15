import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Crown, Users } from "lucide-react";
import { MembershipBadge } from "@/components/MembershipBadge";
import { useMembershipTiers } from "@/hooks/useMembership";
import type { MembershipTier } from "@/types/database";
import { format } from "date-fns";

interface MembershipRow {
  id: string;
  user_id: string;
  status: string;
  started_at: string;
  tier: MembershipTier;
  user_email?: string;
}

export function AdminMemberships() {
  const { data: tiers } = useMembershipTiers();
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        const { data, error } = await supabase
          .from("user_memberships")
          .select("id, user_id, status, started_at, tier:membership_tiers(*)")
          .order("started_at", { ascending: false });

        if (error) throw error;

        // Fetch user emails
        const rows = (data || []) as Array<{ user_id: string; id: string; status: string; started_at: string; tier: MembershipTier }>;
        const userIds = rows.map((m) => m.user_id);
        let emailMap: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, email")
            .in("id", userIds);
          const profileRows = (profiles || []) as Array<{ id: string; email: string }>;
          emailMap = profileRows.reduce((acc: Record<string, string>, p) => {
            acc[p.id] = p.email;
            return acc;
          }, {});
        }

        setMemberships(
          rows.map((m) => ({
            ...m,
            user_email: emailMap[m.user_id] || "Unknown",
          }))
        );
      } catch (error) {
        console.error("Error fetching memberships:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemberships();
  }, []);

  // Calculate tier distribution
  const tierCounts = (tiers || []).map((tier) => ({
    tier,
    count: memberships.filter((m) => m.tier?.id === tier.id).length,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Memberships</h2>
        <p className="text-muted-foreground">
          Overview of user membership tiers and distribution
        </p>
      </div>

      {/* Tier distribution summary */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {tierCounts.map(({ tier, count }) => (
          <Card key={tier.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MembershipBadge tier={tier} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{count}</span>
              </div>
              <p className="text-xs text-muted-foreground capitalize">
                {tier.role_category}s
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Memberships table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            All User Memberships
          </CardTitle>
          <CardDescription>
            {memberships.length} total memberships
          </CardDescription>
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <div className="text-center py-8">
              <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No memberships found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {m.user_email}
                    </TableCell>
                    <TableCell>
                      {m.tier && <MembershipBadge tier={m.tier} />}
                    </TableCell>
                    <TableCell className="capitalize">
                      {m.tier?.role_category}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={m.status === "active" ? "default" : "secondary"}
                      >
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(m.started_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
