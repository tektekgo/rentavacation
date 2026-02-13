import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import keralaImage from "@/assets/kerala-backwaters.jpg";
import utahImage from "@/assets/utah-arches.jpg";
import yellowstoneImage from "@/assets/yellowstone.jpg";
import jacksonvilleImage from "@/assets/jacksonville-beach.jpg";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { VoiceStatusIndicator } from "@/components/VoiceStatusIndicator";

const voiceEnabled = import.meta.env.VITE_FEATURE_VOICE_ENABLED === "true";

const allListings = [
  {
    id: 1,
    name: "Kerala Backwaters Resort & Spa",
    location: "Kerala, India",
    image: keralaImage,
    rating: 4.9,
    reviews: 128,
    pricePerNight: 189,
    originalPrice: 450,
    badge: "Top Rated",
    sleeps: 6,
    bedrooms: 2,
    resort: "Marriott Vacation Club",
  },
  {
    id: 2,
    name: "Desert Arches Luxury Villas",
    location: "Moab, Utah",
    image: utahImage,
    rating: 4.8,
    reviews: 94,
    pricePerNight: 225,
    originalPrice: 520,
    badge: "Popular",
    sleeps: 4,
    bedrooms: 1,
    resort: "Hilton Grand Vacations",
  },
  {
    id: 3,
    name: "Yellowstone Grand Lodge",
    location: "West Yellowstone, Montana",
    image: yellowstoneImage,
    rating: 4.7,
    reviews: 156,
    pricePerNight: 275,
    originalPrice: 680,
    badge: "Featured",
    sleeps: 8,
    bedrooms: 3,
    resort: "Wyndham Destinations",
  },
  {
    id: 4,
    name: "Jacksonville Beach Resort",
    location: "Jacksonville, Florida",
    image: jacksonvilleImage,
    rating: 4.6,
    reviews: 87,
    pricePerNight: 165,
    originalPrice: 390,
    badge: "Beach Front",
    sleeps: 5,
    bedrooms: 2,
    resort: "Diamond Resorts",
  },
  {
    id: 5,
    name: "Oceanfront Paradise Suite",
    location: "Maui, Hawaii",
    image: keralaImage,
    rating: 4.9,
    reviews: 203,
    pricePerNight: 320,
    originalPrice: 750,
    badge: "Premium",
    sleeps: 6,
    bedrooms: 2,
    resort: "Marriott Ko Olina",
  },
  {
    id: 6,
    name: "Mountain View Chalet",
    location: "Park City, Utah",
    image: utahImage,
    rating: 4.8,
    reviews: 112,
    pricePerNight: 245,
    originalPrice: 580,
    badge: "Ski-In/Out",
    sleeps: 8,
    bedrooms: 3,
    resort: "Vail Resorts",
  },
];

const Rentals = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [liked, setLiked] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const toggleLike = (id: number) => {
    setLiked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

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
              <Button variant="outline">
                Price
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline">
                Bedrooms
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline">
                Resort Brand
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {allListings.length} properties found
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

          {/* Results Grid */}
          <div
            className={
              viewMode === "grid"
                ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
            }
          >
            {allListings.map((listing) => (
              <Link
                key={listing.id}
                to={`/property/${listing.id}`}
                className={`group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 ${
                  viewMode === "list" ? "flex" : ""
                }`}
              >
                {/* Image */}
                <div
                  className={`relative overflow-hidden ${
                    viewMode === "list" ? "w-72 h-48" : "h-52"
                  }`}
                >
                  <img
                    src={listing.image}
                    alt={listing.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                    {listing.badge}
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
                        liked.includes(listing.id)
                          ? "fill-accent text-accent"
                          : "text-foreground"
                      }`}
                    />
                  </button>
                  <span className="absolute bottom-3 left-3 px-2 py-1 text-xs font-bold bg-accent text-accent-foreground rounded">
                    Save {Math.round((1 - listing.pricePerNight / listing.originalPrice) * 100)}%
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 flex-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {listing.location}
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {listing.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    {listing.resort}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-warning text-warning" />
                      <span className="font-semibold text-sm">{listing.rating}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      ({listing.reviews} reviews)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-muted-foreground text-sm line-through">
                        ${listing.originalPrice}
                      </span>
                      <div className="text-foreground">
                        <span className="font-display text-xl font-bold">${listing.pricePerNight}</span>
                        <span className="text-muted-foreground text-sm"> / night</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Users className="w-3 h-3 inline mr-1" />
                      {listing.sleeps} guests • {listing.bedrooms} BR
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-12">
            <div className="flex gap-2">
              <Button variant="outline" disabled>Previous</Button>
              <Button variant="default">1</Button>
              <Button variant="outline">2</Button>
              <Button variant="outline">3</Button>
              <Button variant="outline">Next</Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Rentals;
