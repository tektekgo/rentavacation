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
import { Skeleton } from "@/components/ui/skeleton";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { toast } from "sonner";

export function SystemSettings() {
  const { requireUserApproval, loading, updateSetting } = useSystemSettings();
  const [updating, setUpdating] = useState(false);

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

      <Card>
        <CardHeader>
          <CardTitle>Voice Search Limits</CardTitle>
          <CardDescription>
            Daily voice search quota for regular users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Daily limit: 10 searches per user
            </p>
            <p className="text-sm text-muted-foreground">
              RAV team members have unlimited searches. Regular users are limited
              to 10 voice searches per day, resetting at midnight UTC.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
