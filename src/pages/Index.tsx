import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedResorts from "@/components/FeaturedResorts";
import HowItWorks from "@/components/HowItWorks";
import TrustBadges from "@/components/TrustBadges";
import TopDestinations from "@/components/TopDestinations";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <TrustBadges />
        <FeaturedResorts />
        <HowItWorks />
        <TopDestinations />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
