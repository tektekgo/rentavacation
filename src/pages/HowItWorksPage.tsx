import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Search,
  Calendar,
  Key,
  DollarSign,
  Home,
  Shield,
  MessageSquare,
  CreditCard,
  CheckCircle,
  ArrowRight,
  Users,
  Star,
  Clock,
} from "lucide-react";

const travelerSteps = [
  {
    icon: Search,
    title: "Search & Discover",
    description:
      "Browse thousands of timeshare rentals at world-class resorts by Marriott, Hilton, Wyndham, and more. Filter by location, dates, price, and amenities.",
  },
  {
    icon: Calendar,
    title: "Book Your Dates",
    description:
      "Find availability that works for you. Use flexible dates or pick exact check-in and check-out dates. See real-time pricing and availability.",
  },
  {
    icon: MessageSquare,
    title: "Connect with Owners",
    description:
      "Message hosts directly through our secure platform. Ask questions, confirm details, and finalize your booking with confidence.",
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    description:
      "Pay securely through Rent-A-Vacation. Your payment is protected until you check in, giving you peace of mind.",
  },
  {
    icon: Key,
    title: "Enjoy Your Stay",
    description:
      "Check in at the resort just like any other guest. Enjoy all resort amenities, pools, restaurants, and activities.",
  },
];

const ownerSteps = [
  {
    icon: Home,
    title: "List Your Property",
    description:
      "Create a free listing in minutes. Add photos, details about your unit, set your price and availability calendar.",
  },
  {
    icon: Shield,
    title: "Get Verified",
    description:
      "Our team verifies your ownership documents to build trust with travelers and protect your listing from fraud.",
  },
  {
    icon: MessageSquare,
    title: "Manage Inquiries",
    description:
      "Respond to traveler messages, accept or decline booking requests, and manage your calendar all in one dashboard.",
  },
  {
    icon: CreditCard,
    title: "Receive Bookings",
    description:
      "When a traveler books, you'll be notified immediately. Review the booking details and prepare for your guest.",
  },
  {
    icon: DollarSign,
    title: "Get Paid",
    description:
      "Receive secure payments directly to your bank account. Offset your maintenance fees and earn extra income.",
  },
];

const faqs = [
  {
    question: "Is it really safe to rent from a stranger?",
    answer:
      "Absolutely! All our owners are verified, payments are secured through our platform, and you're protected by our satisfaction guarantee.",
  },
  {
    question: "How much can I save compared to booking directly?",
    answer:
      "On average, our travelers save 50-70% compared to booking the same room directly through the resort.",
  },
  {
    question: "What if something goes wrong with my booking?",
    answer:
      "Our customer support team is available 24/7. If there's any issue, we'll work to resolve it or provide a full refund.",
  },
  {
    question: "Can I really access all resort amenities?",
    answer:
      "Yes! When you rent a timeshare, you're a guest of the owner and have full access to all resort amenities just like any other guest.",
  },
];

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-warm">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            How Rent-A-Vacation Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you're looking to book an amazing vacation or earn from your
            timeshare, we make it simple, secure, and rewarding.
          </p>
        </div>
      </section>

      {/* For Travelers */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              For Travelers
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Book Your Dream Vacation
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Save up to 70% on luxury resort stays by renting directly from timeshare owners
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {travelerSteps.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {index < travelerSteps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 w-6 h-6 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/rentals">
              <Button size="lg">
                Browse Rentals
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Owners */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-accent/20 text-accent-foreground rounded-full text-sm font-medium mb-4">
              For Owners
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Earn From Your Timeshare
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Turn your unused weeks into income. Offset maintenance fees and more.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {ownerSteps.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-accent" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {index < ownerSteps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 w-6 h-6 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/list-property">
              <Button size="lg" variant="outline">
                List Your Property
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <Users className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="text-4xl font-bold mb-1">50,000+</div>
              <div className="opacity-80">Happy Travelers</div>
            </div>
            <div>
              <Home className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="text-4xl font-bold mb-1">10,000+</div>
              <div className="opacity-80">Properties Listed</div>
            </div>
            <div>
              <Star className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="text-4xl font-bold mb-1">4.8/5</div>
              <div className="opacity-80">Average Rating</div>
            </div>
            <div>
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="text-4xl font-bold mb-1">24/7</div>
              <div className="opacity-80">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-card rounded-xl p-6 shadow-card">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/faq">
              <Button variant="link">View All FAQs →</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorksPage;
