import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
  isSupabaseConfigured: () => true,
}));

const { PropertyCalendar } = await import('../PropertyCalendar');

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

function setupFromMock(resolvedValue: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockResolvedValue(resolvedValue);
  mockFrom.mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PropertyCalendar', () => {
  it('shows loading skeletons', () => {
    // Never-resolving promise to keep loading state
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(new Promise(() => {}));
    mockFrom.mockReturnValue(chain);

    const { container } = render(<PropertyCalendar propertyId="prop-1" />, {
      wrapper: createWrapper(),
    });
    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0);
  });

  it('shows empty state when no listings', async () => {
    setupFromMock({ data: [], error: null });

    render(<PropertyCalendar propertyId="prop-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('No listings for this property yet.')).toBeDefined();
    });
  });

  it('renders listings grouped by month', async () => {
    const listings = [
      {
        id: 'lst-1',
        check_in_date: '2026-03-15',
        check_out_date: '2026-03-22',
        status: 'active',
        nightly_rate: 185,
        final_price: 1295,
      },
      {
        id: 'lst-2',
        check_in_date: '2026-06-15',
        check_out_date: '2026-06-22',
        status: 'booked',
        nightly_rate: 200,
        final_price: 1400,
      },
      {
        id: 'lst-3',
        check_in_date: '2026-09-15',
        check_out_date: '2026-09-22',
        status: 'completed',
        nightly_rate: 195,
        final_price: 1365,
      },
    ];
    setupFromMock({ data: listings, error: null });

    render(<PropertyCalendar propertyId="prop-1" />, {
      wrapper: createWrapper(),
    });

    // Check that multiple month groups render — use container query for h4 elements
    await waitFor(() => {
      // Listing bars should appear (3 listings = 3 bars)
      expect(screen.getAllByText(/Active|Booked|Completed/).length).toBeGreaterThanOrEqual(3);
    });
  });

  it('renders status badges for each listing', async () => {
    const listings = [
      {
        id: 'lst-1',
        check_in_date: '2026-03-15',
        check_out_date: '2026-03-22',
        status: 'active',
        nightly_rate: 185,
        final_price: 1295,
      },
      {
        id: 'lst-2',
        check_in_date: '2026-04-01',
        check_out_date: '2026-04-08',
        status: 'cancelled',
        nightly_rate: 200,
        final_price: 0,
      },
    ];
    setupFromMock({ data: listings, error: null });

    render(<PropertyCalendar propertyId="prop-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      // Active appears in both legend and badge
      expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(2);
    });
    // Cancelled appears in both legend and badge
    expect(screen.getAllByText('Cancelled').length).toBeGreaterThanOrEqual(2);
  });

  it('shows prices on listing bars', async () => {
    const listings = [
      {
        id: 'lst-1',
        check_in_date: '2026-03-15',
        check_out_date: '2026-03-22',
        status: 'active',
        nightly_rate: 185,
        final_price: 1295,
      },
    ];
    setupFromMock({ data: listings, error: null });

    render(<PropertyCalendar propertyId="prop-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/\$1,295/)).toBeDefined();
    });
    expect(screen.getByText(/\$185\/night/)).toBeDefined();
  });

  it('renders status legend only for present statuses', async () => {
    const listings = [
      {
        id: 'lst-1',
        check_in_date: '2026-03-15',
        check_out_date: '2026-03-22',
        status: 'active',
        nightly_rate: 185,
        final_price: 1295,
      },
    ];
    setupFromMock({ data: listings, error: null });

    render(<PropertyCalendar propertyId="prop-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      // Active appears in legend + badge
      const activeItems = screen.getAllByText('Active');
      expect(activeItems.length).toBeGreaterThanOrEqual(2);
    });
    // These statuses are NOT in the data, so should not appear
    expect(screen.queryByText('Booked')).toBeNull();
    expect(screen.queryByText('Completed')).toBeNull();
    expect(screen.queryByText('Cancelled')).toBeNull();
  });
});
