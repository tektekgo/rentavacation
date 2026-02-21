import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MyListingsTable } from '../MyListingsTable';
import type { OwnerListingRow } from '@/types/ownerDashboard';

vi.mock('@/components/fair-value/ListingFairValueBadge', () => ({
  ListingFairValueBadge: ({ listingId }: { listingId: string }) => (
    <span data-testid={`fv-badge-${listingId}`}>FV</span>
  ),
}));

const mockListings: OwnerListingRow[] = [
  {
    id: 'l1',
    property_name: 'Orlando, FL',
    resort_name: 'Marriott Grande Vista',
    check_in_date: '2026-04-15',
    check_out_date: '2026-04-22',
    status: 'active',
    final_price: 1200,
    owner_price: 1000,
    open_for_bidding: true,
    bid_count: 3,
    highest_bid: 900,
    days_until_checkin: 45,
  },
  {
    id: 'l2',
    property_name: 'Maui, HI',
    resort_name: 'Westin Nanea',
    check_in_date: '2026-05-10',
    check_out_date: '2026-05-17',
    status: 'draft',
    final_price: 2500,
    owner_price: 2200,
    open_for_bidding: false,
    bid_count: 0,
    highest_bid: null,
    days_until_checkin: 70,
  },
];

function renderTable(listings?: OwnerListingRow[], isLoading = false) {
  return render(
    <MemoryRouter>
      <MyListingsTable listings={listings} isLoading={isLoading} />
    </MemoryRouter>
  );
}

describe('MyListingsTable', () => {
  it('renders loading skeletons when isLoading', () => {
    const { container } = renderTable(undefined, true);
    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0);
  });

  it('renders empty state when no listings', () => {
    renderTable([]);
    expect(screen.getByText(/No listings yet/)).toBeDefined();
  });

  it('renders resort names for listings', () => {
    renderTable(mockListings);
    expect(screen.getByText('Marriott Grande Vista')).toBeDefined();
    expect(screen.getByText('Westin Nanea')).toBeDefined();
  });

  it('renders listing prices', () => {
    renderTable(mockListings);
    expect(screen.getByText('$1,200')).toBeDefined();
    expect(screen.getByText('$2,500')).toBeDefined();
  });

  it('renders bid info for listings with bids', () => {
    renderTable(mockListings);
    expect(screen.getByText(/3 bids/)).toBeDefined();
    expect(screen.getByText(/No bids yet/)).toBeDefined();
  });

  it('shows idle week alert for active listing approaching check-in with no bids', () => {
    const idleListing: OwnerListingRow = {
      ...mockListings[0],
      id: 'idle',
      bid_count: 0,
      highest_bid: null,
      days_until_checkin: 30,
    };
    renderTable([idleListing]);
    expect(screen.getByText(/Consider lowering your price/)).toBeDefined();
  });
});
