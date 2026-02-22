import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useVoiceSearchLogs } from "@/hooks/admin/useVoiceAdminData";
import { useUpdateVoiceAlertSettings } from "@/hooks/admin/useVoiceAdminMutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Activity, Bell, ChevronDown, Eye } from "lucide-react";
import type { VoiceSearchLog } from "@/types/voice";

const STATUS_COLORS: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  success: "default",
  error: "destructive",
  no_results: "secondary",
  timeout: "outline",
};

export function VoiceObservability() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data: logs, isLoading: logsLoading } = useVoiceSearchLogs(
    statusFilter ? { status: statusFilter } : undefined
  );

  return (
    <div className="space-y-6">
      {/* Recent Search Logs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Recent Search Logs
              </CardTitle>
              <CardDescription>Individual voice/chat search events</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="no_results">No Results</SelectItem>
                <SelectItem value="timeout">Timeout</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !logs || logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No search logs yet.
            </p>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Settings */}
      <AlertSettingsCard />
    </div>
  );
}

function LogRow({ log }: { log: VoiceSearchLog }) {
  const params = log.search_params;
  const destination = (params?.destination as string) || "—";
  const userEmail = log.profiles?.email ?? log.user_id?.slice(0, 8) ?? "Anonymous";

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-muted/50 text-sm">
          <Badge variant={STATUS_COLORS[log.status] ?? "secondary"} className="w-20 justify-center">
            {log.status}
          </Badge>
          <span className="flex-1 truncate">{destination}</span>
          <span className="text-muted-foreground w-24 text-right">
            {log.results_count} results
          </span>
          <span className="text-muted-foreground w-20 text-right">
            {log.latency_ms ? `${log.latency_ms}ms` : "—"}
          </span>
          <span className="text-muted-foreground w-32 text-right hidden sm:block">
            {userEmail}
          </span>
          <span className="text-muted-foreground w-28 text-right hidden md:block">
            {new Date(log.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        <div className="bg-muted/30 rounded p-3 text-xs space-y-1">
          <p><strong>User:</strong> {userEmail}</p>
          <p><strong>Source:</strong> {log.source}</p>
          <p><strong>Params:</strong> {JSON.stringify(params, null, 2)}</p>
          {log.error_message && (
            <p className="text-destructive"><strong>Error:</strong> {log.error_message}</p>
          )}
          <p><strong>Time:</strong> {new Date(log.created_at).toISOString()}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function AlertSettingsCard() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["voice-alert-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "voice_alert_error_rate_threshold",
          "voice_alert_daily_volume_threshold",
        ]);
      if (error) throw error;
      const map: Record<string, Record<string, unknown>> = {};
      for (const row of data ?? []) {
        map[row.setting_key] = row.setting_value as Record<string, unknown>;
      }
      return map;
    },
  });

  const updateAlerts = useUpdateVoiceAlertSettings();

  const errorRate = settings?.voice_alert_error_rate_threshold ?? {
    threshold_pct: 10,
    window_hours: 1,
    enabled: false,
  };
  const volume = settings?.voice_alert_daily_volume_threshold ?? {
    min_expected: 5,
    max_expected: 500,
    enabled: false,
  };

  const [errorPct, setErrorPct] = useState(String(errorRate.threshold_pct));
  const [errorWindow, setErrorWindow] = useState(String(errorRate.window_hours));
  const [errorEnabled, setErrorEnabled] = useState(Boolean(errorRate.enabled));
  const [volMin, setVolMin] = useState(String(volume.min_expected));
  const [volMax, setVolMax] = useState(String(volume.max_expected));
  const [volEnabled, setVolEnabled] = useState(Boolean(volume.enabled));

  const saveErrorRate = () => {
    updateAlerts.mutate(
      {
        settingKey: "voice_alert_error_rate_threshold",
        settingValue: {
          threshold_pct: parseInt(errorPct) || 10,
          window_hours: parseInt(errorWindow) || 1,
          enabled: errorEnabled,
        },
      },
      {
        onSuccess: () => toast.success("Error rate alert updated"),
        onError: (err) => toast.error(`Failed: ${err.message}`),
      }
    );
  };

  const saveVolume = () => {
    updateAlerts.mutate(
      {
        settingKey: "voice_alert_daily_volume_threshold",
        settingValue: {
          min_expected: parseInt(volMin) || 5,
          max_expected: parseInt(volMax) || 500,
          enabled: volEnabled,
        },
      },
      {
        onSuccess: () => toast.success("Volume alert updated"),
        onError: (err) => toast.error(`Failed: ${err.message}`),
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alert Thresholds
        </CardTitle>
        <CardDescription>
          Configure alert thresholds for voice search monitoring. Alerts are logged to system_settings (webhook integration coming soon).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Rate Alert */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Error Rate Alert
            </h4>
            <Switch checked={errorEnabled} onCheckedChange={setErrorEnabled} />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Threshold (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={errorPct}
                onChange={(e) => setErrorPct(e.target.value)}
                className="w-24 h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Window (hours)</Label>
              <Input
                type="number"
                min={1}
                max={24}
                value={errorWindow}
                onChange={(e) => setErrorWindow(e.target.value)}
                className="w-24 h-8"
              />
            </div>
          </div>
          <Button size="sm" onClick={saveErrorRate} disabled={updateAlerts.isPending}>
            Save
          </Button>
        </div>

        {/* Volume Alert */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Daily Volume Alert
            </h4>
            <Switch checked={volEnabled} onCheckedChange={setVolEnabled} />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Min Expected</Label>
              <Input
                type="number"
                min={0}
                value={volMin}
                onChange={(e) => setVolMin(e.target.value)}
                className="w-24 h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max Expected</Label>
              <Input
                type="number"
                min={0}
                value={volMax}
                onChange={(e) => setVolMax(e.target.value)}
                className="w-24 h-8"
              />
            </div>
          </div>
          <Button size="sm" onClick={saveVolume} disabled={updateAlerts.isPending}>
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
