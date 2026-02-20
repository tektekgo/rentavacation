import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BYOKCard } from '../BYOKCard';

describe('BYOKCard', () => {
  it('shows "Demo Mode" badge when isDemo is true', () => {
    render(
      <BYOKCard title="Test" provider="TestAPI" isDemo={true}>
        <p>Content</p>
      </BYOKCard>
    );
    expect(screen.getByText('Demo Mode')).toBeDefined();
  });

  it('shows "Live" badge when isDemo is false', () => {
    render(
      <BYOKCard title="Test" provider="TestAPI" isDemo={false}>
        <p>Content</p>
      </BYOKCard>
    );
    expect(screen.getByText('Live')).toBeDefined();
  });

  it('shows connect button in demo mode when onConnect is provided', () => {
    const onConnect = vi.fn();
    render(
      <BYOKCard title="Test" provider="AirDNA" isDemo={true} onConnect={onConnect}>
        <p>Content</p>
      </BYOKCard>
    );
    const connectBtn = screen.getByText('Connect AirDNA API');
    expect(connectBtn).toBeDefined();
    fireEvent.click(connectBtn);
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it('does not show connect button when isDemo is false', () => {
    render(
      <BYOKCard title="Test" provider="AirDNA" isDemo={false} onConnect={() => {}}>
        <p>Content</p>
      </BYOKCard>
    );
    expect(screen.queryByText('Connect AirDNA API')).toBeNull();
  });

  it('renders children content', () => {
    render(
      <BYOKCard title="My Card" provider="API" isDemo={true}>
        <p>Child content here</p>
      </BYOKCard>
    );
    expect(screen.getByText('Child content here')).toBeDefined();
    expect(screen.getByText('My Card')).toBeDefined();
  });
});
