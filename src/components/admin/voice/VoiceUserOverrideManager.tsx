import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceUserOverrides } from "@/hooks/admin/useVoiceAdminData";
import {
  useUpsertVoiceOverride,
  useDeleteVoiceOverride,
} from "@/hooks/admin/useVoiceAdminMutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserX, Plus, Trash2, Search } from "lucide-react";

export function VoiceUserOverrideManager() {
  const { user } = useAuth();
  const { data: overrides, isLoading } = useVoiceUserOverrides();
  const upsertOverride = useUpsertVoiceOverride();
  const deleteOverride = useDeleteVoiceOverride();

  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<{
    id: string;
    email: string;
    full_name: string | null;
  } | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);

  // New override form
  const [voiceDisabled, setVoiceDisabled] = useState(false);
  const [customQuota, setCustomQuota] = useState("");
  const [reason, setReason] = useState("");

  // Confirm dialog
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchError("");
    setSearchResult(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .ilike("email", `%${searchEmail.trim()}%`)
      .limit(1)
      .maybeSingle();

    setSearching(false);
    if (error) {
      setSearchError("Search failed");
    } else if (!data) {
      setSearchError("No user found with that email");
    } else {
      setSearchResult(data);
    }
  };

  const handleAddOverride = () => {
    if (!searchResult || !user) return;

    const quotaValue = customQuota.trim()
      ? parseInt(customQuota, 10)
      : null;

    upsertOverride.mutate(
      {
        userId: searchResult.id,
        voiceDisabled,
        customQuotaDaily: quotaValue,
        reason: reason.trim() || null,
        createdBy: user.id,
      },
      {
        onSuccess: () => {
          toast.success(`Override added for ${searchResult.email}`);
          setSearchResult(null);
          setSearchEmail("");
          setVoiceDisabled(false);
          setCustomQuota("");
          setReason("");
        },
        onError: (err) => toast.error(`Failed: ${err.message}`),
      }
    );
  };

  const handleDelete = (userId: string) => {
    deleteOverride.mutate(userId, {
      onSuccess: () => {
        toast.success("Override removed — user reverted to tier defaults");
        setConfirmDelete(null);
      },
      onError: (err) => toast.error(`Failed: ${err.message}`),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserX className="h-5 w-5" />
          Per-User Voice Overrides
        </CardTitle>
        <CardDescription>
          Disable voice access or set custom quotas for specific users. Overrides take priority over tier defaults.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Override Form */}
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Override
          </h4>
          <div className="flex gap-2">
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching} variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {searchError && <p className="text-sm text-destructive">{searchError}</p>}
          {searchResult && (
            <div className="border rounded p-3 space-y-3">
              <p className="text-sm">
                <strong>{searchResult.email}</strong>
                {searchResult.full_name && ` (${searchResult.full_name})`}
              </p>
              <div className="flex items-center gap-3">
                <Label htmlFor="voice-disabled" className="text-sm">Disable voice</Label>
                <Switch
                  id="voice-disabled"
                  checked={voiceDisabled}
                  onCheckedChange={setVoiceDisabled}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="custom-quota" className="text-sm">
                  Custom daily quota (leave empty for tier default)
                </Label>
                <Input
                  id="custom-quota"
                  type="number"
                  min={-1}
                  placeholder="-1 = unlimited"
                  value={customQuota}
                  onChange={(e) => setCustomQuota(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="override-reason" className="text-sm">Reason</Label>
                <Input
                  id="override-reason"
                  placeholder="Admin note..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAddOverride}
                disabled={upsertOverride.isPending}
              >
                {voiceDisabled ? "Disable Voice for User" : "Save Override"}
              </Button>
            </div>
          )}
        </div>

        {/* Current Overrides Table */}
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : overrides && overrides.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Custom Quota</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides.map((override) => (
                <TableRow key={override.id}>
                  <TableCell className="text-sm">
                    {override.profiles?.email ?? override.user_id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    {override.voice_disabled ? (
                      <Badge variant="destructive">Disabled</Badge>
                    ) : (
                      <Badge variant="secondary">Custom quota</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {override.custom_quota_daily === null
                      ? "Tier default"
                      : override.custom_quota_daily === -1
                        ? "Unlimited"
                        : `${override.custom_quota_daily}/day`}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {override.reason ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDelete(override.user_id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No per-user overrides configured. All users use their tier defaults.
          </p>
        )}
      </CardContent>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Override?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revert the user to their membership tier&apos;s default voice quota. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              Remove Override
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
