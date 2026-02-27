import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, MapPin, Search, Check, X, DollarSign } from "lucide-react";
import { format } from "date-fns";
import type { Listing, Property, Profile, ListingStatus } from "@/types/database";
import { AdminEntityLink, type AdminNavigationProps } from "./AdminEntityLink";

const REJECTION_TEMPLATES = [
  "Incomplete property details",
  "Photos do not meet quality standards",
  "Pricing appears unrealistic",
  "Duplicate listing",
];

interface ListingWithDetails extends Listing {
  property: Property;
  owner: Profile;
}

const STATUS_COLORS: Record<ListingStatus, string> = {
  draft: "bg-gray-500",
  pending_approval: "bg-orange-500",
  active: "bg-green-500",
  booked: "bg-blue-500",
  completed: "bg-purple-500",
  cancelled: "bg-red-500",
};

const STATUS_LABELS: Record<ListingStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  active: "Active",
  booked: "Booked",
  completed: "Completed",
  cancelled: "Cancelled",
};

const AdminListings = ({ initialSearch = "", onNavigateToEntity }: AdminNavigationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<ListingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingListingId, setRejectingListingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (initialSearch) setSearchQuery(initialSearch);
  }, [initialSearch]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          property:properties(*),
          owner:profiles!listings_owner_id_fkey(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings(data as ListingWithDetails[] || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const sendApprovalEmail = async (ownerId: string, action: "approved" | "rejected") => {
    try {
      await supabase.functions.invoke("send-approval-email", {
        body: {
          user_id: ownerId,
          action,
          email_type: "user_approval",
        },
      });
    } catch (err) {
      console.error("Failed to send listing approval email:", err);
    }
  };

  const handleApprove = async (listingId: string) => {
    try {
      const listing = listings.find((l) => l.id === listingId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("listings")
        .update({
          status: "active",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", listingId);

      if (error) throw error;

      // Send approval email to listing owner (non-blocking)
      if (listing?.owner?.id) {
        sendApprovalEmail(listing.owner.id, "approved");
      }

      // Trigger travel request matching (fire-and-forget)
      supabase.functions.invoke("match-travel-requests", {
        body: { listing_id: listingId },
      }).catch((err) => console.error("Match trigger failed:", err));

      toast({
        title: "Listing Approved",
        description: "The listing is now active and visible to renters.",
      });

      fetchListings();
    } catch (error) {
      console.error("Error approving listing:", error);
      toast({
        title: "Error",
        description: "Failed to approve listing.",
        variant: "destructive",
      });
    }
  };

  const openRejectDialog = (listingId: string) => {
    setRejectingListingId(listingId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingListingId || !rejectionReason.trim()) return;

    try {
      const listing = listings.find((l) => l.id === rejectingListingId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("listings")
        .update({
          status: "cancelled",
          rejection_reason: rejectionReason.trim(),
        })
        .eq("id", rejectingListingId);

      if (error) throw error;

      // Send rejection email to listing owner (non-blocking)
      if (listing?.owner?.id) {
        sendApprovalEmail(listing.owner.id, "rejected");
      }

      toast({
        title: "Listing Rejected",
        description: "The listing has been rejected with a reason.",
      });

      setRejectDialogOpen(false);
      setRejectingListingId(null);
      fetchListings();
    } catch (error) {
      console.error("Error rejecting listing:", error);
      toast({
        title: "Error",
        description: "Failed to reject listing.",
        variant: "destructive",
      });
    }
  };

  const filteredListings = listings.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      l.property?.resort_name?.toLowerCase().includes(q) ||
      l.property?.location?.toLowerCase().includes(q) ||
      l.owner?.full_name?.toLowerCase().includes(q) ||
      l.owner?.email?.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = listings.filter((l) => l.status === "pending_approval").length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">All Listings</h2>
          <p className="text-muted-foreground">
            {listings.length} listings • {pendingCount} pending approval
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, location, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No listings found</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || statusFilter !== "all" ? "Try different filters" : "No listings have been created yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{listing.property?.resort_name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {listing.property?.location}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminEntityLink tab="users" search={listing.owner?.email || ""} onNavigate={onNavigateToEntity}>
                        <p className="text-sm font-medium">{listing.owner?.full_name || "Unknown"}</p>
                      </AdminEntityLink>
                      <p className="text-xs text-muted-foreground">{listing.owner?.email}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {format(new Date(listing.check_in_date), "MMM d")} -{" "}
                        {format(new Date(listing.check_out_date), "MMM d, yyyy")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-medium">${listing.final_price.toLocaleString()}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Owner: ${listing.owner_price.toLocaleString()} • Markup: ${listing.rav_markup.toLocaleString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[listing.status]}>
                        {STATUS_LABELS[listing.status]}
                      </Badge>
                      {listing.status === "cancelled" && listing.rejection_reason && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate" title={listing.rejection_reason}>
                          {listing.rejection_reason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {listing.status === "pending_approval" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleApprove(listing.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => openRejectDialog(listing.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Listing</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this listing. The owner will see this.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-wrap gap-2">
              {REJECTION_TEMPLATES.map((template) => (
                <Button
                  key={template}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setRejectionReason(
                    rejectionReason ? `${rejectionReason}\n${template}` : template
                  )}
                >
                  {template}
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Reject Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminListings;
