import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

const mockInvoke = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
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

const { useRequestDeletion, useCancelDeletion, useExportUserData } =
  await import('./useAccountDeletion');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useRequestDeletion', () => {
  it('calls delete-user-account with request action', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, action: 'deletion_requested', scheduled_for: '2026-03-12T00:00:00Z', grace_period_days: 14 },
      error: null,
    });

    const { result } = renderHook(() => useRequestDeletion(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate('Not using the service');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockInvoke).toHaveBeenCalledWith('delete-user-account', {
      body: { action: 'request', reason: 'Not using the service' },
    });
    expect(result.current.data?.scheduled_for).toBe('2026-03-12T00:00:00Z');
  });

  it('handles request failure', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: false, error: 'Request failed' },
      error: null,
    });

    const { result } = renderHook(() => useRequestDeletion(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Request failed');
  });

  it('handles edge function error', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Network error' },
    });

    const { result } = renderHook(() => useRequestDeletion(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCancelDeletion', () => {
  it('calls delete-user-account with cancel action', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, action: 'deletion_cancelled' },
      error: null,
    });

    const { result } = renderHook(() => useCancelDeletion(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockInvoke).toHaveBeenCalledWith('delete-user-account', {
      body: { action: 'cancel' },
    });
  });
});

describe('useExportUserData', () => {
  it('calls export-user-data edge function and triggers download', async () => {
    const mockData = {
      export_metadata: { exported_at: '2026-02-26', user_id: 'user-123' },
      profile: { full_name: 'Test User' },
      bookings: [],
    };

    mockInvoke.mockResolvedValue({ data: mockData, error: null });

    // Mock URL APIs before rendering
    const origCreateObjectURL = URL.createObjectURL;
    const origRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    URL.revokeObjectURL = vi.fn();

    const { result } = renderHook(() => useExportUserData(), {
      wrapper: createHookWrapper(),
    });

    // Mock anchor element AFTER render so renderHook can use real DOM
    const mockClick = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', click: mockClick } as unknown as HTMLAnchorElement;
      }
      return origCreateElement(tag);
    });
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(null as unknown as Node);
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(null as unknown as Node);

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockInvoke).toHaveBeenCalledWith('export-user-data');
    expect(mockClick).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
    URL.createObjectURL = origCreateObjectURL;
    URL.revokeObjectURL = origRevokeObjectURL;
  });

  it('handles export error', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Export failed' },
    });

    const { result } = renderHook(() => useExportUserData(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
