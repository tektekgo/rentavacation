import { ArrowRight } from "lucide-react";
import keralaImage from "@/assets/kerala-backwaters.jpg";
import utahImage from "@/assets/utah-arches.jpg";
import yellowstoneImage from "@/assets/yellowstone.jpg";
import jacksonvilleImage from "@/assets/jacksonville-beach.jpg";

const destinations = [
  {
    name: "Kerala",
    country: "India",
    properties: 145,
    image: keralaImage,
    featured: true,
  },
  {
    name: "Utah",
    country: "USA",
    properties: 89,
    image: utahImage,
    featured: false,
  },
  {
    name: "Yellowstone",
    country: "USA",
    properties: 67,
    image: yellowstoneImage,
    featured: false,
  },
  {
    name: "Florida",
    country: "USA",
    properties: 312,
    image: jacksonvilleImage,
    featured: true,
  },
];

const TopDestinations = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Explore Top Destinations
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From tropical beaches to mountain retreats, discover amazing vacation spots worldwide
          </p>
        </div>

        {/* Destination Grid - Masonry Style */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {destinations.map((dest, index) => (
            <div
              key={index}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer ${
                dest.featured ? "md:row-span-2 md:col-span-2 lg:col-span-2 lg:row-span-2" : ""
              }`}
              style={{ minHeight: dest.featured ? "400px" : "200px" }}
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className={`font-display font-bold text-white mb-1 ${dest.featured ? "text-3xl" : "text-xl"}`}>
                  {dest.name}
                </h3>
                <p className="text-white/80 text-sm mb-3">
                  {dest.country} • {dest.properties} properties
                </p>
                <div className="flex items-center gap-2 text-white/90 group-hover:text-accent transition-colors">
                  <span className="text-sm font-medium">Explore</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopDestinations;
