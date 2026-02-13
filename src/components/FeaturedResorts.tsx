import { Star, MapPin, ChevronRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import keralaImage from "@/assets/kerala-backwaters.jpg";
import utahImage from "@/assets/utah-arches.jpg";
import yellowstoneImage from "@/assets/yellowstone.jpg";
import jacksonvilleImage from "@/assets/jacksonville-beach.jpg";

const resorts = [
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
  },
];

const FeaturedResorts = () => {
  const { user } = useAuth();
  const { data: favoriteIds = [] } = useFavoriteIds();
  const toggleFavoriteMutation = useToggleFavorite();
  const { toast } = useToast();

  const toggleLike = (id: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your favorites.",
      });
      return;
    }
    toggleFavoriteMutation.mutate(String(id));
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Exclusive Deals at Top Resorts
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Hand-picked vacation properties from verified timeshare owners
            </p>
          </div>
          <Link to="/rentals">
            <Button variant="outline">
              View All Resorts
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Resort Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resorts.map((resort, index) => (
            <Link
              to={`/property/${resort.id}`}
              key={resort.id}
              className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={resort.image}
                  alt={resort.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Badge */}
                <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                  {resort.badge}
                </span>
                {/* Like Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleLike(resort.id);
                  }}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      favoriteIds.includes(String(resort.id))
                        ? "fill-accent text-accent"
                        : "text-foreground"
                    }`}
                  />
                </button>
                {/* Discount Badge */}
                <span className="absolute bottom-3 left-3 px-2 py-1 text-xs font-bold bg-accent text-accent-foreground rounded">
                  Save {Math.round((1 - resort.pricePerNight / resort.originalPrice) * 100)}%
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {resort.location}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                  {resort.name}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    <span className="font-semibold text-sm">{resort.rating}</span>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    ({resort.reviews} reviews)
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-muted-foreground text-sm line-through">
                      ${resort.originalPrice}
                    </span>
                    <div className="text-foreground">
                      <span className="text-xl font-bold">${resort.pricePerNight}</span>
                      <span className="text-muted-foreground text-sm"> / night</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Sleeps {resort.sleeps}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedResorts;
