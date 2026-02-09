import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Clock, MessageSquare, Phone, RefreshCw, User, Building2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { CheckinConfirmation, Database } from "@/types/database";

type CheckinConfirmationUpdate = Database['public']['Tables']['checkin_confirmations']['Update'];

interface CheckinIssueWithDetails extends CheckinConfirmation {
  booking: {
    id: string;
    total_amount: number;
    listing: {
      check_in_date: string;
      check_out_date: string;
      property: {
        resort_name: string;
        location: string;
      };
    };
    renter: {
      full_name: string;
      email: string;
      phone: string | null;
    };
  };
  traveler: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

const issueTypeLabels: Record<string, { label: string; color: string }> = {
  no_access: { label: "No Access", color: "destructive" },
  wrong_unit: { label: "Wrong Unit", color: "destructive" },
  cleanliness: { label: "Cleanliness Issues", color: "secondary" },
  amenities_missing: { label: "Missing Amenities", color: "secondary" },
  safety_concern: { label: "Safety Concern", color: "destructive" },
  other: { label: "Other", color: "secondary" },
};

const resolutionOptions = [
  { value: "resolved_with_owner", label: "Resolved with Owner" },
  { value: "partial_refund", label: "Partial Refund Issued" },
  { value: "full_refund", label: "Full Refund Issued" },
  { value: "relocated", label: "Guest Relocated" },
  { value: "no_action_needed", label: "No Action Needed" },
  { value: "fraudulent_claim", label: "Fraudulent Claim" },
];

const AdminCheckinIssues = () => {
  const [issues, setIssues] = useState<CheckinIssueWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<CheckinIssueWithDetails | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionType, setResolutionType] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("pending");

  const fetchIssues = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("checkin_confirmations")
        .select(`
          *,
          booking:bookings(
            id,
            total_amount,
            listing:listings(
              check_in_date,
              check_out_date,
              property:properties(
                resort_name,
                location
              )
            ),
            renter:profiles!bookings_renter_id_fkey(
              full_name,
              email,
              phone
            )
          ),
          traveler:profiles!checkin_confirmations_traveler_id_fkey(
            full_name,
            email,
            phone
          )
        `)
        .eq("issue_reported", true)
        .order("created_at", { ascending: false });

      if (filter === "pending") {
        query = query.eq("resolved", false);
      } else if (filter === "resolved") {
        query = query.eq("resolved", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setIssues((data || []) as CheckinIssueWithDetails[]);
    } catch (error) {
      console.error("Error fetching check-in issues:", error);
      toast.error("Failed to load check-in issues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [filter]);

  const handleResolve = async () => {
    if (!selectedIssue || !resolutionType) return;

    setResolving(true);
    try {
      // Using type assertion as the generated types may be out of sync
      const { error } = await (supabase
        .from("checkin_confirmations") as ReturnType<typeof supabase.from>)
        .update({
          resolved: true,
          resolution_notes: `${resolutionType}: ${resolutionNotes}`,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", selectedIssue.id);

      if (error) throw error;

      toast.success("Issue resolved successfully");
      setResolveDialogOpen(false);
      setSelectedIssue(null);
      setResolutionType("");
      setResolutionNotes("");
      fetchIssues();
    } catch (error) {
      console.error("Error resolving issue:", error);
      toast.error("Failed to resolve issue");
    } finally {
      setResolving(false);
    }
  };

  const getIssueTypeBadge = (issueType: string | null) => {
    if (!issueType) return null;
    const config = issueTypeLabels[issueType] || issueTypeLabels.other;
    return (
      <Badge variant={config.color as "destructive" | "secondary" | "default"}>
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: issues.length,
    pending: issues.filter(i => !i.resolved).length,
    resolved: issues.filter(i => i.resolved).length,
    critical: issues.filter(i => ["no_access", "safety_concern", "wrong_unit"].includes(i.issue_type || "")).length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-secondary-foreground" />
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.resolved}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold">{stats.critical}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Check-in Issues</CardTitle>
              <CardDescription>
                Review and resolve traveler-reported issues
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Issues</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchIssues}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No check-in issues found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Traveler</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{issue.booking?.listing?.property?.resort_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {issue.booking?.listing?.property?.location}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{issue.traveler?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{issue.traveler?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getIssueTypeBadge(issue.issue_type)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {format(new Date(issue.issue_reported_at || issue.created_at), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(issue.issue_reported_at || issue.created_at), "h:mm a")}
                      </p>
                    </TableCell>
                    <TableCell>
                      {issue.resolved ? (
                        <Badge variant="outline" className="bg-accent text-accent-foreground border-primary/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-secondary text-secondary-foreground border-secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedIssue(issue)}
                        >
                          View Details
                        </Button>
                        {!issue.resolved && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedIssue(issue);
                              setResolveDialogOpen(true);
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Issue Details Dialog */}
      <Dialog open={!!selectedIssue && !resolveDialogOpen} onOpenChange={(open) => !open && setSelectedIssue(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Issue Details</DialogTitle>
            <DialogDescription>
              Review the reported check-in issue
            </DialogDescription>
          </DialogHeader>

          {selectedIssue && (
            <div className="space-y-6">
              {/* Property & Booking Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Property</Label>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">
                      {selectedIssue.booking?.listing?.property?.resort_name}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedIssue.booking?.listing?.property?.location}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Booking Value</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">
                      ${selectedIssue.booking?.total_amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Traveler Info */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Traveler</Label>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{selectedIssue.traveler?.full_name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>{selectedIssue.traveler?.email}</span>
                      {selectedIssue.traveler?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedIssue.traveler?.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Issue Details */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Issue Type</Label>
                <div>{getIssueTypeBadge(selectedIssue.issue_type)}</div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Issue Description</Label>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm">{selectedIssue.issue_description || "No description provided"}</p>
                </div>
              </div>

              {/* Resolution Info (if resolved) */}
              {selectedIssue.resolved && selectedIssue.resolution_notes && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Resolution</Label>
                  <div className="bg-accent/50 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm text-accent-foreground">{selectedIssue.resolution_notes}</p>
                    {selectedIssue.resolved_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Resolved on {format(new Date(selectedIssue.resolved_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedIssue(null)}>
              Close
            </Button>
            {selectedIssue && !selectedIssue.resolved && (
              <Button onClick={() => setResolveDialogOpen(true)}>
                Resolve Issue
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Issue</DialogTitle>
            <DialogDescription>
              Select a resolution type and add notes about how the issue was handled
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resolution Type</Label>
              <Select value={resolutionType} onValueChange={setResolutionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution type" />
                </SelectTrigger>
                <SelectContent>
                  {resolutionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Resolution Notes</Label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how the issue was resolved..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={!resolutionType || resolving}>
              {resolving ? "Resolving..." : "Confirm Resolution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCheckinIssues;
