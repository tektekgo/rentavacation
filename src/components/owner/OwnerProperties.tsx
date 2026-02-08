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
import { Plus, Building2, MapPin, Bed, Bath, Users, Edit, Trash2 } from "lucide-react";
import type { Property, VacationClubBrand, Database } from "@/types/database";

type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

const VACATION_CLUB_BRANDS: { value: VacationClubBrand; label: string }[] = [
  { value: "hilton_grand_vacations", label: "Hilton Grand Vacations" },
  { value: "marriott_vacation_club", label: "Marriott Vacation Club" },
  { value: "disney_vacation_club", label: "Disney Vacation Club" },
  { value: "wyndham_destinations", label: "Wyndham Destinations" },
  { value: "hyatt_residence_club", label: "Hyatt Residence Club" },
  { value: "bluegreen_vacations", label: "Bluegreen Vacations" },
  { value: "holiday_inn_club", label: "Holiday Inn Club" },
  { value: "worldmark", label: "WorldMark" },
  { value: "other", label: "Other" },
];

const getBrandLabel = (brand: VacationClubBrand): string => {
  return VACATION_CLUB_BRANDS.find((b) => b.value === brand)?.label || brand;
};

interface PropertyFormData {
  brand: VacationClubBrand;
  resort_name: string;
  location: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  sleeps: number;
  amenities: string[];
}

const initialFormData: PropertyFormData = {
  brand: "hilton_grand_vacations",
  resort_name: "",
  location: "",
  description: "",
  bedrooms: 1,
  bathrooms: 1,
  sleeps: 2,
  amenities: [],
};

const OwnerProperties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [amenitiesInput, setAmenitiesInput] = useState("");

  // Fetch properties
  const fetchProperties = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [user]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const amenitiesList = amenitiesInput.split(",").map((a) => a.trim()).filter(Boolean);

      if (editingProperty) {
        // Update existing
        const updateData: PropertyUpdate = {
          brand: formData.brand,
          resort_name: formData.resort_name,
          location: formData.location,
          description: formData.description,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          sleeps: formData.sleeps,
          amenities: amenitiesList,
        };

        const { error } = await (supabase
          .from("properties") as any)
          .update(updateData)
          .eq("id", editingProperty.id);

        if (error) throw error;
        toast.success("Property updated successfully");
      } else {
        // Create new
        const insertData: PropertyInsert = {
          owner_id: user.id,
          brand: formData.brand,
          resort_name: formData.resort_name,
          location: formData.location,
          description: formData.description,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          sleeps: formData.sleeps,
          amenities: amenitiesList,
        };

        const { error } = await (supabase
          .from("properties") as any)
          .insert(insertData);

        if (error) throw error;
        toast.success("Property added successfully");
      }

      setIsDialogOpen(false);
      setEditingProperty(null);
      setFormData(initialFormData);
      setAmenitiesInput("");
      fetchProperties();
    } catch (error: any) {
      console.error("Error saving property:", error);
      toast.error(error.message || "Failed to save property");
    } finally {
      setIsSaving(false);
    }
  };

  // Open edit dialog
  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      brand: property.brand,
      resort_name: property.resort_name,
      location: property.location,
      description: property.description || "",
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sleeps: property.sleeps,
      amenities: property.amenities,
    });
    setAmenitiesInput(property.amenities.join(", "));
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId);

      if (error) throw error;
      toast.success("Property deleted");
      fetchProperties();
    } catch (error: any) {
      console.error("Error deleting property:", error);
      toast.error(error.message || "Failed to delete property");
    }
  };

  // Reset form on dialog close
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingProperty(null);
      setFormData(initialFormData);
      setAmenitiesInput("");
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
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
          <h2 className="text-2xl font-bold">Your Properties</h2>
          <p className="text-muted-foreground">
            Manage your vacation club properties
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProperty ? "Edit Property" : "Add New Property"}
              </DialogTitle>
              <DialogDescription>
                {editingProperty
                  ? "Update your property details"
                  : "Enter the details of your vacation club property"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand">Vacation Club Brand</Label>
                  <Select
                    value={formData.brand}
                    onValueChange={(value: VacationClubBrand) =>
                      setFormData((prev) => ({ ...prev, brand: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {VACATION_CLUB_BRANDS.map((brand) => (
                        <SelectItem key={brand.value} value={brand.value}>
                          {brand.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resort_name">Resort Name</Label>
                  <Input
                    id="resort_name"
                    value={formData.resort_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, resort_name: e.target.value }))
                    }
                    placeholder="e.g., Hilton Hawaiian Village"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="e.g., Honolulu, Hawaii"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe your property..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min={0}
                    value={formData.bedrooms}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bedrooms: parseInt(e.target.value) || 0 }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min={0}
                    step={0.5}
                    value={formData.bathrooms}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bathrooms: parseFloat(e.target.value) || 0 }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sleeps">Sleeps</Label>
                  <Input
                    id="sleeps"
                    type="number"
                    min={1}
                    value={formData.sleeps}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sleeps: parseInt(e.target.value) || 1 }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  value={amenitiesInput}
                  onChange={(e) => setAmenitiesInput(e.target.value)}
                  placeholder="e.g., Pool, WiFi, Kitchen, Ocean View"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingProperty ? "Update" : "Add Property"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {properties.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first vacation club property to start creating listings
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2">
                      {getBrandLabel(property.brand)}
                    </Badge>
                    <CardTitle className="text-lg">{property.resort_name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {property.location}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    {property.bedrooms} bed
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    {property.bathrooms} bath
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Sleeps {property.sleeps}
                  </span>
                </div>

                {property.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {property.amenities.slice(0, 3).map((amenity, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {property.amenities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{property.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(property)}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Property?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{property.resort_name}" and all its
                          listings. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(property.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerProperties;
