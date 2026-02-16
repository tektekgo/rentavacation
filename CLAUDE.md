# CLAUDE.md — Rent-A-Vacation AI Agent Instructions

> This file is automatically loaded by Claude Code at session start.  
> It defines mandatory conventions for maintaining code quality and documentation.

---

## Flow Manifest Convention (MANDATORY)

The application uses declarative **Flow Manifests** in `src/flows/` to auto-generate interactive architecture diagrams at `/architecture`. This keeps system documentation synchronized with code without manual Mermaid authoring.

### When to update manifests

You MUST update the relevant manifest in `src/flows/` when:

1. **Adding a new route** in `App.tsx` → Add a step to the appropriate lifecycle manifest
2. **Adding a new page/component** that represents a user-facing workflow step
3. **Adding conditional business logic** (status checks, approval gates) → Add `branches` to the relevant step
4. **Adding a new edge function** → Add it to the `edgeFunctions` array on the relevant step
5. **Adding/modifying database tables** → Update the `tables` array on affected steps

### Manifest structure

Flow manifests live in `src/flows/` with this structure:

```
src/flows/
├── types.ts              # FlowDefinition, FlowStep, FlowBranch types + flowToMermaid()
├── owner-lifecycle.ts    # Property Owner Journey (signup → payout)
├── traveler-lifecycle.ts # Traveler Journey (browse → check-in)
├── admin-lifecycle.ts    # RAV Admin Operations (approvals → financials)
└── index.ts              # Re-exports all flows + allFlows array
```

### Adding a step — example

When adding a new "Verification" step to the owner lifecycle:

```typescript
// In src/flows/owner-lifecycle.ts, add to the steps array:
{
  id: 'new_step_id',
  route: '/the-route',
  label: 'Human-Readable Label',
  component: 'ComponentName',
  tab: 'optional-tab',
  roles: ['property_owner'],
  description: 'What this step does',
  tables: ['affected_tables'],
  edgeFunctions: ['edge-function-name'],
  branches: [
    { condition: 'If approved', targetStepId: 'next_step_id', label: 'Approved' },
    { condition: 'If rejected', targetStepId: 'previous_step_id', label: 'Rejected', edgeStyle: 'dashed' },
  ],
}
```

### Adding a new flow

If creating an entirely new user journey:

1. Create `src/flows/new-flow-name.ts` exporting a `FlowDefinition`
2. Add it to `src/flows/index.ts` in the `allFlows` array
3. The `/architecture` page auto-renders it — no other changes needed

### Schema reference

See `src/flows/types.ts` for the complete TypeScript interfaces:
- `FlowDefinition` — a complete user journey
- `FlowStep` — a single step with route, component, tables, branches
- `FlowBranch` — a conditional edge between steps

### What NOT to do

- ❌ Do NOT hand-author Mermaid strings — the `flowToMermaid()` function generates them
- ❌ Do NOT modify `/architecture` page for content — it reads from manifests
- ❌ Do NOT skip manifest updates when adding routes — the diagram will have orphan gaps

---

## Git Branching & Deployment (MANDATORY)

### Branch Strategy: `dev` → `main`

```
feature/* (optional)
    ↓ PR
  dev   →  Vercel Preview Deploy  →  Supabase DEV
    ↓ PR (release)
  main  →  Vercel Production      →  Supabase PROD
```

### Rules

- **`dev`** is the working branch. All new code goes here first.
- **`main`** is the production branch. Protected — requires PR + 1 review + CI passing.
- **Never push directly to `main`**. Always create a PR from `dev` (or a feature branch).
- Feature branches are optional for small changes but recommended for larger work.
- Local `.env.local` points to **Supabase DEV**.
- Vercel production points to **Supabase PROD**.

### Workflow

1. Work locally on `dev` (or a feature branch off `dev`)
2. Push to `dev` → Vercel creates a preview deploy → test against Supabase DEV
3. When ready for production: create PR `dev` → `main`
4. CI runs, reviewer approves, merge → Vercel auto-deploys to PROD

### Supabase Deployment

- Test migrations on **DEV** first: `npx supabase db push --project-ref oukbxqnlxnkainnligfz`
- Test edge functions on **DEV** first: `npx supabase functions deploy <name> --project-ref oukbxqnlxnkainnligfz`
- Only after staging validation, deploy to **PROD**: `--project-ref xzfllqndrlmhclqfybew`

### Environment References

| Environment | Supabase | Vercel | Branch |
|-------------|----------|--------|--------|
| Local Dev | DEV (`oukb...`) | n/a | `dev` |
| Staging | DEV (`oukb...`) | Preview URL | `dev` |
| Production | PROD (`xzfl...`) | rentavacation.com | `main` |

---

## Project Conventions

### Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (semantic design tokens only — never hardcode colors)
- Supabase (Auth, PostgreSQL with RLS, Edge Functions)
- TanStack React Query v5 for server state

### File Organization
- Pages in `src/pages/` (default exports)
- Components in `src/components/` (named exports, colocated by feature)
- Hooks in `src/hooks/` (custom data hooks)
- Types in `src/types/`
- Flow manifests in `src/flows/`

### Auth & Roles
- RBAC via `user_roles` table (never on profiles)
- Roles: `rav_owner`, `rav_admin`, `rav_staff`, `property_owner`, `renter`
- Use `isRavTeam()` for admin access checks
- Security definer functions prevent RLS recursion

### Edge Functions
- Deploy via Supabase CLI (not in-editor)
- Shared email template in `supabase/functions/_shared/`
- Required secrets: `RESEND_API_KEY`, `STRIPE_SECRET_KEY`

---

## Testing Requirements (MANDATORY)

### Before Completing Any Task

1. **Run tests**: `npm test` — all tests must pass
2. **Run type check**: `npx tsc --noEmit` — no type errors
3. **Run build**: `npm run build` — build must succeed

### When Writing New Code

- **New utility/lib function** → Write unit tests in the same directory (`*.test.ts`)
- **New hook** → Write integration tests with mocked supabase (`*.test.ts`)
- **New component with logic** → Write render tests (`*.test.tsx`)
- **Bug fix** → Write a regression test that fails without the fix

### Test Patterns

```typescript
// Unit test (pure functions)
import { describe, it, expect } from "vitest";
import { myFunction } from "./myModule";

describe("myFunction", () => {
  it("does the expected thing", () => {
    expect(myFunction(input)).toBe(expected);
  });
});

// Hook test (with providers)
import { renderHook, waitFor } from "@testing-library/react";
import { createHookWrapper } from "@/test/helpers/render";

const { result } = renderHook(() => useMyHook(), {
  wrapper: createHookWrapper(),
});
await waitFor(() => expect(result.current.isSuccess).toBe(true));

// Supabase mocking
vi.mock("@/lib/supabase", () => ({
  supabase: { from: vi.fn() },
  isSupabaseConfigured: () => true,
}));
```

### Coverage Thresholds (Enforced by CI)

| Metric     | Minimum |
|------------|---------|
| Statements | 25%     |
| Branches   | 25%     |
| Functions  | 30%     |
| Lines      | 25%     |

Coverage applies to: `src/lib/**`, `src/hooks/**`, `src/contexts/**`

### Test File Locations

| Source | Test |
|--------|------|
| `src/lib/foo.ts` | `src/lib/foo.test.ts` |
| `src/hooks/useFoo.ts` | `src/hooks/useFoo.test.ts` |
| `src/contexts/FooContext.tsx` | `src/contexts/FooContext.test.tsx` |

### Test Helpers Available

- `src/test/helpers/render.tsx` — `renderWithProviders()`, `createHookWrapper()`
- `src/test/helpers/supabase-mock.ts` — `createSupabaseMock()`, `emptyResponse()`, `errorResponse()`
- `src/test/fixtures/listings.ts` — `mockListing()`, `mockListings(count)`
- `src/test/fixtures/users.ts` — `mockUser()`, `mockSession()`, `mockAuthContext()`

### Definition of Done

A task is only done when ALL of the following are true:

- [ ] Feature code is written
- [ ] Tests are written and passing (`npm test`)
- [ ] Types check (`npx tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] No lint errors (`npm run lint`)

### Commands Reference

| Command | Purpose |
|---------|---------|
| `npm test` | Run all unit + integration tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
