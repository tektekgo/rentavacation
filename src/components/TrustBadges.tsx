import { Shield, Users, Star, Gavel, Clock, Award } from "lucide-react";

const badges = [
  {
    icon: Shield,
    value: "100%",
    label: "Direct from Owners",
  },
  {
    icon: Users,
    value: "50,000+",
    label: "Happy Travelers",
  },
  {
    icon: Gavel,
    value: "Open",
    label: "Bidding Marketplace",
  },
  {
    icon: Clock,
    value: "24/7",
    label: "Customer Support",
  },
  {
    icon: Award,
    value: "5,000+",
    label: "Verified Owners",
  },
  {
    icon: Star,
    value: "70%",
    label: "Avg. Savings",
  },
];

const TrustBadges = () => {
  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {badges.map((badge, index) => (
            <div key={index} className="text-center">
              <badge.icon className="w-8 h-8 mx-auto mb-3 opacity-80" />
              <div className="font-display text-2xl md:text-3xl font-bold mb-1">{badge.value}</div>
              <div className="text-sm opacity-80">{badge.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
