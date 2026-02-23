import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calculator, ArrowRight } from "lucide-react";

const CalculatorCTA = () => {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="text-primary text-sm font-medium">Free Calculator</span>
          </div>

          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Are Your Maintenance Fees Worth It?
          </h2>

          <p className="text-lg text-muted-foreground mb-4 max-w-xl mx-auto">
            Find out in 30 seconds — free break-even calculator for timeshare owners.
            No account required.
          </p>

          <p className="text-sm text-muted-foreground mb-8">
            9 brands supported: Hilton, Marriott, Disney, Wyndham, Hyatt &amp; more
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/calculator">
              <Button size="lg" className="gap-2">
                <Calculator className="w-5 h-5" />
                Calculate My Break-Even
              </Button>
            </Link>
            <Link to="/list-property">
              <Button variant="outline" size="lg" className="gap-2">
                List Your Property
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalculatorCTA;
