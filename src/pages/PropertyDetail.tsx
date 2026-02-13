import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Wifi,
  Car,
  Waves,
  Utensils,
  Dumbbell,
  Shield,
  Calendar,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Resort, ResortUnitType } from "@/types/database";
import keralaImage from "@/assets/kerala-backwaters.jpg";
import utahImage from "@/assets/utah-arches.jpg";
import yellowstoneImage from "@/assets/yellowstone.jpg";
import jacksonvilleImage from "@/assets/jacksonville-beach.jpg";

// Mock property data - used as fallback when no DB property exists
const mockPropertyData = {
  id: 1,
  name: "Kerala Backwaters Resort & Spa",
  location: "Kerala, India",
  resort: "Marriott Vacation Club",
  images: [keralaImage, utahImage, yellowstoneImage, jacksonvilleImage],
  rating: 4.9,
  reviews: 128,
  pricePerNight: 189,
  originalPrice: 450,
  sleeps: 6,
  bedrooms: 2,
  bathrooms: 2,
  description:
    "Experience the magic of Kerala's backwaters from this stunning resort. Wake up to serene water views, enjoy world-class spa treatments, and immerse yourself in local culture. This spacious 2-bedroom villa features a full kitchen, private balcony, and access to all resort amenities.",
  amenities: [
    { icon: Wifi, name: "Free WiFi" },
    { icon: Car, name: "Free Parking" },
    { icon: Waves, name: "Pool Access" },
    { icon: Utensils, name: "Full Kitchen" },
    { icon: Dumbbell, name: "Fitness Center" },
    { icon: Shield, name: "24/7 Security" },
  ],
  owner: {
    name: "Priya S.",
    avatar: "P",
    memberSince: "2019",
    responseRate: 98,
    responseTime: "within an hour",
  },
  reviews_list: [
    {
      name: "John D.",
      date: "January 2025",
      rating: 5,
      text: "Absolutely stunning property! The views were incredible and the unit was spotless.",
    },
    {
      name: "Maria L.",
      date: "December 2024",
      rating: 5,
      text: "Perfect vacation. Priya was super helpful and the resort amenities were amazing.",
    },
  ],
};

const PropertyDetail = () => {
  const { id } = useParams();
  const [currentImage, setCurrentImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // Resort data from database
  const [resortData, setResortData] = useState<Resort | null>(null);
  const [unitTypeData, setUnitTypeData] = useState<ResortUnitType | null>(null);
  const [loading, setLoading] = useState(true);

  // Try to load resort data for this property
  useEffect(() => {
    loadPropertyResortData();
  }, [id]);

  async function loadPropertyResortData() {
    setLoading(true);

    // Try to fetch the property with its resort and unit type joins
    const { data: property } = await supabase
      .from("properties")
      .select(`
        resort_id,
        unit_type_id
      `)
      .eq("id", id || "")
      .single();

    if (property?.resort_id) {
      const { data: resort } = await supabase
        .from("resorts")
        .select("*")
        .eq("id", property.resort_id)
        .single();

      if (resort) setResortData(resort as Resort);
    }

    if (property?.unit_type_id) {
      const { data: unitType } = await supabase
        .from("resort_unit_types")
        .select("*")
        .eq("id", property.unit_type_id)
        .single();

      if (unitType) setUnitTypeData(unitType as ResortUnitType);
    }

    setLoading(false);
  }

  // Use mock data for demo (properties don't exist in DB yet)
  const property = mockPropertyData;
  const hasResortData = !!resortData;
  const hasUnitTypeData = !!unitTypeData;

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

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
            <span className="text-foreground">
              {hasResortData ? resortData.resort_name : property.name}
            </span>
          </div>
        </div>

        {/* Image Gallery */}
        <section className="container mx-auto px-4 mb-8">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="aspect-[16/9] md:aspect-[21/9]">
              <img
                src={property.images[currentImage]}
                alt={hasResortData ? resortData.resort_name : property.name}
                className="w-full h-full object-cover"
              />
            </div>
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
              {property.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImage ? "w-8 bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setIsLiked(!isLiked)}
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
                  {hasResortData
                    ? `${resortData.location.city}, ${resortData.location.state} • ${resortData.resort_name}`
                    : `${property.location} • ${property.resort}`
                  }
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {hasUnitTypeData
                    ? `${unitTypeData.unit_type_name} at ${resortData?.resort_name || property.name}`
                    : property.name
                  }
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-warning text-warning" />
                    <span className="font-semibold">
                      {hasResortData && resortData.guest_rating
                        ? resortData.guest_rating
                        : property.rating
                      }
                    </span>
                    {!hasResortData && (
                      <span className="text-muted-foreground">({property.reviews} reviews)</span>
                    )}
                    {hasResortData && (
                      <span className="text-muted-foreground">Guest Rating</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {hasUnitTypeData ? unitTypeData.max_occupancy : property.sleeps} guests
                    </span>
                    <span className="flex items-center gap-1">
                      <Bed className="w-4 h-4" />
                      {hasUnitTypeData
                        ? unitTypeData.bedrooms === 0
                          ? "Studio"
                          : `${unitTypeData.bedrooms} bedrooms`
                        : `${property.bedrooms} bedrooms`
                      }
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-4 h-4" />
                      {hasUnitTypeData ? unitTypeData.bathrooms : property.bathrooms} bathrooms
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  About This Property
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {hasResortData && resortData.description
                    ? resortData.description
                    : property.description
                  }
                </p>
              </div>

              {/* Unit Type Specs (from resort master data) */}
              {hasUnitTypeData && (
                <div className="mb-8">
                  <UnitTypeSpecs unitType={unitTypeData} />
                </div>
              )}

              {/* Amenities - show resort amenities if available, otherwise mock */}
              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  Amenities
                </h2>
                {hasResortData && resortData.resort_amenities && resortData.resort_amenities.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {resortData.resort_amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Check className="w-5 h-5 text-primary" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <amenity.icon className="w-5 h-5 text-primary" />
                        <span>{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Owner */}
              <div className="mb-8 bg-card rounded-xl p-6 shadow-card">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  Meet Your Host
                </h2>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {property.owner.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{property.owner.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Member since {property.owner.memberSince}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Check className="w-4 h-4 text-primary" />
                        {property.owner.responseRate}% response rate
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Responds {property.owner.responseTime}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>

              {/* Reviews */}
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  Reviews
                </h2>
                <div className="space-y-4">
                  {property.reviews_list.map((review, index) => (
                    <div key={index} className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                          {review.name[0]}
                        </div>
                        <div>
                          <div className="font-medium">{review.name}</div>
                          <div className="text-sm text-muted-foreground">{review.date}</div>
                        </div>
                        <div className="ml-auto flex gap-0.5">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground">{review.text}</p>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="mt-4">
                  View all {property.reviews} reviews →
                </Button>
              </div>
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Booking Card */}
                <div className="bg-card rounded-2xl shadow-card-hover p-6">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-muted-foreground text-sm line-through">
                      ${property.originalPrice}
                    </span>
                    <span className="text-3xl font-bold text-foreground">
                      ${property.pricePerNight}
                    </span>
                    <span className="text-muted-foreground">/ night</span>
                  </div>
                  <div className="inline-block px-3 py-1 bg-accent/20 text-accent-foreground rounded-full text-sm font-medium mb-6">
                    Save {Math.round((1 - property.pricePerNight / property.originalPrice) * 100)}%
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Check-in</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="date" className="pl-10" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Check-out</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="date" className="pl-10" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Guests</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select className="w-full h-10 rounded-md border border-input bg-background pl-10 pr-3">
                          <option>1 guest</option>
                          <option>2 guests</option>
                          <option>3 guests</option>
                          <option>4 guests</option>
                          <option>5 guests</option>
                          <option>6 guests</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <Link to="/login">
                    <Button className="w-full mb-4" size="lg">
                      Request to Book
                    </Button>
                  </Link>

                  <p className="text-center text-sm text-muted-foreground mb-4">
                    You won't be charged yet
                  </p>

                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">$189 x 7 nights</span>
                      <span>$1,323</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service fee</span>
                      <span>$132</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total</span>
                      <span>$1,455</span>
                    </div>
                  </div>
                </div>

                {/* Resort Information Card (if available) */}
                {hasResortData && (
                  <ResortInfoCard resort={resortData} />
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
