import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PendingUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  approval_status: string;
}

export function PendingApprovals() {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    userId: string | null;
  }>({ open: false, userId: null });
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchPendingUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at, approval_status")
      .eq("approval_status", "pending_approval")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching pending users:", error);
      toast.error("Failed to load pending users");
    } else {
      setPendingUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error: approveError } = await supabase.rpc("approve_user" as never, {
        _user_id: userId,
        _approved_by: user?.id,
      } as never);

      if (approveError) throw approveError;

      // Send approval email (non-blocking)
      const { error: emailError } = await supabase.functions.invoke(
        "send-approval-email",
        { body: { user_id: userId, action: "approved" } }
      );

      if (emailError) {
        console.error("Email send error:", emailError);
        toast.warning("User approved, but email notification failed");
      } else {
        toast.success("User approved successfully");
      }

      fetchPendingUsers();
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.userId) return;

    setActionLoading(rejectDialog.userId);
    try {
      const { error: rejectError } = await supabase.rpc("reject_user" as never, {
        _user_id: rejectDialog.userId,
        _rejected_by: user?.id,
        _reason: rejectionReason || null,
      } as never);

      if (rejectError) throw rejectError;

      // Send rejection email (non-blocking)
      const { error: emailError } = await supabase.functions.invoke(
        "send-approval-email",
        {
          body: {
            user_id: rejectDialog.userId,
            action: "rejected",
            rejection_reason: rejectionReason,
          },
        }
      );

      if (emailError) {
        console.error("Email send error:", emailError);
        toast.warning("User rejected, but email notification failed");
      } else {
        toast.success("User rejected");
      }

      setRejectDialog({ open: false, userId: null });
      setRejectionReason("");
      fetchPendingUsers();
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error("Failed to reject user");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">All caught up!</h3>
          <p className="text-sm text-muted-foreground">
            No pending user approvals at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Pending User Approvals</CardTitle>
        <CardDescription>
          Review and approve new user signups ({pendingUsers.length} pending)
        </CardDescription>
      </CardHeader>

      <div className="space-y-3">
        {pendingUsers.map((pendingUser) => (
          <Card key={pendingUser.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {pendingUser.full_name?.[0]?.toUpperCase() ||
                      pendingUser.email[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {pendingUser.full_name || "No name provided"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {pendingUser.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(pendingUser.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApprove(pendingUser.id)}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === pendingUser.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    setRejectDialog({ open: true, userId: pendingUser.id })
                  }
                  disabled={actionLoading !== null}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog({ open: false, userId: null });
            setRejectionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this user? They will be notified
              via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Reason (optional)</Label>
            <Textarea
              id="rejection-reason"
              placeholder="e.g., Suspicious activity, incomplete information, etc."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, userId: null });
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading !== null}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
