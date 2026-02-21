import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MaintenanceFeeTracker } from '../MaintenanceFeeTracker';

// Mock the update hook
vi.mock('@/hooks/owner/useOwnerDashboardStats', () => ({
  useUpdateMaintenanceFees: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

function renderTracker(annualFees: number | null, totalEarnedYtd: number) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MaintenanceFeeTracker annualFees={annualFees} totalEarnedYtd={totalEarnedYtd} />
    </QueryClientProvider>
  );
}

describe('MaintenanceFeeTracker', () => {
  it('shows prompt to enter fees when annualFees is null', () => {
    renderTracker(null, 0);
    expect(screen.getByText(/Enter your annual maintenance fees/)).toBeDefined();
    expect(screen.getByPlaceholderText('2,800')).toBeDefined();
  });

  it('shows tracker with fee data when fees are set', () => {
    renderTracker(2800, 1500);
    expect(screen.getByText('$2,800')).toBeDefined();
    expect(screen.getByText('$1,500')).toBeDefined();
  });

  it('shows negative remaining when fees exceed earnings', () => {
    renderTracker(2800, 1500);
    // Net = 1500 - 2800 = -1300
    // Component renders: ${netEarnings.toLocaleString()} → $-1,300
    expect(screen.getByText(/\$-?1,300/)).toBeDefined();
    expect(screen.getByText('Remaining to cover')).toBeDefined();
  });

  it('shows positive net earnings when earned exceeds fees', () => {
    renderTracker(2000, 3500);
    // Net = 3500 - 2000 = +1500
    expect(screen.getByText('+$1,500')).toBeDefined();
    expect(screen.getByText('Net earnings after fees')).toBeDefined();
  });

  it('shows "Fees fully covered!" when coverage >= 100%', () => {
    renderTracker(2000, 3000);
    expect(screen.getByText('Fees fully covered!')).toBeDefined();
  });

  it('shows coverage percentage', () => {
    renderTracker(2000, 1000);
    // 1000/2000 = 50%
    expect(screen.getByText('50% covered')).toBeDefined();
  });

  it('shows edit button when fees are set', () => {
    renderTracker(2800, 0);
    expect(screen.getByText('Edit')).toBeDefined();
  });

  it('enters editing mode on Edit click', () => {
    renderTracker(2800, 0);
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByText('Save')).toBeDefined();
    expect(screen.getByText('Cancel')).toBeDefined();
  });
});
