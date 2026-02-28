import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { PortfolioProperty } from '@/hooks/owner/useOwnerPortfolio';

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
  isSupabaseConfigured: () => true,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'owner-123' },
  }),
}));

const PortfolioOverview = (await import('../PortfolioOverview')).default;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

const mockPortfolio: PortfolioProperty[] = [
  {
    property_id: 'prop-1',
    resort_name: 'Hilton Hawaiian Village',
    location: 'Honolulu, HI',
    brand: 'hilton_grand_vacations',
    listing_count: 5,
    active_listing_count: 2,
    total_revenue: 8500,
    total_bookings: 4,
    avg_nightly_rate: 185,
  },
  {
    property_id: 'prop-2',
    resort_name: 'Marriott Ko Olina',
    location: 'Kapolei, HI',
    brand: 'marriott_vacations',
    listing_count: 3,
    active_listing_count: 1,
    total_revenue: 4200,
    total_bookings: 2,
    avg_nightly_rate: 210,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PortfolioOverview', () => {
  it('shows loading skeletons while fetching', () => {
    mockRpc.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<PortfolioOverview />, { wrapper: createWrapper() });
    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0);
  });

  it('shows empty state when no properties', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    render(<PortfolioOverview />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No properties yet')).toBeDefined();
    });
  });

  it('renders property cards with correct data', async () => {
    mockRpc.mockResolvedValue({ data: mockPortfolio, error: null });
    render(<PortfolioOverview />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Hilton Hawaiian Village')).toBeDefined();
    });
    expect(screen.getByText('Marriott Ko Olina')).toBeDefined();
    expect(screen.getByText('Honolulu, HI')).toBeDefined();
    expect(screen.getByText('Kapolei, HI')).toBeDefined();
  });

  it('renders summary stats correctly', async () => {
    mockRpc.mockResolvedValue({ data: mockPortfolio, error: null });
    render(<PortfolioOverview />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Total revenue = 8500 + 4200 = 12700
      expect(screen.getByText('$12,700')).toBeDefined();
    });
    // Total properties = 2 (may appear multiple times due to card stats too)
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    // Active listings = 2 + 1 = 3
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
  });

  it('shows Show Calendar button on property cards', async () => {
    mockRpc.mockResolvedValue({ data: mockPortfolio, error: null });
    render(<PortfolioOverview />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText('Show Calendar')).toHaveLength(2);
    });
  });

  it('expands calendar on click', async () => {
    mockRpc.mockResolvedValue({ data: mockPortfolio, error: null });
    // Set up mockFrom for the PropertyCalendar's usePropertyCalendar hook
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    render(<PortfolioOverview />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText('Show Calendar')).toHaveLength(2);
    });

    // Click the first Show Calendar button
    fireEvent.click(screen.getAllByText('Show Calendar')[0]);

    await waitFor(() => {
      expect(screen.getByText('Hide Calendar')).toBeDefined();
    });
  });

  it('displays brand badges', async () => {
    mockRpc.mockResolvedValue({ data: mockPortfolio, error: null });
    render(<PortfolioOverview />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('hilton grand vacations')).toBeDefined();
    });
    expect(screen.getByText('marriott vacations')).toBeDefined();
  });
});
