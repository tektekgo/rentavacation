import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Star,
  Heart,
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronDown,
  X,
  Loader2,
  Home,
} from "lucide-react";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { VoiceStatusIndicator } from "@/components/VoiceStatusIndicator";
import { VoiceQuotaIndicator } from "@/components/VoiceQuotaIndicator";
import { useAuth } from "@/hooks/useAuth";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { useActiveListings, type ActiveListing } from "@/hooks/useListings";

const voiceEnabled = import.meta.env.VITE_FEATURE_VOICE_ENABLED === "true";
const ITEMS_PER_PAGE = 6;

// Brand enum to display label mapping
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

function getListingDisplayName(listing: ActiveListing): string {
  const prop = listing.property;
  if (prop.resort?.resort_name && prop.unit_type) {
    return `${(prop.unit_type as any).unit_type_name} at ${prop.resort.resort_name}`;
  }
  if (prop.resort?.resort_name) {
    return prop.resort.resort_name;
  }
  return prop.resort_name;
}

function getListingLocation(listing: ActiveListing): string {
  const prop = listing.property;
  if (prop.resort?.location) {
    const loc = prop.resort.location;
    return `${loc.city}, ${loc.state}`;
  }
  return prop.location;
}

function getListingImage(listing: ActiveListing): string | null {
  const prop = listing.property;
  if (prop.images && prop.images.length > 0) return prop.images[0];
  if (prop.resort?.main_image_url) return prop.resort.main_image_url;
  return null;
}

function getListingBrandLabel(listing: ActiveListing): string {
  return BRAND_LABELS[listing.property.brand] || listing.property.brand;
}

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

const Rentals = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("location") || searchParams.get("brand") || "");
  const [currentPage, setCurrentPage] = useState(1);

  // Auth state for voice search gating
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Favorites
  const { data: favoriteIds = [] } = useFavoriteIds();
  const toggleFavoriteMutation = useToggleFavorite();
  const { toast } = useToast();

  // Real listings from database
  const { data: listings = [], isLoading, error: listingsError } = useActiveListings();

  // Voice search integration
  const {
    status: voiceStatus,
    results: voiceResults,
    error: voiceError,
    transcript: voiceTranscript,
    isCallActive,
    startVoiceSearch,
    stopVoiceSearch,
    reset: resetVoice,
  } = useVoiceSearch();

  // Stop voice session if user logs out
  useEffect(() => {
    if (!isAuthenticated && isCallActive) {
      stopVoiceSearch();
    }
  }, [isAuthenticated, isCallActive, stopVoiceSearch]);

  const toggleLike = (id: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your favorites.",
      });
      return;
    }
    toggleFavoriteMutation.mutate(id);
  };

  // Filter listings by search query
  const filteredListings = searchQuery.trim()
    ? listings.filter((listing) => {
        const q = searchQuery.toLowerCase();
        const name = getListingDisplayName(listing).toLowerCase();
        const location = getListingLocation(listing).toLowerCase();
        const brand = getListingBrandLabel(listing).toLowerCase();
        return (
          location.includes(q) ||
          name.includes(q) ||
          brand.includes(q)
        );
      })
    : listings;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredListings.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedListings = filteredListings.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Search Header */}
      <section className="pt-24 pb-8 bg-muted/50">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            Browse Vacation Rentals
          </h1>

          {/* Search Bar */}
          <div className="bg-card rounded-xl shadow-card p-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Where do you want to go?"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input placeholder="Check-in - Check-out" className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                {voiceEnabled && (
                  <VoiceSearchButton
                    status={voiceStatus}
                    isCallActive={isCallActive}
                    onStart={startVoiceSearch}
                    onStop={stopVoiceSearch}
                    disabled={!isAuthenticated || listings.length === 0}
                    disabledReason={
                      !isAuthenticated
                        ? "Sign in to use voice search"
                        : listings.length === 0
                          ? "No listings available for voice search"
                          : undefined
                    }
                  />
                )}
              </div>
            </div>

            {/* Voice Status Indicator */}
            {voiceEnabled && voiceStatus !== "idle" && (
              <VoiceStatusIndicator
                status={voiceStatus}
                transcript={voiceTranscript}
                resultCount={voiceResults.length}
                error={voiceError}
                onDismiss={voiceStatus === "success" || voiceStatus === "error" ? resetVoice : undefined}
              />
            )}

            {/* Voice Quota Indicator */}
            {voiceEnabled && isAuthenticated && (
              <div className="mt-3 flex justify-end">
                <VoiceQuotaIndicator />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filters & Results */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(true)}>
                Price
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(true)}>
                Bedrooms
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(true)}>
                Resort Brand
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {filteredListings.length} {filteredListings.length === 1 ? "property" : "properties"} found
              </span>
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card"}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-card rounded-xl shadow-card p-6 mb-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filters</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <div className="flex gap-2">
                    <Input placeholder="Min" type="number" />
                    <Input placeholder="Max" type="number" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Guests</label>
                  <Input placeholder="Number of guests" type="number" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Bedrooms</label>
                  <Input placeholder="Min bedrooms" type="number" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Resort Brand</label>
                  <Input placeholder="e.g., Marriott, Hilton" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button>Apply Filters</Button>
                <Button variant="outline">Clear All</Button>
              </div>
            </div>
          )}

          {/* Voice Search Results */}
          {voiceEnabled && voiceResults.length > 0 && (
            <div className="mb-8 animate-fade-in">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                Voice Search Results
              </h2>
              <div
                className={
                  viewMode === "grid"
                    ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "flex flex-col gap-4"
                }
              >
                {voiceResults.map((result) => (
                  <div
                    key={result.listing_id}
                    className={`group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 ${
                      viewMode === "list" ? "flex" : ""
                    }`}
                  >
                    {/* Image */}
                    <div
                      className={`relative overflow-hidden bg-muted ${
                        viewMode === "list" ? "w-72 h-48" : "h-52"
                      }`}
                    >
                      {result.image_url ? (
                        <img
                          src={result.image_url}
                          alt={result.property_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <MapPin className="w-8 h-8" />
                        </div>
                      )}
                      {result.brand && (
                        <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                          {result.brand.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {result.location}
                      </div>
                      <h3 className="font-display font-semibold text-foreground mb-1 line-clamp-1">
                        {result.property_name}
                      </h3>
                      {result.unit_type_name && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {result.unit_type_name}
                          {result.resort_rating && (
                            <span className="ml-2">
                              <Star className="w-3 h-3 fill-warning text-warning inline" /> {result.resort_rating}
                            </span>
                          )}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mb-2">
                        {result.check_in} — {result.check_out}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-foreground">
                          <span className="font-display text-xl font-bold">
                            ${result.price.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground text-sm"> / week</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <Users className="w-3 h-3 inline mr-1" />
                          {result.sleeps} guests • {result.bedrooms} BR
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-b border-border my-8" />
            </div>
          )}

          {/* Search context banner */}
          {searchQuery.trim() && (
            <div className="flex items-center gap-2 mb-6 p-3 bg-muted/50 rounded-lg">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Showing results for "<span className="font-medium text-foreground">{searchQuery}</span>"
              </span>
              <button
                onClick={() => setSearchQuery("")}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading available properties...</p>
            </div>
          )}

          {/* Error State */}
          {listingsError && !isLoading && (
            <div className="text-center py-16">
              <X className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                Unable to load listings
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Something went wrong loading properties. Please try again.
              </p>
            </div>
          )}

          {/* Empty State — No listings in DB */}
          {!isLoading && !listingsError && listings.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Home className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                Our Marketplace is Launching Soon!
              </h3>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                We're onboarding property owners and building an amazing selection of vacation rentals.
                Be among the first to list or browse when we launch.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/list-property">
                  <Button size="lg">
                    <Home className="w-4 h-4 mr-2" />
                    List Your Property
                  </Button>
                </Link>
                <Link to="/bidding">
                  <Button variant="outline" size="lg">
                    Browse Bidding Marketplace
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Empty search results */}
          {!isLoading && !listingsError && listings.length > 0 && filteredListings.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                No properties found
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We couldn't find any properties matching "{searchQuery}". Try a different location or browse all available rentals.
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                View All Properties
              </Button>
            </div>
          ) : !isLoading && !listingsError && filteredListings.length > 0 && (
          <>
          {/* Results Grid */}
          <div
            className={
              viewMode === "grid"
                ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
            }
          >
            {paginatedListings.map((listing) => {
              const nights = calculateNights(listing.check_in_date, listing.check_out_date);
              const pricePerNight = nights > 0 ? Math.round(listing.final_price / nights) : listing.final_price;
              const image = getListingImage(listing);
              const displayName = getListingDisplayName(listing);
              const location = getListingLocation(listing);
              const brandLabel = getListingBrandLabel(listing);
              const rating = listing.property.resort?.guest_rating;

              return (
                <Link
                  key={listing.id}
                  to={`/property/${listing.id}`}
                  className={`group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  {/* Image */}
                  <div
                    className={`relative overflow-hidden bg-muted ${
                      viewMode === "list" ? "w-72 h-48" : "h-52"
                    }`}
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={displayName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                        <Home className="w-12 h-12" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                      {brandLabel}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleLike(listing.id);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          favoriteIds.includes(listing.id)
                            ? "fill-accent text-accent"
                            : "text-foreground"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {location}
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                      {displayName}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      {rating && (
                        <>
                          <Star className="w-3 h-3 fill-warning text-warning" />
                          <span className="font-semibold">{rating}</span>
                          <span className="mx-1">•</span>
                        </>
                      )}
                      {new Date(listing.check_in_date).toLocaleDateString()} — {new Date(listing.check_out_date).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-muted-foreground">
                        {nights} nights
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-foreground">
                          <span className="font-display text-xl font-bold">${listing.final_price.toLocaleString()}</span>
                          <span className="text-muted-foreground text-sm"> total</span>
                        </div>
                        {nights > 0 && (
                          <span className="text-muted-foreground text-xs">
                            ${pricePerNight}/night
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <Users className="w-3 h-3 inline mr-1" />
                        {listing.property.sleeps} guests • {listing.property.bedrooms} BR
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-12">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={safePage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === safePage}
                      onClick={() => setCurrentPage(page)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={safePage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
          </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Rentals;
