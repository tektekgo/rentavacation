import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

// Mock supabase
const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
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

const {
  useOwnerConfirmationStatus,
  usePendingOwnerConfirmations,
  useConfirmBooking,
  useDeclineBooking,
  useRequestExtension,
  useConfirmationTimerSettings,
  useCountdown,
} = await import('./useOwnerConfirmation');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useOwnerConfirmationStatus', () => {
  it('fetches confirmation status by ID', async () => {
    const confData = {
      id: 'conf-1',
      owner_confirmation_status: 'pending_owner',
      owner_confirmation_deadline: '2026-03-01T12:00:00Z',
      extensions_used: 0,
    };
    mockFrom.mockReturnValue(chain({ data: confData, error: null }));

    const { result } = renderHook(
      () => useOwnerConfirmationStatus('conf-1'),
      { wrapper: createHookWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.owner_confirmation_status).toBe('pending_owner');
    expect(mockFrom).toHaveBeenCalledWith('booking_confirmations');
  });

  it('is idle when ID is undefined', () => {
    const { result } = renderHook(
      () => useOwnerConfirmationStatus(undefined),
      { wrapper: createHookWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('usePendingOwnerConfirmations', () => {
  it('fetches pending confirmations for current owner', async () => {
    const pendingData = [
      { id: 'conf-1', owner_confirmation_status: 'pending_owner' },
      { id: 'conf-2', owner_confirmation_status: 'pending_owner' },
    ];
    mockFrom.mockReturnValue(chain({ data: pendingData, error: null }));

    const { result } = renderHook(
      () => usePendingOwnerConfirmations(),
      { wrapper: createHookWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });
});

describe('useConfirmBooking', () => {
  it('updates status to owner_confirmed', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null }));

    const { result } = renderHook(
      () => useConfirmBooking(),
      { wrapper: createHookWrapper() }
    );

    await act(async () => {
      result.current.mutate('conf-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('booking_confirmations');
  });
});

describe('useDeclineBooking', () => {
  it('updates status to owner_declined', async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null }));

    const { result } = renderHook(
      () => useDeclineBooking(),
      { wrapper: createHookWrapper() }
    );

    await act(async () => {
      result.current.mutate('conf-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useRequestExtension', () => {
  it('calls the extend_owner_confirmation_deadline RPC', async () => {
    mockRpc.mockResolvedValue({
      data: { success: true, new_deadline: '2026-03-01T13:00:00Z', extensions_used: 1, max_extensions: 2 },
      error: null,
    });

    const { result } = renderHook(
      () => useRequestExtension(),
      { wrapper: createHookWrapper() }
    );

    await act(async () => {
      result.current.mutate('conf-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith('extend_owner_confirmation_deadline', {
      p_booking_confirmation_id: 'conf-1',
      p_owner_id: 'owner-1',
    });
  });

  it('throws when RPC returns success: false', async () => {
    mockRpc.mockResolvedValue({
      data: { success: false, error: 'Maximum extensions already used' },
      error: null,
    });

    const { result } = renderHook(
      () => useRequestExtension(),
      { wrapper: createHookWrapper() }
    );

    await act(async () => {
      result.current.mutate('conf-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useConfirmationTimerSettings', () => {
  it('returns default settings from system_settings table', async () => {
    mockFrom.mockReturnValue(chain({
      data: [
        { setting_key: 'owner_confirmation_window_minutes', setting_value: { value: 60 } },
        { setting_key: 'owner_confirmation_extension_minutes', setting_value: { value: 30 } },
        { setting_key: 'owner_confirmation_max_extensions', setting_value: { value: 2 } },
      ],
      error: null,
    }));

    const { result } = renderHook(
      () => useConfirmationTimerSettings(),
      { wrapper: createHookWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.windowMinutes).toBe(60);
    expect(result.current.data?.extensionMinutes).toBe(30);
    expect(result.current.data?.maxExtensions).toBe(2);
  });
});

describe('useCountdown', () => {
  it('returns expired when deadline is in the past', () => {
    const { result } = renderHook(
      () => useCountdown('2020-01-01T00:00:00Z'),
      { wrapper: createHookWrapper() }
    );

    expect(result.current.expired).toBe(true);
    expect(result.current.hours).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(0);
  });

  it('returns expired when deadline is null', () => {
    const { result } = renderHook(
      () => useCountdown(null),
      { wrapper: createHookWrapper() }
    );

    expect(result.current.expired).toBe(true);
  });

  it('returns time left when deadline is in the future', () => {
    const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
    const { result } = renderHook(
      () => useCountdown(futureDate),
      { wrapper: createHookWrapper() }
    );

    expect(result.current.expired).toBe(false);
    expect(result.current.hours).toBeGreaterThanOrEqual(1);
  });
});
