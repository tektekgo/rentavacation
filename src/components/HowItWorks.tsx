import { Search, Calendar, Key, DollarSign, Home, Shield, MessageSquare, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const travelerSteps = [
  {
    icon: Search,
    title: "Search & Discover",
    description: "Browse thousands of timeshare rentals at world-class resorts by Marriott, Hilton, Wyndham, and more.",
  },
  {
    icon: Calendar,
    title: "Book Your Dates",
    description: "Find availability that works for you. Use flexible dates or pick exact check-in and check-out dates.",
  },
  {
    icon: MessageSquare,
    title: "Connect with Owners",
    description: "Message hosts directly to ask questions, confirm details, and finalize your booking.",
  },
  {
    icon: Key,
    title: "Enjoy Your Stay",
    description: "Check in at the resort and enjoy your luxury vacation at a fraction of the hotel price.",
  },
];

const ownerSteps = [
  {
    icon: Home,
    title: "List Your Property",
    description: "Create a free listing in minutes. Add photos, details, and set your price and availability.",
  },
  {
    icon: Shield,
    title: "Get Verified",
    description: "Our team verifies your ownership to build trust with travelers and protect your listing.",
  },
  {
    icon: MessageSquare,
    title: "Manage Inquiries",
    description: "Respond to traveler messages, accept bookings, and manage your calendar all in one place.",
  },
  {
    icon: DollarSign,
    title: "Earn Money",
    description: "Get paid securely for rentals. Offset your maintenance fees and earn extra income.",
  },
];

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState<"travelers" | "owners">("travelers");
  const steps = activeTab === "travelers" ? travelerSteps : ownerSteps;

  return (
    <section className="py-20 bg-gradient-warm">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How VacayShare Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Whether you're looking to book an amazing vacation or earn from your timeshare, 
            we make it simple and secure.
          </p>

          {/* Tab Toggle */}
          <div className="inline-flex bg-muted p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("travelers")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "travelers"
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              For Travelers
            </button>
            <button
              onClick={() => setActiveTab("owners")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "owners"
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              For Owners
            </button>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              {/* Step Number */}
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <step.icon className="w-7 h-7 text-primary" />
              </div>

              {/* Content */}
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>

              {/* Connector Line (except last) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to={activeTab === "travelers" ? "/rentals" : "/list-property"}>
            <Button variant="hero" size="xl">
              {activeTab === "travelers" ? "Start Searching" : "List Your Property"}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
