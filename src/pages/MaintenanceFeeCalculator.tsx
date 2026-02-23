import { useState, useEffect } from 'react';
import { Calculator, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePageMeta } from '@/hooks/usePageMeta';
import { OwnershipForm } from '@/components/calculator/OwnershipForm';
import { BreakevenResults } from '@/components/calculator/BreakevenResults';
import { CalculatorCTA } from '@/components/calculator/CalculatorCTA';
import {
  calculateBreakeven,
  type CalculatorInputs,
  type CalculatorResult,
} from '@/lib/calculatorLogic';
import { supabase } from '@/lib/supabase';

export default function MaintenanceFeeCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    brand: '',
    unitType: '',
    annualMaintenanceFees: 0,
    weeksOwned: 1,
  });
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [ownerCount, setOwnerCount] = useState<number | null>(null);

  // Live calculation on input change
  useEffect(() => {
    setResult(calculateBreakeven(inputs));
  }, [inputs]);

  // Fetch owner count for social proof
  useEffect(() => {
    supabase
      .from('user_roles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'property_owner')
      .then(({ count }) => {
        if (count != null && count > 0) setOwnerCount(count);
      });
  }, []);

  usePageMeta(
    'Timeshare Maintenance Fee Calculator',
    'Calculate how many weeks you need to rent your timeshare to cover annual maintenance fees. Free tool for Hilton, Marriott, Disney, Wyndham owners.'
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20">
        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Calculator className="h-4 w-4" />
              Free Calculator
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Will renting your timeshare cover your maintenance fees?
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find out in 30 seconds — free, no account needed
            </p>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <OwnershipForm inputs={inputs} onChange={setInputs} />
            <BreakevenResults result={result} />
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-10">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {ownerCount
                ? `Join ${ownerCount} owners already earning on RAV`
                : 'Join hundreds of owners already earning on RAV'}
            </span>
          </div>

          {/* CTA */}
          <CalculatorCTA />
        </div>
      </main>

      <Footer />
    </div>
  );
}
