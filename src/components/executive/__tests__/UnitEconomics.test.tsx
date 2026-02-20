import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock the hook
vi.mock('@/hooks/executive', () => ({
  useBusinessMetrics: vi.fn(),
}));

import { useBusinessMetrics } from '@/hooks/executive';
import { UnitEconomics } from '../UnitEconomics';

const mockedUseBiz = vi.mocked(useBusinessMetrics);

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TooltipProvider>{children}</TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('UnitEconomics', () => {
  beforeEach(() => {
    mockedUseBiz.mockReturnValue({
      data: {
        totalGmv: 100000,
        platformRevenue: 10000,
        activeListings: 20,
        totalOwners: 10,
        totalRenters: 30,
        monthlySignups: 5,
        monthlyData: [
          { month: 'Jan 26', gmv: 40000, revenue: 4000, bookings: 8 },
          { month: 'Feb 26', gmv: 60000, revenue: 6000, bookings: 12 },
        ],
        bidActivity: [],
        bidSpread: [],
        revenueWaterfall: [],
      },
      isLoading: false,
    } as ReturnType<typeof useBusinessMetrics>);
  });

  it('renders all 7 metric cards', () => {
    render(<UnitEconomics />, { wrapper: Wrapper });

    expect(screen.getByText('CAC')).toBeDefined();
    expect(screen.getByText('LTV')).toBeDefined();
    expect(screen.getByText('LTV:CAC')).toBeDefined();
    expect(screen.getByText('Payback')).toBeDefined();
    expect(screen.getByText('Avg Booking')).toBeDefined();
    expect(screen.getByText('Take Rate')).toBeDefined();
    expect(screen.getByText('MoM Growth')).toBeDefined();
  });

  it('shows expandable methodology section', () => {
    render(<UnitEconomics />, { wrapper: Wrapper });

    const methodologyBtn = screen.getByText('Calculation methodology');
    expect(methodologyBtn).toBeDefined();

    // Initially hidden
    expect(screen.queryByText(/Estimated at \$45/)).toBeNull();

    // Click to expand
    fireEvent.click(methodologyBtn);
    expect(screen.getByText(/Estimated at \$45/)).toBeDefined();
  });

  it('calculates take rate as 10%', () => {
    render(<UnitEconomics />, { wrapper: Wrapper });

    // Take rate should be 10% (10000/100000)
    expect(screen.getByText('10.0%')).toBeDefined();
  });

  it('shows positive MoM growth with plus sign', () => {
    render(<UnitEconomics />, { wrapper: Wrapper });

    // MoM growth = (60000 - 40000) / 40000 * 100 = 50%
    expect(screen.getByText('+50.0%')).toBeDefined();
  });
});
