import { useMemo } from "react";
import { useVoiceUsageStats, useVoiceTopUsers } from "@/hooks/admin/useVoiceAdminData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, Users, CheckCircle2, Clock, Search } from "lucide-react";

export function VoiceUsageDashboard() {
  const { data: stats, isLoading: statsLoading } = useVoiceUsageStats(30);
  const { data: topUsers, isLoading: usersLoading } = useVoiceTopUsers(30, 10);

  const summary = useMemo(() => {
    if (!stats || stats.length === 0) {
      return { totalSearches: 0, uniqueUsers: 0, successRate: 0, avgLatency: 0 };
    }
    const totalSearches = stats.reduce((sum, d) => sum + d.total_searches, 0);
    const totalSuccess = stats.reduce((sum, d) => sum + d.success_count, 0);
    const uniqueUsers = new Set(stats.map((d) => d.search_date)).size;
    const totalUniqueUsers = stats.reduce((sum, d) => sum + d.unique_users, 0);
    const latencies = stats.filter((d) => d.avg_latency_ms !== null);
    const avgLatency =
      latencies.length > 0
        ? Math.round(
            latencies.reduce((sum, d) => sum + (d.avg_latency_ms ?? 0), 0) /
              latencies.length
          )
        : 0;

    return {
      totalSearches,
      uniqueUsers: Math.round(totalUniqueUsers / (uniqueUsers || 1)),
      successRate: totalSearches > 0 ? Math.round((totalSuccess / totalSearches) * 100) : 0,
      avgLatency,
    };
  }, [stats]);

  const chartData = useMemo(() => {
    if (!stats) return [];
    return [...stats]
      .reverse()
      .map((d) => ({
        date: new Date(d.search_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        Success: d.success_count,
        Errors: d.error_count,
        "No Results": d.no_results_count,
      }));
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Search className="h-5 w-5" />}
          label="Total Searches (30d)"
          value={statsLoading ? "..." : summary.totalSearches.toLocaleString()}
        />
        <SummaryCard
          icon={<Users className="h-5 w-5" />}
          label="Avg Unique Users/Day"
          value={statsLoading ? "..." : summary.uniqueUsers.toLocaleString()}
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Success Rate"
          value={statsLoading ? "..." : `${summary.successRate}%`}
        />
        <SummaryCard
          icon={<Clock className="h-5 w-5" />}
          label="Avg Latency"
          value={statsLoading ? "..." : `${summary.avgLatency}ms`}
        />
      </div>

      {/* Daily Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Daily Search Volume
          </CardTitle>
          <CardDescription>Searches per day over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No search data yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Success"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Errors"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="No Results"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Users (30d)</CardTitle>
          <CardDescription>Most active voice search users</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !topUsers || topUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No user data yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Searches</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="text-sm">
                      {u.email ?? u.user_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{u.total_searches}</TableCell>
                    <TableCell>
                      <Badge
                        variant={u.success_rate >= 80 ? "default" : u.success_rate >= 50 ? "secondary" : "destructive"}
                      >
                        {u.success_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.last_search_at).toLocaleDateString()}
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

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">{icon}</div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
