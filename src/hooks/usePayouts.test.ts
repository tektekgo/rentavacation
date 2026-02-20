import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

// Mock supabase
const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
  isSupabaseConfigured: () => true,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'owner-1' } }),
}));

// Chain helper
function chain(resolvedValue: { data: unknown; error: unknown }) {
  const c: Record<string, unknown> = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'in', 'order', 'limit', 'single',
  ];
  for (const m of methods) {
    c[m] = vi.fn().mockReturnValue(c);
  }
  Object.assign(c, { then: (_resolve: (v: unknown) => void) => _resolve(resolvedValue) });
  return Object.assign(Promise.resolve(resolvedValue), c);
}

const { useOwnerPayouts, useMarkPayoutProcessed, useOwnerPayoutStats } = await import('./usePayouts');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useOwnerPayouts', () => {
  it('returns owner payout history', async () => {
    // First call: get listing IDs
    const listingsChain = chain({ data: [{ id: 'l1' }, { id: 'l2' }], error: null });
    // Second call: get bookings
    const bookingsChain = chain({
      data: [
        {
          id: 'b1',
          listing_id: 'l1',
          status: 'confirmed',
          owner_payout: 800,
          payout_status: null,
          payout_amount: null,
          payout_date: null,
          payout_reference: null,
          created_at: '2026-02-01',
          listing: { check_in_date: '2026-03-01', check_out_date: '2026-03-07', property: { resort_name: 'Test Resort', location: 'Orlando' } },
          renter: { full_name: 'Jane Doe', email: 'jane@test.com' },
        },
      ],
      error: null,
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? listingsChain : bookingsChain;
    });

    const { result } = renderHook(() => useOwnerPayouts(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].owner_payout).toBe(800);
  });

  it('returns empty array when owner has no listings', async () => {
    mockFrom.mockReturnValue(chain({ data: [], error: null }));

    const { result } = renderHook(() => useOwnerPayouts(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(0);
  });
});

describe('useMarkPayoutProcessed', () => {
  it('marks a payout as processed', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null }));

    const { result } = renderHook(() => useMarkPayoutProcessed(), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        bookingId: 'b1',
        payoutReference: 'ZELLE-12345',
        payoutAmount: 800,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('bookings');
  });
});

describe('useOwnerPayoutStats', () => {
  it('calculates stats correctly', async () => {
    const listingsChain = chain({ data: [{ id: 'l1' }], error: null });
    const bookingsChain = chain({
      data: [
        { id: 'b1', status: 'confirmed', owner_payout: 500, payout_status: null, payout_amount: null },
        { id: 'b2', status: 'completed', owner_payout: 800, payout_status: 'processed', payout_amount: 800 },
      ],
      error: null,
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount <= 1 ? listingsChain : bookingsChain;
    });

    const { result } = renderHook(() => useOwnerPayoutStats(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.pendingAmount).toBe(500);
    expect(result.current.processedAmount).toBe(800);
    expect(result.current.pendingCount).toBe(1);
    expect(result.current.completedCount).toBe(1);
  });
});
