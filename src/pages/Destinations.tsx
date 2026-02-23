import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ArrowRight, MapPin } from "lucide-react";
import keralaImage from "@/assets/kerala-backwaters.jpg";
import utahImage from "@/assets/utah-arches.jpg";
import yellowstoneImage from "@/assets/yellowstone.jpg";
import jacksonvilleImage from "@/assets/jacksonville-beach.jpg";

const destinations = [
  {
    name: "Hawaii",
    country: "USA",
    properties: 456,
    image: keralaImage,
    popular: ["Maui", "Oahu", "Big Island", "Kauai"],
    featured: true,
  },
  {
    name: "Florida",
    country: "USA",
    properties: 892,
    image: jacksonvilleImage,
    popular: ["Orlando", "Miami", "Tampa", "Jacksonville"],
    featured: true,
  },
  {
    name: "California",
    country: "USA",
    properties: 567,
    image: utahImage,
    popular: ["San Diego", "Palm Springs", "Lake Tahoe", "Napa Valley"],
    featured: false,
  },
  {
    name: "Mexico",
    country: "North America",
    properties: 345,
    image: yellowstoneImage,
    popular: ["Cancun", "Cabo San Lucas", "Puerto Vallarta", "Riviera Maya"],
    featured: true,
  },
  {
    name: "Caribbean",
    country: "Islands",
    properties: 234,
    image: keralaImage,
    popular: ["Aruba", "Jamaica", "Bahamas", "St. Maarten"],
    featured: false,
  },
  {
    name: "Colorado",
    country: "USA",
    properties: 189,
    image: yellowstoneImage,
    popular: ["Vail", "Breckenridge", "Aspen", "Steamboat Springs"],
    featured: false,
  },
  {
    name: "Arizona",
    country: "USA",
    properties: 156,
    image: utahImage,
    popular: ["Scottsdale", "Sedona", "Phoenix", "Tucson"],
    featured: false,
  },
  {
    name: "Nevada",
    country: "USA",
    properties: 201,
    image: jacksonvilleImage,
    popular: ["Las Vegas", "Lake Tahoe", "Reno"],
    featured: false,
  },
  {
    name: "South Carolina",
    country: "USA",
    properties: 145,
    image: keralaImage,
    popular: ["Myrtle Beach", "Hilton Head", "Charleston"],
    featured: false,
  },
  {
    name: "Utah",
    country: "USA",
    properties: 89,
    image: utahImage,
    popular: ["Park City", "St. George", "Moab"],
    featured: false,
  },
  {
    name: "Europe",
    country: "International",
    properties: 178,
    image: yellowstoneImage,
    popular: ["Spain", "Portugal", "Italy", "France"],
    featured: false,
  },
  {
    name: "Asia Pacific",
    country: "International",
    properties: 134,
    image: keralaImage,
    popular: ["Thailand", "Bali", "Fiji", "Australia"],
    featured: false,
  },
];

const Destinations = () => {
  usePageMeta('Top Destinations', 'Explore top vacation destinations with luxury resort stays at up to 70% off retail prices.');
  const featuredDestinations = destinations.filter((d) => d.featured);
  const allDestinations = destinations.filter((d) => !d.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-warm">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            Explore Destinations
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover amazing vacation spots worldwide. From tropical beaches to mountain
            retreats, find your perfect getaway.
          </p>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8">
            Featured Destinations
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDestinations.map((dest, index) => (
              <Link
                key={index}
                to={`/rentals?location=${encodeURIComponent(dest.name)}`}
                className="group relative rounded-2xl overflow-hidden"
                style={{ minHeight: "300px" }}
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-1 text-white/70 text-sm mb-2">
                    <MapPin className="w-4 h-4" />
                    {dest.country}
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white mb-2">
                    {dest.name}
                  </h3>
                  <p className="text-white/80 mb-3">{dest.properties} properties</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {dest.popular.slice(0, 3).map((place, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-white/20 rounded-full text-xs text-white"
                      >
                        {place}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-white group-hover:text-accent transition-colors">
                    <span className="text-sm font-medium">Explore</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* All Destinations */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8">
            All Destinations
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allDestinations.map((dest, index) => (
              <Link
                key={index}
                to={`/rentals?location=${encodeURIComponent(dest.name)}`}
                className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all group"
              >
                <div className="h-40 overflow-hidden">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                    <MapPin className="w-3 h-3" />
                    {dest.country}
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {dest.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{dest.properties} properties</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {dest.popular.slice(0, 2).map((place, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground"
                      >
                        {place}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Resort Brands */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8">
            Browse by Resort Brand
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              "Marriott Vacation Club",
              "Hilton Grand Vacations",
              "Wyndham Destinations",
              "Disney Vacation Club",
              "Hyatt Residence Club",
              "Diamond Resorts",
              "Bluegreen Vacations",
              "Holiday Inn Club",
              "Worldmark",
              "Shell Vacations",
              "Festiva Hospitality",
              "Silverleaf Resorts",
            ].map((brand, index) => (
              <Link
                key={index}
                to={`/rentals?brand=${encodeURIComponent(brand)}`}
                className="bg-card rounded-lg p-4 text-center shadow-card hover:shadow-card-hover transition-all hover:bg-primary/5"
              >
                <span className="text-sm font-medium text-foreground">{brand}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Destinations;
