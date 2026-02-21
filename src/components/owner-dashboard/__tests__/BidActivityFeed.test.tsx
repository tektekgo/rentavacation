import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BidActivityFeed } from '../BidActivityFeed';
import type { BidEvent } from '@/types/ownerDashboard';

const mockEvents: BidEvent[] = [
  {
    id: 'b1',
    listing_id: 'l1',
    property_name: 'Marriott Grande Vista',
    event_type: 'new_bid',
    amount: 800,
    traveler_initial: 'J',
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: 'b2',
    listing_id: 'l2',
    property_name: 'Westin Nanea',
    event_type: 'accepted',
    amount: 2200,
    traveler_initial: 'M',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
];

function renderFeed(events?: BidEvent[], isLoading = false) {
  return render(
    <MemoryRouter>
      <BidActivityFeed events={events} isLoading={isLoading} />
    </MemoryRouter>
  );
}

describe('BidActivityFeed', () => {
  it('renders loading skeletons when isLoading', () => {
    const { container } = renderFeed(undefined, true);
    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0);
  });

  it('renders empty state when no events', () => {
    renderFeed([]);
    expect(screen.getByText(/No bid activity yet/)).toBeDefined();
  });

  it('renders event labels correctly', () => {
    renderFeed(mockEvents);
    expect(screen.getByText('New bid received')).toBeDefined();
    expect(screen.getByText('Bid accepted')).toBeDefined();
  });

  it('renders property names', () => {
    renderFeed(mockEvents);
    expect(screen.getByText('Marriott Grande Vista')).toBeDefined();
    expect(screen.getByText('Westin Nanea')).toBeDefined();
  });

  it('renders new_bid with traveler initial and amount', () => {
    renderFeed(mockEvents);
    expect(screen.getByText(/Traveler J\. offered \$800/)).toBeDefined();
  });
});
