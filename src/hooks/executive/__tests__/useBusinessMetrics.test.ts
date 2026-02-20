import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
  isSupabaseConfigured: () => true,
}));

describe('useBusinessMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty metrics when supabase returns no data', async () => {
    const { useBusinessMetrics } = await import('../useBusinessMetrics');

    const { result } = renderHook(() => useBusinessMetrics(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.totalGmv).toBe(0);
    expect(result.current.data?.platformRevenue).toBe(0);
    expect(result.current.data?.activeListings).toBe(0);
  });
});
