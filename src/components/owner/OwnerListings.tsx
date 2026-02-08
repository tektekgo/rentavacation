import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Calendar, MapPin, Edit, Trash2, XCircle } from "lucide-react";
import { format } from "date-fns";
import type { Property, Listing, ListingStatus, Database } from "@/types/database";

type ListingInsert = Database['public']['Tables']['listings']['Insert'];
type ListingUpdate = Database['public']['Tables']['listings']['Update'];

type ListingWithProperty = Listing & { property: Property };

const STATUS_COLORS: Record<ListingStatus, string> = {
  draft: "bg-gray-500",
  pending_approval: "bg-yellow-500",
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

interface ListingFormData {
  property_id: string;
  check_in_date: string;
  check_out_date: string;
  owner_price: number;
  notes: string;
}

const initialFormData: ListingFormData = {
  property_id: "",
  check_in_date: "",
  check_out_date: "",
  owner_price: 0,
  notes: "",
};

const OwnerListings = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingWithProperty[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingListing, setEditingListing] = useState<ListingWithProperty | null>(null);
  const [formData, setFormData] = useState<ListingFormData>(initialFormData);

  // Fetch listings and properties
  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", user.id)
        .order("resort_name");

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

      // Fetch listings with property details
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select(`
          *,
          property:properties(*)
        `)
        .eq("owner_id", user.id)
        .order("check_in_date", { ascending: true });

      if (listingsError) throw listingsError;
      setListings(listingsData as ListingWithProperty[] || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load listings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.property_id) {
      toast.error("Please select a property");
      return;
    }

    if (new Date(formData.check_out_date) <= new Date(formData.check_in_date)) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    setIsSaving(true);
    try {
      if (editingListing) {
        // Update existing (only allow editing draft/pending listings)
        if (!["draft", "pending_approval"].includes(editingListing.status)) {
          toast.error("Cannot edit a listing that is already active or booked");
          setIsSaving(false);
          return;
        }

        const updateData: ListingUpdate = {
          property_id: formData.property_id,
          check_in_date: formData.check_in_date,
          check_out_date: formData.check_out_date,
          owner_price: formData.owner_price,
          rav_markup: 0,
          final_price: formData.owner_price,
          notes: formData.notes || null,
          status: "pending_approval",
        };

        const { error } = await (supabase
          .from("listings") as any)
          .update(updateData)
          .eq("id", editingListing.id);

        if (error) throw error;
        toast.success("Listing updated and submitted for approval");
      } else {
        // Create new
        const insertData: ListingInsert = {
          property_id: formData.property_id,
          owner_id: user.id,
          check_in_date: formData.check_in_date,
          check_out_date: formData.check_out_date,
          owner_price: formData.owner_price,
          rav_markup: 0,
          final_price: formData.owner_price,
          notes: formData.notes || null,
          status: "pending_approval",
        };

        const { error } = await (supabase
          .from("listings") as any)
          .insert(insertData);

        if (error) throw error;
        toast.success("Listing created and submitted for approval");
      }

      setIsDialogOpen(false);
      setEditingListing(null);
      setFormData(initialFormData);
      fetchData();
    } catch (error: any) {
      console.error("Error saving listing:", error);
      toast.error(error.message || "Failed to save listing");
    } finally {
      setIsSaving(false);
    }
  };

  // Open edit dialog
  const handleEdit = (listing: ListingWithProperty) => {
    if (!["draft", "pending_approval"].includes(listing.status)) {
      toast.error("Cannot edit a listing that is already active or booked");
      return;
    }

    setEditingListing(listing);
    setFormData({
      property_id: listing.property_id,
      check_in_date: listing.check_in_date,
      check_out_date: listing.check_out_date,
      owner_price: listing.owner_price,
      notes: listing.notes || "",
    });
    setIsDialogOpen(true);
  };

  // Handle cancel listing
  const handleCancel = async (listingId: string) => {
    try {
      const { error } = await (supabase
        .from("listings") as any)
        .update({ status: "cancelled" })
        .eq("id", listingId);

      if (error) throw error;
      toast.success("Listing cancelled");
      fetchData();
    } catch (error: any) {
      console.error("Error cancelling listing:", error);
      toast.error(error.message || "Failed to cancel listing");
    }
  };

  // Handle delete listing
  const handleDelete = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId);

      if (error) throw error;
      toast.success("Listing deleted");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting listing:", error);
      toast.error(error.message || "Failed to delete listing");
    }
  };

  // Reset form on dialog close
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingListing(null);
      setFormData(initialFormData);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Your Listings</h2>
          <p className="text-muted-foreground">
            Create and manage your rental listings
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button disabled={properties.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Create Listing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingListing ? "Edit Listing" : "Create New Listing"}
              </DialogTitle>
              <DialogDescription>
                {editingListing
                  ? "Update your listing details"
                  : "Select a property and enter availability dates"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="property">Property</Label>
                <Select
                  value={formData.property_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, property_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.resort_name} - {property.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="check_in_date">Check-in Date</Label>
                  <Input
                    id="check_in_date"
                    type="date"
                    value={formData.check_in_date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, check_in_date: e.target.value }))
                    }
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="check_out_date">Check-out Date</Label>
                  <Input
                    id="check_out_date"
                    type="date"
                    value={formData.check_out_date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, check_out_date: e.target.value }))
                    }
                    min={formData.check_in_date || new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_price">Your Asking Price ($)</Label>
                <Input
                  id="owner_price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.owner_price || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, owner_price: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="Enter your desired price"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is the amount you'll receive. RAV will add a markup for the final renter price.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Any special notes about this listing..."
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingListing ? "Update" : "Submit for Approval"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {properties.length === 0 && (
        <Card className="border-dashed mb-6">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground text-center">
              You need to add a property before creating listings.
            </p>
          </CardContent>
        </Card>
      )}

      {listings.length === 0 && properties.length > 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first listing to start accepting bookings
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Listing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={STATUS_COLORS[listing.status]}>
                        {STATUS_LABELS[listing.status]}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">
                      {listing.property?.resort_name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {listing.property?.location}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Final Price</p>
                    <p className="text-xl font-bold">${listing.final_price.toLocaleString()}</p>
                    {listing.rav_markup > 0 && (
                      <p className="text-xs text-muted-foreground">
                        (Your price: ${listing.owner_price.toLocaleString()})
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(listing.check_in_date), "MMM d, yyyy")} -{" "}
                      {format(new Date(listing.check_out_date), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>

                {listing.notes && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {listing.notes}
                  </p>
                )}

                <div className="flex gap-2">
                  {["draft", "pending_approval"].includes(listing.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(listing)}
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                  )}

                  {["draft", "pending_approval", "active"].includes(listing.status) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <XCircle className="mr-2 h-3 w-3" />
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Listing?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will cancel the listing and it will no longer be available
                            for booking. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Listing</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleCancel(listing.id)}>
                            Cancel Listing
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {["draft", "cancelled"].includes(listing.status) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this listing. This action cannot
                            be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(listing.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerListings;
