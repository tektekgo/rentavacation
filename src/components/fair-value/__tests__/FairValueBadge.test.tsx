import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FairValueBadge } from '../FairValueBadge';

describe('FairValueBadge', () => {
  it('renders green badge for fair_value tier', () => {
    render(<FairValueBadge tier="fair_value" />);
    expect(screen.getByText('Fair Price')).toBeInTheDocument();
    const badge = screen.getByText('Fair Price').closest('span');
    expect(badge?.className).toContain('emerald');
  });

  it('renders amber badge for below_market tier', () => {
    render(<FairValueBadge tier="below_market" />);
    expect(screen.getByText('Great Deal')).toBeInTheDocument();
    const badge = screen.getByText('Great Deal').closest('span');
    expect(badge?.className).toContain('amber');
  });

  it('renders red badge for above_market tier', () => {
    render(<FairValueBadge tier="above_market" />);
    expect(screen.getByText('Above Market')).toBeInTheDocument();
    const badge = screen.getByText('Above Market').closest('span');
    expect(badge?.className).toContain('red');
  });

  it('returns null for insufficient_data tier', () => {
    const { container } = render(<FairValueBadge tier="insufficient_data" />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when tier is undefined', () => {
    const { container } = render(<FairValueBadge tier={undefined} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows loading skeleton when isLoading is true', () => {
    const { container } = render(<FairValueBadge tier={undefined} isLoading />);
    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });
});
