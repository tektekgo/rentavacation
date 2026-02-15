import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useMembershipTiers } from "@/hooks/useMembership";
import { MembershipBadge } from "@/components/MembershipBadge";
import { toast } from "sonner";
import { Infinity as InfinityIcon } from "lucide-react";

export function SystemSettings() {
  const {
    requireUserApproval,
    autoApproveRoleUpgrades,
    voiceEnabled,
    voiceSearchEnabled,
    voiceListingEnabled,
    voiceBiddingEnabled,
    platformCommissionRate,
    loading,
    updateSetting,
  } = useSystemSettings();
  const { data: tiers } = useMembershipTiers();

  const [updating, setUpdating] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingVoice, setUpdatingVoice] = useState<string | null>(null);
  const [updatingCommission, setUpdatingCommission] = useState(false);

  const handleToggleApproval = async (enabled: boolean) => {
    setUpdating(true);
    try {
      await updateSetting("require_user_approval", { enabled });
      toast.success(
        enabled
          ? "User approval is now required for new signups"
          : "New users will be auto-approved"
      );
    } catch (error) {
      console.error("Failed to update setting:", error);
      toast.error("Failed to update setting");
    } finally {
      setUpdating(false);
    }
  };

  const handleVoiceToggle = async (key: string, enabled: boolean) => {
    setUpdatingVoice(key);
    try {
      await updateSetting(key, { enabled });
      toast.success(`Voice setting updated`);
    } catch (error) {
      console.error("Failed to update voice setting:", error);
      toast.error("Failed to update setting");
    } finally {
      setUpdatingVoice(null);
    }
  };

  const handleCommissionRateChange = async (newRate: number) => {
    if (newRate < 0 || newRate > 100) return;
    setUpdatingCommission(true);
    try {
      await updateSetting("platform_commission_rate", {
        rate: newRate,
        pro_discount: platformCommissionRate.proDiscount,
        business_discount: platformCommissionRate.businessDiscount,
      });
      toast.success(`Commission rate updated to ${newRate}%`);
    } catch (error) {
      console.error("Failed to update commission rate:", error);
      toast.error("Failed to update commission rate");
    } finally {
      setUpdatingCommission(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">
          Configure platform-wide settings
        </p>
      </div>

      {/* User Registration */}
      <Card>
        <CardHeader>
          <CardTitle>User Registration</CardTitle>
          <CardDescription>
            Control how new user signups are handled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="require-approval">
                Require admin approval for new users
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, new signups will need RAV team approval before
                accessing the platform. When disabled, users are auto-approved.
              </p>
            </div>
            <Switch
              id="require-approval"
              checked={requireUserApproval}
              onCheckedChange={handleToggleApproval}
              disabled={updating}
            />
          </div>
        </CardContent>
      </Card>

      {/* Role Upgrade Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Role Upgrade Requests</CardTitle>
          <CardDescription>
            Control how role upgrade requests are handled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-approve-roles">
                Auto-approve role upgrade requests
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, role upgrade requests (e.g., renter to property
                owner) are automatically approved without admin review.
              </p>
            </div>
            <Switch
              id="auto-approve-roles"
              checked={autoApproveRoleUpgrades}
              onCheckedChange={async (enabled) => {
                setUpdatingRole(true);
                try {
                  await updateSetting("auto_approve_role_upgrades", { enabled });
                  toast.success(
                    enabled
                      ? "Role upgrades will be auto-approved"
                      : "Role upgrades require admin approval"
                  );
                } catch (error) {
                  console.error("Failed to update setting:", error);
                  toast.error("Failed to update setting");
                } finally {
                  setUpdatingRole(false);
                }
              }}
              disabled={updatingRole}
            />
          </div>
        </CardContent>
      </Card>

      {/* Voice Features */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Features</CardTitle>
          <CardDescription>
            Control voice-powered features across the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Master switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="voice-master">Master voice toggle</Label>
              <p className="text-sm text-muted-foreground">
                Kill switch for all voice features. Disabling this turns off
                voice everywhere.
              </p>
            </div>
            <Switch
              id="voice-master"
              checked={voiceEnabled}
              onCheckedChange={(enabled) =>
                handleVoiceToggle("voice_enabled", enabled)
              }
              disabled={updatingVoice === "voice_enabled"}
            />
          </div>

          <div className="border-t pt-4 space-y-4 pl-4">
            {/* Voice Search */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="voice-search">Voice Search</Label>
                <p className="text-sm text-muted-foreground">
                  Voice search on the Rentals page
                </p>
              </div>
              <Switch
                id="voice-search"
                checked={voiceSearchEnabled}
                onCheckedChange={(enabled) =>
                  handleVoiceToggle("voice_search_enabled", enabled)
                }
                disabled={!voiceEnabled || updatingVoice === "voice_search_enabled"}
              />
            </div>

            {/* Voice Listing */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="voice-listing" className="flex items-center gap-2">
                  Voice-Assisted Listing
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Voice-assisted listing creation for property owners
                </p>
              </div>
              <Switch
                id="voice-listing"
                checked={voiceListingEnabled}
                onCheckedChange={(enabled) =>
                  handleVoiceToggle("voice_listing_enabled", enabled)
                }
                disabled={!voiceEnabled || updatingVoice === "voice_listing_enabled"}
              />
            </div>

            {/* Voice Bidding */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="voice-bidding" className="flex items-center gap-2">
                  Voice-Assisted Bidding
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Voice-assisted bidding on traveler requests
                </p>
              </div>
              <Switch
                id="voice-bidding"
                checked={voiceBiddingEnabled}
                onCheckedChange={(enabled) =>
                  handleVoiceToggle("voice_bidding_enabled", enabled)
                }
                disabled={!voiceEnabled || updatingVoice === "voice_bidding_enabled"}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Quotas by Tier */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Quotas by Tier</CardTitle>
          <CardDescription>
            Daily voice search limits based on membership tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tiers && tiers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Daily Quota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell>
                      <MembershipBadge tier={tier} />
                    </TableCell>
                    <TableCell className="capitalize">{tier.role_category}</TableCell>
                    <TableCell className="text-right">
                      {tier.voice_quota_daily === -1 ? (
                        <span className="flex items-center justify-end gap-1">
                          <InfinityIcon className="h-3.5 w-3.5" /> Unlimited
                        </span>
                      ) : (
                        `${tier.voice_quota_daily}/day`
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>
                    <Badge>RAV Team</Badge>
                  </TableCell>
                  <TableCell>Staff</TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <InfinityIcon className="h-3.5 w-3.5" /> Unlimited
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Membership tiers not configured yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Platform Commission */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Commission</CardTitle>
          <CardDescription>
            Commission rate charged to property owners on bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="commission-rate">Base rate (%)</Label>
            <Input
              id="commission-rate"
              type="number"
              className="w-24"
              value={platformCommissionRate.rate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) handleCommissionRateChange(val);
              }}
              disabled={updatingCommission}
              min={0}
              max={100}
            />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Pro tier discount</span>
              <span>{platformCommissionRate.proDiscount}%</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Business tier discount</span>
              <span>{platformCommissionRate.businessDiscount}%</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Effective rates</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Free owners</span>
                <span className="font-medium">{platformCommissionRate.rate}%</span>
              </div>
              <div className="flex justify-between">
                <span>Pro owners</span>
                <span className="font-medium">
                  {platformCommissionRate.rate - platformCommissionRate.proDiscount}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Business owners</span>
                <span className="font-medium">
                  {platformCommissionRate.rate - platformCommissionRate.businessDiscount}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
