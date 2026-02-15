# Testing Guidelines — Rent-A-Vacation

## Test Organization

### File Naming
- Unit/integration tests: `*.test.ts` or `*.test.tsx` (co-located with source)
- E2E tests: `e2e/**/*.spec.ts`
- Visual tests: `e2e/visual/**/*.spec.ts`

### Directory Structure
```
src/
├── lib/
│   ├── cancellation.ts
│   └── cancellation.test.ts      ← unit test
├── hooks/
│   ├── useListings.ts
│   └── useListings.test.ts       ← integration test
├── contexts/
│   ├── AuthContext.tsx
│   └── AuthContext.test.tsx       ← integration test
└── test/
    ├── setup.ts                   ← global setup
    ├── helpers/
    │   ├── render.tsx             ← renderWithProviders
    │   └── supabase-mock.ts       ← supabase mock factory
    └── fixtures/
        ├── listings.ts            ← listing factories
        └── users.ts               ← user/session factories

e2e/
├── smoke/
│   ├── homepage.spec.ts
│   └── rentals.spec.ts
└── visual/
    └── pages.spec.ts              ← Percy snapshots
```

## Test Types

### Unit Tests
For pure functions (utils, calculations, formatters).
- No providers needed
- No mocking required (unless function has dependencies)
- Fast execution

### Integration Tests (Hooks)
For React hooks that interact with Supabase or React Query.
- Use `createHookWrapper()` from `src/test/helpers/render.tsx`
- Mock `@/lib/supabase` with `vi.mock()`
- Test success, empty, and error states

### Component Tests
For components with meaningful logic or user interactions.
- Use `renderWithProviders()` from `src/test/helpers/render.tsx`
- Mock auth context when needed
- Test user-visible behavior, not implementation details

### E2E Tests
For critical user journeys across multiple pages.
- Use Playwright with `localhost:8080`
- Keep tests focused on smoke/happy paths
- Use realistic selectors (roles, text, test IDs)

### Visual Regression Tests
For catching unintended visual changes.
- Use Percy via `@percy/playwright`
- Run only on PRs (CI gated)
- Review diffs in Percy dashboard

## Mocking Patterns

### Supabase Queries
```typescript
const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: { from: (...args) => mockFrom(...args) },
  isSupabaseConfigured: () => true,
}));

// Chain pattern
mockFrom.mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [...], error: null }),
    }),
  }),
});
```

### Auth Context
```typescript
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mockUser(),
    isLoading: false,
    hasRole: (r) => r === "renter",
    // ...
  }),
}));
```

### Fake Timers (for date-dependent tests)
```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());
```

## Qase Integration

Tests are automatically reported to Qase.io when `QASE_MODE=testops` is set (CI only).

- Project code: `RAV`
- Test runs are created per CI run
- No special annotations needed in test files

## Coverage

Coverage is tracked for business logic directories only:
- `src/lib/**` — utility functions, calculations
- `src/hooks/**` — React hooks
- `src/contexts/**` — context providers

Thresholds (enforced in `vitest.config.ts`):
- Statements: 30%
- Branches: 25%
- Functions: 30%
- Lines: 30%

Run `npm run test:coverage` to see the report locally.
