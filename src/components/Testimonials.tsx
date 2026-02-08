import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Traveler",
    location: "San Francisco, CA",
    avatar: "S",
    rating: 5,
    text: "We saved over $2,000 on our Hawaii vacation! The resort was incredible and the owner was so helpful with tips for the area.",
  },
  {
    name: "James Rodriguez",
    role: "Timeshare Owner",
    location: "Miami, FL",
    avatar: "J",
    rating: 5,
    text: "I've been renting my timeshare for 2 years now. Rent-A-Vacation makes it so easy and I've covered all my maintenance fees plus some.",
  },
  {
    name: "Emily Chen",
    role: "Traveler",
    location: "Seattle, WA",
    avatar: "E",
    rating: 5,
    text: "The booking process was seamless and the communication with the owner was great. We got a 2-bedroom villa for less than a hotel room!",
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Loved by Travelers & Owners
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join thousands of happy users who've discovered the Rent-A-Vacation difference
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 relative"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/20" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>

              {/* Text */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} • {testimonial.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
