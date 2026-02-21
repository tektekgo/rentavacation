import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OwnerHeadlineStats } from '../OwnerHeadlineStats';
import type { OwnerDashboardStats } from '@/types/ownerDashboard';

const mockStats: OwnerDashboardStats = {
  total_earned_ytd: 4500,
  active_listings: 3,
  active_bids: 7,
  annual_maintenance_fees: 2800,
  fees_covered_percent: 160,
};

describe('OwnerHeadlineStats', () => {
  it('renders loading skeletons when isLoading is true', () => {
    const { container } = render(
      <OwnerHeadlineStats stats={undefined} isLoading={true} />
    );
    // Skeleton renders divs with animate-pulse class
    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0);
  });

  it('renders total earned amount', () => {
    render(<OwnerHeadlineStats stats={mockStats} isLoading={false} />);
    expect(screen.getByText('$4,500')).toBeDefined();
  });

  it('renders fees covered percentage', () => {
    render(<OwnerHeadlineStats stats={mockStats} isLoading={false} />);
    expect(screen.getByText('160%')).toBeDefined();
  });

  it('renders active bids count', () => {
    render(<OwnerHeadlineStats stats={mockStats} isLoading={false} />);
    expect(screen.getByText('7')).toBeDefined();
  });

  it('shows "Enter fees" link when fees_covered_percent is null', () => {
    const noFees: OwnerDashboardStats = {
      ...mockStats,
      annual_maintenance_fees: null,
      fees_covered_percent: null,
    };
    render(<OwnerHeadlineStats stats={noFees} isLoading={false} />);
    expect(screen.getByText(/Enter fees/)).toBeDefined();
  });

  it('shows Coming soon for guest rating', () => {
    render(<OwnerHeadlineStats stats={mockStats} isLoading={false} />);
    expect(screen.getByText('Coming soon')).toBeDefined();
  });
});
