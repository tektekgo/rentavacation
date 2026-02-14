import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ResortInfoCard } from "@/components/resort/ResortInfoCard";
import { UnitTypeSpecs } from "@/components/resort/UnitTypeSpecs";
import {
  Star,
  MapPin,
  Heart,
  Share2,
  Users,
  Bed,
  Bath,
  Check,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Home,
  ArrowLeft,
} from "lucide-react";
import { useListing } from "@/hooks/useListings";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const BRAND_LABELS: Record<string, string> = {
  hilton_grand_vacations: "Hilton Grand Vacations",
  marriott_vacation_club: "Marriott Vacation Club",
  disney_vacation_club: "Disney Vacation Club",
  wyndham_destinations: "Wyndham Destinations",
  hyatt_residence_club: "Hyatt Residence Club",
  bluegreen_vacations: "Bluegreen Vacations",
  holiday_inn_club: "Holiday Inn Club",
  worldmark: "Worldmark",
  other: "Other",
};

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const [guests, setGuests] = useState(1);

  // Auth
  const { user } = useAuth();
  const { toast } = useToast();

  // Favorites
  const { data: favoriteIds = [] } = useFavoriteIds();
  const toggleFavoriteMutation = useToggleFavorite();
  const isLiked = id ? favoriteIds.includes(id) : false;

  const handleToggleFavorite = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your favorites.",
      });
      return;
    }
    if (id) toggleFavoriteMutation.mutate(id);
  };

  // Real listing data
  const { data: listing, isLoading, error } = useListing(id);

  // Derived data
  const prop = listing?.property;
  const resort = prop?.resort;
  const unitType = prop?.unit_type as any;
  const nights = listing ? calculateNights(listing.check_in_date, listing.check_out_date) : 0;
  const pricePerNight = nights > 0 && listing ? Math.round(listing.final_price / nights) : 0;

  // Build image array from property/resort data
  const images: string[] = [];
  if (prop?.images && prop.images.length > 0) images.push(...prop.images);
  if (resort?.main_image_url) images.push(resort.main_image_url);
  if (resort?.additional_images && resort.additional_images.length > 0) images.push(...resort.additional_images);

  const displayName = resort?.resort_name && unitType
    ? `${unitType.unit_type_name} at ${resort.resort_name}`
    : resort?.resort_name || prop?.resort_name || "Vacation Rental";

  const location = resort?.location
    ? `${resort.location.city}, ${resort.location.state}`
    : prop?.location || "";

  const brandLabel = prop ? (BRAND_LABELS[prop.brand] || prop.brand) : "";

  const nextImage = () => {
    if (images.length > 0) setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length > 0) setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleBookNow = () => {
    if (!user) {
      navigate("/login", { state: { from: `/property/${id}` } });
      return;
    }
    if (!listing) return;
    navigate(`/checkout?listing=${listing.id}&guests=${guests}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading property details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error / Not found
  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center pt-32 px-4">
          <Home className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Listing Not Found</h1>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            This listing may no longer be available or the link may be invalid.
          </p>
          <Button onClick={() => navigate("/rentals")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse Rentals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/rentals" className="hover:text-foreground">Rentals</Link>
            <span>/</span>
            <span className="text-foreground">{displayName}</span>
          </div>
        </div>

        {/* Image Gallery */}
        <section className="container mx-auto px-4 mb-8">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="aspect-[16/9] md:aspect-[21/9]">
              {images.length > 0 ? (
                <img
                  src={images[currentImage]}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Home className="w-20 h-20 text-muted-foreground" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImage ? "w-8 bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleToggleFavorite}
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-accent text-accent" : ""}`} />
              </button>
              <button className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 pb-20">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  {location} {brandLabel && `• ${brandLabel}`}
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                  {resort?.guest_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-warning text-warning" />
                      <span className="font-semibold">{resort.guest_rating}</span>
                      <span className="text-muted-foreground">Guest Rating</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {unitType ? unitType.max_occupancy : prop?.sleeps} guests
                    </span>
                    <span className="flex items-center gap-1">
                      <Bed className="w-4 h-4" />
                      {unitType
                        ? unitType.bedrooms === 0
                          ? "Studio"
                          : `${unitType.bedrooms} bedrooms`
                        : `${prop?.bedrooms} bedrooms`
                      }
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-4 h-4" />
                      {unitType ? unitType.bathrooms : prop?.bathrooms} bathrooms
                    </span>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="mb-8 bg-primary/5 rounded-xl p-4">
                <h2 className="font-display text-lg font-semibold text-foreground mb-2">
                  Available Dates
                </h2>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>
                      {new Date(listing.check_in_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <span className="text-muted-foreground">to</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>
                      {new Date(listing.check_out_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <span className="text-muted-foreground">({nights} nights)</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  About This Property
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {resort?.description || prop?.description || "Experience a wonderful vacation at this resort property."}
                </p>
                {listing.notes && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Owner Notes</p>
                    <p className="text-sm text-muted-foreground">{listing.notes}</p>
                  </div>
                )}
              </div>

              {/* Unit Type Specs */}
              {unitType && (
                <div className="mb-8">
                  <UnitTypeSpecs unitType={unitType} />
                </div>
              )}

              {/* Amenities */}
              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  Amenities
                </h2>
                {resort?.resort_amenities && resort.resort_amenities.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {resort.resort_amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Check className="w-5 h-5 text-primary" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                ) : prop?.amenities && prop.amenities.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {prop.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Check className="w-5 h-5 text-primary" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Contact the owner for amenity details.</p>
                )}
              </div>

              {/* Cancellation Policy */}
              <div className="mb-8 bg-card rounded-xl p-6 shadow-card">
                <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                  Cancellation Policy
                </h2>
                <p className="text-muted-foreground capitalize">
                  {listing.cancellation_policy.replace("_", " ")}
                </p>
              </div>
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Booking Card */}
                <div className="bg-card rounded-2xl shadow-card-hover p-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-foreground">
                      ${listing.final_price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">total</span>
                  </div>
                  {nights > 0 && (
                    <p className="text-sm text-muted-foreground mb-4">
                      ${pricePerNight}/night × {nights} nights
                    </p>
                  )}

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Check-in</label>
                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        {new Date(listing.check_in_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Check-out</label>
                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        {new Date(listing.check_out_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Guests</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                          className="w-full h-10 rounded-md border border-input bg-background pl-10 pr-3"
                          value={guests}
                          onChange={(e) => setGuests(Number(e.target.value))}
                        >
                          {Array.from(
                            { length: unitType?.max_occupancy || prop?.sleeps || 6 },
                            (_, i) => i + 1
                          ).map((n) => (
                            <option key={n} value={n}>
                              {n} guest{n !== 1 ? "s" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full mb-4" size="lg" onClick={handleBookNow}>
                    {user ? "Book Now" : "Sign In to Book"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground mb-4">
                    You won't be charged yet
                  </p>

                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        ${pricePerNight} × {nights} nights
                      </span>
                      <span>${listing.final_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total</span>
                      <span>${listing.final_price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Resort Information Card */}
                {resort && (
                  <ResortInfoCard resort={resort} />
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PropertyDetail;
