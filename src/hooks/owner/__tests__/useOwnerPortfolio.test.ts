import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

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

const { useOwnerPortfolio, usePropertyCalendar } = await import('../useOwnerPortfolio');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useOwnerPortfolio', () => {
  it('fetches portfolio summary via RPC', async () => {
    const portfolio = [
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
    mockRpc.mockResolvedValue({ data: portfolio, error: null });

    const { result } = renderHook(() => useOwnerPortfolio(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRpc).toHaveBeenCalledWith('get_owner_portfolio_summary', { p_owner_id: 'owner-123' });
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].resort_name).toBe('Hilton Hawaiian Village');
  });

  it('handles RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { result } = renderHook(() => useOwnerPortfolio(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('returns empty array for owner with no properties', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useOwnerPortfolio(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('usePropertyCalendar', () => {
  function setupFromMock(resolvedValue: { data: unknown; error: unknown }) {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockResolvedValue(resolvedValue);
    mockFrom.mockReturnValue(chain);
    return chain;
  }

  it('fetches listings for a property', async () => {
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
        status: 'booked',
        nightly_rate: 200,
        final_price: 1400,
      },
    ];
    setupFromMock({ data: listings, error: null });

    const { result } = renderHook(() => usePropertyCalendar('prop-1'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFrom).toHaveBeenCalledWith('listings');
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].status).toBe('active');
  });

  it('does not fetch when propertyId is undefined', () => {
    const { result } = renderHook(() => usePropertyCalendar(undefined), {
      wrapper: createHookWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('handles query error', async () => {
    setupFromMock({ data: null, error: { message: 'Query failed' } });

    const { result } = renderHook(() => usePropertyCalendar('prop-1'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
