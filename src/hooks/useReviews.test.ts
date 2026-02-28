import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

// Mock insert/select chain for mutations
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'reviews') {
        return {
          insert: vi.fn().mockImplementation((data: unknown) => {
            mockInsert(data);
            return {
              select: mockSelect.mockReturnValue({
                single: mockSingle.mockResolvedValue({
                  data: { id: 'review-1', ...(data as object) },
                  error: null,
                }),
              }),
            };
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((_col: string, _val: string) => ({
              eq: vi.fn().mockReturnValue({
                order: mockOrder.mockResolvedValue({
                  data: [
                    {
                      id: 'review-1',
                      booking_id: 'booking-1',
                      rating: 4,
                      title: 'Great stay',
                      body: 'Loved it',
                      is_published: true,
                      created_at: '2026-01-15T00:00:00Z',
                      reviewer: { full_name: 'Jane Doe' },
                    },
                  ],
                  error: null,
                }),
              }),
              maybeSingle: mockMaybeSingle.mockResolvedValue({
                data: { id: 'review-1' },
                error: null,
              }),
            })),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    }),
    rpc: vi.fn().mockResolvedValue({
      data: [
        {
          avg_rating: 4.2,
          review_count: 10,
          avg_cleanliness: 4.5,
          avg_accuracy: 4.0,
          avg_communication: 4.3,
          avg_location: 4.8,
          avg_value: 3.9,
        },
      ],
      error: null,
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
  isSupabaseConfigured: () => true,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
  }),
}));

const { usePropertyReviews, usePropertyReviewSummary, useBookingReview, useSubmitReview } =
  await import('./useReviews');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePropertyReviews', () => {
  it('fetches reviews for a property', async () => {
    const { result } = renderHook(() => usePropertyReviews('prop-1'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].title).toBe('Great stay');
  });

  it('is disabled when propertyId is undefined', () => {
    const { result } = renderHook(() => usePropertyReviews(undefined), {
      wrapper: createHookWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('usePropertyReviewSummary', () => {
  it('fetches review summary via RPC', async () => {
    const { result } = renderHook(() => usePropertyReviewSummary('prop-1'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      avg_rating: 4.2,
      review_count: 10,
      avg_cleanliness: 4.5,
      avg_accuracy: 4.0,
      avg_communication: 4.3,
      avg_location: 4.8,
      avg_value: 3.9,
    });
  });

  it('is disabled when propertyId is undefined', () => {
    const { result } = renderHook(() => usePropertyReviewSummary(undefined), {
      wrapper: createHookWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useBookingReview', () => {
  it('checks if a review exists for a booking', async () => {
    const { result } = renderHook(() => useBookingReview('booking-1'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 'review-1' });
  });

  it('is disabled when bookingId is undefined', () => {
    const { result } = renderHook(() => useBookingReview(undefined), {
      wrapper: createHookWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useSubmitReview', () => {
  it('submits a review with correct data', async () => {
    const { result } = renderHook(() => useSubmitReview(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      booking_id: 'booking-1',
      listing_id: 'listing-1',
      property_id: 'prop-1',
      reviewer_id: 'user-123',
      owner_id: 'owner-1',
      rating: 5,
      title: 'Amazing stay',
      body: 'Would come back again',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockInsert).toHaveBeenCalledWith({
      booking_id: 'booking-1',
      listing_id: 'listing-1',
      property_id: 'prop-1',
      reviewer_id: 'user-123',
      owner_id: 'owner-1',
      rating: 5,
      title: 'Amazing stay',
      body: 'Would come back again',
    });
  });

  it('handles insert error', async () => {
    // Override to return error
    vi.mocked(await import('@/lib/supabase')).supabase.from = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Duplicate review' },
          }),
        }),
      }),
    }) as ReturnType<typeof vi.fn>;

    const { result } = renderHook(() => useSubmitReview(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      booking_id: 'booking-2',
      listing_id: 'listing-2',
      property_id: 'prop-2',
      reviewer_id: 'user-123',
      owner_id: 'owner-2',
      rating: 3,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Duplicate review');
  });
});
