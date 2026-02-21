import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { DemandSignal } from '../DemandSignal';

vi.mock('@/lib/supabase', () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
  };
  // Make thenable — resolves to empty data
  Object.assign(chain, Promise.resolve({ data: [], error: null }));

  return {
    supabase: {
      from: vi.fn(() => chain),
    },
    isSupabaseConfigured: () => true,
  };
});

describe('DemandSignal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when destination is empty', () => {
    const { container } = render(
      <DemandSignal destination="" checkInDate="2026-04-15" bedrooms={2} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when checkInDate is empty', () => {
    const { container } = render(
      <DemandSignal destination="Orlando, FL" checkInDate="" bedrooms={2} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when destination and checkInDate are both empty', () => {
    const { container } = render(
      <DemandSignal destination="" checkInDate="" bedrooms={2} />
    );
    expect(container.innerHTML).toBe('');
  });
});
