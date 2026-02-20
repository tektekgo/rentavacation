import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LiquidityGauge } from '../LiquidityGauge';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

describe('LiquidityGauge', () => {
  const defaultComponents = {
    bidAcceptanceRate: 0.5,
    avgTimeToBook: 5,
    activeListingRatio: 0.7,
    repeatBookingRate: 0.2,
  };

  it('displays the score value', () => {
    render(
      <LiquidityGauge score={72} components={defaultComponents} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('72')).toBeDefined();
  });

  it('shows "Healthy" label for score >= 70', () => {
    render(
      <LiquidityGauge score={75} components={defaultComponents} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('Healthy')).toBeDefined();
  });

  it('shows "Moderate" label for score 40-69', () => {
    render(
      <LiquidityGauge score={55} components={defaultComponents} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('Moderate')).toBeDefined();
  });

  it('shows "Low" label for score < 40', () => {
    render(
      <LiquidityGauge score={25} components={defaultComponents} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('Low')).toBeDefined();
  });

  it('displays component breakdown pills', () => {
    render(
      <LiquidityGauge score={60} components={defaultComponents} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('Bid Accept (30%)')).toBeDefined();
    expect(screen.getByText('Time-to-Book (25%)')).toBeDefined();
    expect(screen.getByText('Active Ratio (25%)')).toBeDefined();
    expect(screen.getByText('Repeat Rate (20%)')).toBeDefined();
  });

  it('has the RAV Proprietary badge', () => {
    render(
      <LiquidityGauge score={50} components={defaultComponents} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('RAV Proprietary')).toBeDefined();
  });
});
