import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CalculatorCTA() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-8 text-center space-y-4">
      <h2 className="text-2xl font-bold">Ready to start earning?</h2>
      <p className="text-blue-100 max-w-md mx-auto">
        List your first week in under 10 minutes. No commitment — cancel anytime.
      </p>

      <Button
        asChild
        size="lg"
        className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8"
      >
        <Link to="/auth?mode=signup&role=property_owner">
          Create Free Owner Account <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80 pt-2">
        <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5" /> No listing fees</span>
        <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5" /> 10% fee only on bookings</span>
        <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5" /> You control pricing</span>
      </div>
    </div>
  );
}
