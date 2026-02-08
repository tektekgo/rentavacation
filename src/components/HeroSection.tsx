import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Calendar, MapPin, Users, Sparkles } from "lucide-react";
import keralaImage from "@/assets/kerala-backwaters.jpg";
import utahImage from "@/assets/utah-arches.jpg";
import yellowstoneImage from "@/assets/yellowstone.jpg";
import jacksonvilleImage from "@/assets/jacksonville-beach.jpg";

const destinations = [
  { image: keralaImage, name: "Kerala Backwaters", location: "India" },
  { image: utahImage, name: "Utah Arches", location: "Utah, USA" },
  { image: yellowstoneImage, name: "Yellowstone", location: "Wyoming, USA" },
  { image: jacksonvilleImage, name: "Jacksonville Beach", location: "Florida, USA" },
];

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchTab, setSearchTab] = useState<"flexible" | "calendar">("flexible");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % destinations.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image Carousel */}
      {destinations.map((dest, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={dest.image}
            alt={dest.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 hero-overlay" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Fun Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 backdrop-blur-sm border border-accent/30 mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-white/90 text-sm font-medium">
              The brainchild of Ajumon & Sujit ✨
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-slide-up">
            Insider Access to{" "}
            <span className="text-accent">Members-Only</span>{" "}
            Vacation Clubs
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto animate-fade-in">
            Rent directly from timeshare owners at a fraction of the resort's price. 
            Save up to 70% on luxury vacation stays.
          </p>

          {/* Search Box */}
          <div className="bg-card/95 backdrop-blur-lg rounded-2xl shadow-card-hover p-4 md:p-6 max-w-3xl mx-auto animate-scale-in">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSearchTab("flexible")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  searchTab === "flexible"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                I'm Flexible
              </button>
              <button
                onClick={() => setSearchTab("calendar")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  searchTab === "calendar"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Calendar className="w-4 h-4 inline-block mr-1" />
                Calendar
              </button>
            </div>

            {/* Search Fields */}
            <div className="grid md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Where do you want to go?"
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Check-in"
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <Button variant="hero" size="lg" className="w-full h-12">
                  <Search className="w-5 h-5" />
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {destinations.map((dest, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-300 ${
                  index === currentSlide
                    ? "w-8 h-2 bg-white rounded-full"
                    : "w-2 h-2 bg-white/50 rounded-full hover:bg-white/70"
                }`}
                aria-label={`Go to ${dest.name}`}
              />
            ))}
          </div>

          {/* Current Location */}
          <p className="text-white/70 mt-4 text-sm">
            Currently viewing: <span className="text-white font-medium">{destinations[currentSlide].name}</span>, {destinations[currentSlide].location}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
