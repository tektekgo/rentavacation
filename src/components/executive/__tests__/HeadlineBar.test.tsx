import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock the hooks
vi.mock('@/hooks/executive', () => ({
  useBusinessMetrics: vi.fn(),
  useMarketplaceHealth: vi.fn(),
}));

import { useBusinessMetrics, useMarketplaceHealth } from '@/hooks/executive';
import { HeadlineBar } from '../HeadlineBar';

const mockedUseBiz = vi.mocked(useBusinessMetrics);
const mockedUseHealth = vi.mocked(useMarketplaceHealth);

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

describe('HeadlineBar', () => {
  it('shows loading skeletons when data is loading', () => {
    mockedUseBiz.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useBusinessMetrics>);
    mockedUseHealth.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useMarketplaceHealth>);

    const { container } = render(<HeadlineBar />, { wrapper: Wrapper });
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders 5 KPI pills when data is loaded', () => {
    mockedUseBiz.mockReturnValue({
      data: {
        totalGmv: 100000,
        platformRevenue: 10000,
        activeListings: 25,
        totalOwners: 10,
        totalRenters: 30,
        monthlySignups: 5,
        monthlyData: [],
        bidActivity: [],
        bidSpread: [],
        revenueWaterfall: [],
      },
      isLoading: false,
    } as ReturnType<typeof useBusinessMetrics>);

    mockedUseHealth.mockReturnValue({
      data: {
        liquidityScore: 72,
        liquidityComponents: { bidAcceptanceRate: 0.5, avgTimeToBook: 3, activeListingRatio: 0.7, repeatBookingRate: 0.2 },
        bidAcceptanceRate: 0.5,
        avgBidSpread: 15,
        supplyDemand: [],
        voiceFunnel: { voiceSearches: 50, voiceResultClicks: 30, voiceBookings: 5, traditionalSearches: 400, traditionalResultClicks: 120, traditionalBookings: 20 },
        voiceAdoptionRate: 0.12,
      },
      isLoading: false,
    } as ReturnType<typeof useMarketplaceHealth>);

    render(<HeadlineBar />, { wrapper: Wrapper });

    expect(screen.getByText('GMV')).toBeDefined();
    expect(screen.getByText('Revenue')).toBeDefined();
    expect(screen.getByText('Listings')).toBeDefined();
    expect(screen.getByText('Liquidity')).toBeDefined();
    expect(screen.getByText('Voice')).toBeDefined();
  });

  it('displays formatted values', () => {
    mockedUseBiz.mockReturnValue({
      data: {
        totalGmv: 102600,
        platformRevenue: 10260,
        activeListings: 23,
        totalOwners: 12,
        totalRenters: 35,
        monthlySignups: 5,
        monthlyData: [],
        bidActivity: [],
        bidSpread: [],
        revenueWaterfall: [],
      },
      isLoading: false,
    } as ReturnType<typeof useBusinessMetrics>);

    mockedUseHealth.mockReturnValue({
      data: {
        liquidityScore: 65,
        liquidityComponents: { bidAcceptanceRate: 0.4, avgTimeToBook: 5, activeListingRatio: 0.6, repeatBookingRate: 0.15 },
        bidAcceptanceRate: 0.4,
        avgBidSpread: 12,
        supplyDemand: [],
        voiceFunnel: { voiceSearches: 89, voiceResultClicks: 40, voiceBookings: 8, traditionalSearches: 700, traditionalResultClicks: 200, traditionalBookings: 35 },
        voiceAdoptionRate: 0.09,
      },
      isLoading: false,
    } as ReturnType<typeof useMarketplaceHealth>);

    render(<HeadlineBar />, { wrapper: Wrapper });

    // GMV should be $103K
    expect(screen.getByText('$103K')).toBeDefined();
    // Revenue should be $10K
    expect(screen.getByText('$10K')).toBeDefined();
    // Listings count
    expect(screen.getByText('23')).toBeDefined();
    // Liquidity score
    expect(screen.getByText('65')).toBeDefined();
  });
});
