import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// Recharts ResponsiveContainer needs ResizeObserver
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock the hooks
vi.mock('@/hooks/executive', () => ({
  useIndustryNews: vi.fn(),
  useMacroIndicators: vi.fn(),
}));

import { useIndustryNews, useMacroIndicators } from '@/hooks/executive';
import { IndustryFeed } from '../IndustryFeed';

const mockedUseNews = vi.mocked(useIndustryNews);
const mockedUseMacro = vi.mocked(useMacroIndicators);

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('IndustryFeed', () => {
  it('shows fallback messages when no data', () => {
    mockedUseNews.mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useIndustryNews>);
    mockedUseMacro.mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useMacroIndicators>);

    render(<IndustryFeed />, { wrapper: Wrapper });

    expect(screen.getByText('No news available. Configure NewsAPI key for live feed.')).toBeDefined();
    expect(screen.getByText('No regulatory alerts at this time.')).toBeDefined();
    expect(screen.getByText('No macro data available.')).toBeDefined();
  });

  it('renders news items when data is loaded', () => {
    mockedUseNews.mockReturnValue({
      data: [
        {
          id: 'test-1',
          title: 'Test News Article',
          source: 'Test Source',
          url: 'https://example.com',
          publishedAt: new Date().toISOString(),
          category: 'industry',
        },
      ],
      isLoading: false,
    } as ReturnType<typeof useIndustryNews>);
    mockedUseMacro.mockReturnValue({
      data: [
        {
          id: 'macro-1',
          label: 'Consumer Sentiment',
          value: 72.6,
          previousValue: 69.4,
          unit: 'index',
          source: 'U. of Michigan',
          updatedAt: new Date().toISOString(),
          trend: 'up' as const,
          sparklineData: [65, 67, 69, 72],
        },
      ],
      isLoading: false,
    } as ReturnType<typeof useMacroIndicators>);

    render(<IndustryFeed />, { wrapper: Wrapper });

    expect(screen.getByText('Test News Article')).toBeDefined();
    expect(screen.getByText('Consumer Sentiment')).toBeDefined();
  });

  it('shows loading skeletons when loading', () => {
    mockedUseNews.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useIndustryNews>);
    mockedUseMacro.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useMacroIndicators>);

    const { container } = render(<IndustryFeed />, { wrapper: Wrapper });
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
