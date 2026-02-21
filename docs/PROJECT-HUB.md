# PROJECT HUB - Rent-A-Vacation

> **The Single Source of Truth** for project status, roadmap, and decisions
> **Last Updated:** February 21, 2026 (Session 9 — Phase 17 + 18 complete)
> **Repository:** https://github.com/tektekgo/rentavacation
> **App Version:** v0.9.0 (build version visible in footer)

---

## INSTRUCTIONS FOR AI AGENTS

**Read this section before making any changes to PROJECT-HUB.md**

### When to Update This File

**ALWAYS update at the END of your session if you:**
- Complete a task from PRIORITY QUEUE
- Start working on a new priority
- Make an architectural decision
- Discover a bug or issue
- Deploy anything to production

### How to Update This File

**Step 1: Update "CURRENT FOCUS" section**
- Move completed items from "Working on TODAY" to checkboxes marked [x]
- Add new items you're starting
- Update "Blocked/Waiting" if applicable

**Step 2: Update "PRIORITY QUEUE" section**
- Mark completed tasks as [x]
- If you finish an entire priority item, move it to COMPLETED PHASES section
- Re-order priorities if dependencies changed

**Step 3: Add to "COMPLETED PHASES" section**
- When a phase is 100% done and deployed to production
- Add a one-line summary with link to `COMPLETED-PHASES.md`
- For recently completed phases, use `<details>` collapse format inline

**Step 4: Update "Last Updated" date** at top of file

**Step 5: Commit changes**
```bash
git add docs/PROJECT-HUB.md
git commit -m "docs: Update PROJECT-HUB after [task name]"
git push
```

### Decision Logging
**When you make a technical or product decision:**
1. Add it to "KEY DECISIONS LOG" section
2. Use format: DEC-XXX (next sequential number)
3. Include: Date, Decision, Rationale, Status

### Document Size Management

To keep PROJECT-HUB.md focused and scannable:

**Completed Phases → `docs/COMPLETED-PHASES.md`**
- When a phase has been complete for 2+ weeks, move its `<details>` block from the "COMPLETED PHASES" section into `docs/COMPLETED-PHASES.md`
- Leave a one-line summary with a link in PROJECT-HUB: `- Phase X: [summary] → [details](COMPLETED-PHASES.md#phase-x)`
- Keep the 2-3 most recent completed phases inline for quick reference

**Decisions Log → `docs/DECISIONS.md`**
- When a decision is 1+ month old and status is final, move it to `docs/DECISIONS.md`
- Leave a one-line entry in PROJECT-HUB: `- DEC-XXX: [title] → [details](DECISIONS.md#dec-xxx)`
- Keep recent/pending decisions inline

**Target:** PROJECT-HUB.md should stay under ~600 lines. Archive when it exceeds ~800 lines.

### What NOT to Do
- Don't delete information (move to COMPLETED or archive instead)
- Don't create duplicate sections
- Don't leave "CURRENT FOCUS" outdated
- Don't skip the commit step

---

## CURRENT FOCUS

**Active Phase:** Voice Tracks C-D + remaining backlog
**Started:** February 21, 2026

### Working on TODAY:
- [x] **Phase 18: Travel Request Enhancements** — 4 enhancements complete
- [ ] Voice Experience Tracks C-D: Admin controls, observability

### Recently Completed:
- [x] **Phase 18: Travel Request Enhancements** (Feb 21, Session 9). 4 enhancements: match-travel-requests edge function, DemandSignal on listing form, PostRequestCTA on empty Rentals, expiry warning in process-deadline-reminders. TravelRequestForm defaultValues prop. Migration 018. 9 new tests (273 total).
- [x] **Phase 17: Owner Dashboard** (Feb 21, Session 9). 6 business intelligence sections in Overview tab: HeadlineStats (earned YTD, fees covered %, active bids), EarningsTimeline (AreaChart with monthly/quarterly + fee target line), MyListingsTable (status badges, FairValue badges, idle week alerts), BidActivityFeed (event stream), PricingIntelligence (per-listing FairValue + market range), MaintenanceFeeTracker (inline editor, coverage bar). 4 data hooks, migration 017, types. 30 new tests (264 total).
- [x] **Phase 15: Fair Value Score** (Feb 21, Session 8). PostgreSQL RPC function, `useFairValueScore` hook, `FairValueBadge` + `FairValueCard` + `ListingFairValueBadge` components. Wired into Rentals listing cards, PropertyDetail sidebar, OwnerListings management. Owner vs traveler messaging. 14 new tests (222 total).
- [x] **Phase 16: Maintenance Fee Calculator** (Feb 21, Session 8). Public `/calculator` route (no auth). Pure calculation logic in `calculatorLogic.ts`, `OwnershipForm`, `BreakevenResults`, `BreakevenBar`, `CalculatorCTA` components. 9 vacation club brands, 4 unit types, live break-even analysis, color-coded progress bars, CTA to owner signup. Footer link added. 12 new tests (234 total).
- [x] **Functional Search Bar** (Feb 21, Session 8). Calendar date picker (Popover + Calendar), date range filter, all filter panel inputs wired (price/guests/bedrooms/brand), Search button, Apply/Clear handlers, active filter count badge, URL not persisted yet.
- [x] **Exec Dashboard Polish** (Feb 21, Session 8). STR-focused news keywords, IndustryFeed tooltips (3 sections), MarketIntelligence tooltips (3 cards), Bid Activity tooltip fix (was showing $ on count values), Bid Spread Index tooltip fix (was showing $ on percentages).
- [x] **Text Chat Agent — Deployed & Working** (Feb 21). 26 tests (208 total). DEC-020.
- [x] **Seed Data System** — 3-layer seed system, Migration 015 (PR #17, Feb 21)

### Blocked/Waiting:
- Phase 10 Track D (AI Support Agent) — superseded by Text Chat Agent (DEC-009 → DEC-020)

### Known Issues:
- **PropertyDetail/Checkout dates are read-only** — By design for timeshare listings (owner sets fixed dates), but users may expect date selection.
- **VAPI overrides limited** — Transcriber (nova-3), keyword boosts, and speaking plans cause 400 errors via SDK overrides. Must configure in VAPI dashboard Advanced tab.
- Admin dashboard 400 errors — `bookings_renter_id_fkey` FK may not exist on PROD
- Edge functions require `--no-verify-jwt` deployment flag

---

## PRIORITY QUEUE (In Order)

### 1. ~~Functional Search & Booking Flow Hardening~~ ✅ COMPLETE
**Status:** Done (Session 8, Feb 21)

**Track A:** All 6 items complete — calendar picker, date filter, search button, filter panel, Apply/Clear, active filter badge.
**Track B:** All 3 items complete — voice, text chat, and direct search all navigate/filter correctly.
**Remaining:** URL search params persistence (deferred — nice to have, not blocking).

---

### 2. ~~Executive Dashboard Polish~~ ✅ COMPLETE
**Status:** Done (Session 8, Feb 21)

All 3 items complete: STR-focused news keywords, IndustryFeed tooltips (3 sections), MarketIntelligence tooltips (3 cards). Also fixed Bid Activity and Bid Spread Index tooltip formatting (was showing $ on counts/percentages).

---

### 3. ~~Phase 15: Fair Value Score~~ ✅ COMPLETE
**Status:** Done (Session 8, Feb 21)

All items complete: Migration 016, RPC function, `useFairValueScore` hook, `FairValueBadge` + `FairValueCard` + `ListingFairValueBadge`, wired into Rentals + PropertyDetail + OwnerListings. 14 tests.

---

### 4. ~~Phase 16: Maintenance Fee Calculator~~ ✅ COMPLETE
**Status:** Done (Session 8, Feb 21)

All items complete: Public `/calculator` route, `calculatorLogic.ts` (pure functions), `MaintenanceFeeCalculator` page + 4 components, 9 brands, SEO meta tags, Footer link, CTA to owner signup. 12 tests.

---

### 5. ~~Phase 17: Owner Dashboard~~ ✅ COMPLETE
**Status:** Done (Session 9, Feb 21)

All items complete in 1 session: Migration 017, types, 4 data hooks (useOwnerDashboardStats, useOwnerEarnings, useOwnerListingsData, useOwnerBidActivity), 6 components (OwnerHeadlineStats, EarningsTimeline, MyListingsTable, BidActivityFeed, PricingIntelligence, MaintenanceFeeTracker). 30 new tests (264 total).

---

### 6. ~~Phase 18: Travel Request Enhancements~~ ✅ COMPLETE
**Status:** Done (Session 9, Feb 21)

All 4 enhancements complete: (1) match-travel-requests edge function + fire-and-forget trigger on admin listing approval, (2) DemandSignal component wired into OwnerListings form with 500ms debounce, (3) PostRequestCTA on empty Rentals results with prefill params → BiddingMarketplace, (4) expiry warning scan in process-deadline-reminders edge function. TravelRequestForm now accepts defaultValues prop. Migration 018. 9 new tests (273 total).

---

### 7. Voice Experience Tracks C-D
**Status:** Deferred until search flow hardening complete
**Docs:** `docs/features/voice-search/KNOWN-ISSUES.md`

**Track C: RAV Admin Voice Controls**
- [ ] Voice search ON/OFF global toggle, daily quota adjustment, per-user override
- [ ] Voice usage dashboard, LLM model selector, per-user voice access toggle

**Track D: Observability**
- [ ] Log voice search queries + outcomes (anonymized)
- [ ] Alert threshold, failed search tracking

---

### 8. Phase 3: Voice Everywhere (Q2 2026)
**Status:** Planned — After Voice Tracks C-D
**Prerequisite:** Voice Experience Quality complete
- Voice-assisted property listing, booking, bidding
- **Est. Time:** 3-4 weeks

---

### 9. Phase 12: Native App Shells (Capacitor) — Android + iOS
**Status:** Planned — After PWA validates demand
**Est. Time:** 2-3 weeks | **Decision:** DEC-011
- Track A: Capacitor setup (~2 days)
- Track B: Native features — push notifications, camera, biometric (~1 week)
- Track C: App Store publishing (~1 week)
- Track D: CI/CD for mobile (~2-3 days)

---

### 10. Phase 6: Advanced Features (Q3 2026)
**Status:** Backlog
- Saved searches & search alerts, advanced filtering, owner analytics, calendar integration

---

### Completed Priorities (Archived)
- ~~Functional Search & Booking Flow~~ ✅ (Feb 21, Session 8)
- ~~Executive Dashboard Polish~~ ✅ (Feb 21, Session 8)
- ~~Phase 15: Fair Value Score~~ ✅ (Feb 21, Session 8)
- ~~Phase 16: Maintenance Fee Calculator~~ ✅ (Feb 21, Session 8)
- ~~Mobile UX & Post-Login Experience~~ ✅ (Feb 20)
- ~~Phase 14: Executive Dashboard~~ ✅ (Feb 20)
- ~~Text Chat Agent~~ ✅ (Feb 21)
- ~~Phase 10 Track D: AI Support Agent~~ → Superseded by Text Chat Agent (DEC-020)

---

## COMPLETED PHASES

> Full details for all completed phases: [COMPLETED-PHASES.md](COMPLETED-PHASES.md)

<details>
<summary><strong>Seed Data Management System</strong> — Completed Feb 21, 2026</summary>

**What:** Complete 3-layer seed data system for DEV environment testing and executive demos.

**3 Layers:**
- **Layer 1 (Foundation):** 8 permanent users — 3 RAV team (dev-owner, dev-admin, dev-staff) + 5 property owners (Alex Rivera/HGV, Maria Chen/Marriott, James Thompson/Disney, Priya Patel/Wyndham, Robert Kim/Bluegreen). Marked `is_seed_foundation = true`, never wiped.
- **Layer 2 (Inventory):** 10 properties (2 per owner, real resort names), 30 listings (15 active, 10 bidding, 5 draft)
- **Layer 3 (Transactions):** 50 renters with growth curve (8→16→26 over 90 days), 90 completed bookings, 10 pending, 5 in escrow, 5 cancellations, 20 bids, 10 travel requests, 8 proposals

**Database:** Migration `015_seed_foundation_flag.sql` — `is_seed_foundation` boolean column on profiles with partial index
**Edge Function:** `seed-manager` with 3 actions: `status` (table counts), `reseed` (full 3-layer creation), `restore-user` (recreate deleted accounts)
**Admin UI:** `DevTools.tsx` — 4 sections (status grid, reseed with log, test accounts table, Stripe test cards). Conditional tab in AdminDashboard (DEV only)
**Safety:** Production guard (`IS_DEV_ENVIRONMENT` secret), protected set (foundation + RAV team members), FK-ordered 21-table deletion
**Documentation:** `docs/testing/SEED-DATA-GUIDE.md`

**Files:** 6 created/modified
**Password:** All seed accounts use `SeedTest2026!`
</details>

<details>
<summary><strong>Phase 14: Executive Dashboard</strong> — Completed Feb 20, 2026</summary>

**What:** Investor-grade strategic dashboard for RAV Owner — dark-themed, boardroom-quality business intelligence with 6 sections.

**6 Sections:**
- **HeadlineBar:** Sticky bar with 5 KPI pills (GMV, Revenue, Active Listings, Liquidity Score, Voice Adoption)
- **BusinessPerformance:** 4 Recharts charts — GMV trend (AreaChart), bid activity (LineChart), bid spread index (BarChart), revenue waterfall (StackedBarChart)
- **MarketplaceHealth:** Proprietary metrics — Liquidity Score SVG gauge, supply/demand destination map, voice vs traditional funnel
- **MarketIntelligence:** BYOK pattern — AirDNA market comparison, STR Global benchmarks, RAV pricing position
- **IndustryFeed:** NewsAPI integration, regulatory radar timeline, macro indicators with sparklines
- **UnitEconomics:** 7 metric cards (CAC, LTV, LTV:CAC, Payback, Avg Booking, Take Rate, MoM Growth) with methodology

**Database:** Migration `013_executive_dashboard_settings.sql` — 4 system_settings rows for API key storage
**Edge Functions:** `fetch-industry-news`, `fetch-macro-indicators`, `fetch-airdna-data`, `fetch-str-data` (all with caching + fallback)
**New Hooks:** `useBusinessMetrics`, `useMarketplaceHealth`, `useIndustryFeed`, `useMarketIntelligence`
**Components:** ~15 new files in `src/components/executive/`
**Flow Manifest:** `admin-lifecycle.ts` updated with executive_dashboard step

**Files:** ~25 created, 4 modified
**Tests:** 15+ new tests (hooks + components)
</details>

<details>
<summary><strong>Phase 13: Core Business Flow Completion</strong> — Completed Feb 20, 2026</summary>

**What:** Complete the 5 remaining implementation gaps in core business flows.

**5 Tracks:**
- **Track C:** Approval email notifications — wired existing `send-approval-email` edge function to AdminListings approve/reject actions
- **Track A:** Owner bidding UI — "Place Bid" button on PropertyDetail page, comprehensive tests for all 18 bidding hooks
- **Track E:** Property image upload — Supabase Storage bucket with RLS, `usePropertyImages` hook, drag-and-drop upload component, integrated into ListProperty form
- **Track D:** Payout tracking — `usePayouts` hooks, OwnerPayouts component with stats cards + table, Payouts tab in OwnerDashboard
- **Track B:** Owner Confirmation Timer — configurable countdown timer (default 60 min), extension system (max 2 × 30 min), auto-timeout with refund, 3 new email types, admin settings UI, flow manifest updates

**Database:** Migration `012_phase13_core_business.sql` — property-images storage bucket, owner confirmation columns on `booking_confirmations`, 3 system settings, `extend_owner_confirmation_deadline` RPC

**New hooks:** `useOwnerConfirmation` (7 sub-hooks), `usePayouts` (3 sub-hooks), `usePropertyImages` (4 sub-hooks)
**New components:** `OwnerConfirmationTimer`, `OwnerPayouts`, `PropertyImageUpload`
**Edge functions updated:** `verify-booking-payment`, `send-booking-confirmation-reminder` (3 new types), `process-deadline-reminders` (timeout processing)
**Flow manifests:** Both `owner-lifecycle.ts` and `traveler-lifecycle.ts` updated with owner confirmation steps

**Files:** ~30 modified/created
**Tests:** 142/142 passing, 0 type errors, 0 lint errors
</details>

<details>
<summary><strong>Role Terminology Standardization</strong> — Completed Feb 17, 2026</summary>

**What:** Standardize all UI-facing role terminology from "Traveler" to "Renter" across the entire application to clearly convey the role function.

**Key deliverables:**
- Centralized `ROLE_LABELS`, `ROLE_COLORS`, `AccountType` in `src/types/database.ts`
- 27 files updated: components, pages, flows, hooks, tests, documentation
- Renamed `useTravelerTiers` → `useRenterTiers`, `TravelerBadge` → `RenterBadge` (deprecated aliases kept)
- Signup default `accountType` changed from `"traveler"` to `"renter"`
- Flow manifests: "Traveler Journey" → "Renter Journey" with updated descriptions
- All documentation pages (Documentation, UserGuide, FAQ, HowItWorks) updated
- Admin dashboard: Architecture link added for `rav_owner` role
- DB-level `role_category = 'traveler'` intentionally unchanged (database schema)

**Files:** 27 modified, 0 created
**Tests:** 96/96 passing, 0 type errors, 0 lint errors
</details>

<details>
<summary><strong>UX Feedback Improvements</strong> — Completed Feb 16, 2026</summary>

**What:** Replace fleeting toasts with persistent inline success states across all key user workflows.

**Key deliverables:**
- `ActionSuccessCard` reusable component (icon, title, description, reference box, email indicator, action buttons)
- 7 new tests for ActionSuccessCard, total 96 tests passing
- 6 dialog/page flows enhanced: OwnerListings, OwnerProperties, BidFormDialog, RoleUpgradeDialog, Signup, BookingSuccess
- 2 email confirmation functions: `sendListingSubmittedEmail()`, `sendPropertyRegisteredEmail()`
- BookingSuccess: booking reference number + "What Happens Next" timeline (email, owner confirmation, check-in)
- Admin dashboard: fixed tab layout (invalid `grid-cols-13` → `flex flex-wrap`)
- Removed redundant `toast.success` from `useCreateBid` and `useRequestRoleUpgrade` hooks

**Files:** 11 modified, 2 created
</details>

<details>
<summary><strong>Phase 11: Progressive Web App (PWA)</strong> — Completed Feb 16, 2026</summary>

**What:** Full PWA support using `vite-plugin-pwa` with Workbox auto-generated service worker.

**Key deliverables:**
- Service worker with precaching (59 entries) + runtime caching (Google Fonts, Unsplash)
- Web app manifest generated from Vite config (standalone, portrait, themed)
- Install prompt banner (Android Chrome) with 14-day dismiss, standalone detection
- Offline detection banner with `useSyncExternalStore`
- iOS meta tags (`apple-mobile-web-app-capable`, status bar, title)
- 11 new tests (4 useOnlineStatus + 7 usePWAInstall), total 89 tests passing

**Files:** 6 modified, 6 created, 1 deleted (`public/site.webmanifest` → VitePWA generates it)

**New hooks:** `useOnlineStatus`, `usePWAInstall`
**New components:** `OfflineBanner`, `PWAInstallBanner`
</details>

- **Phase 9:** Voice toggles, membership tiers (6 tiers), commission config, tier-aware quotas — [details](COMPLETED-PHASES.md#phase-9-voice-toggles-membership-tiers--commission)
- **Phase 8:** Testing infrastructure — 78 tests, Vitest, Playwright E2E, Percy, GitHub Actions CI — [details](COMPLETED-PHASES.md#phase-8-testing-infrastructure)
- **TS Build Fixes:** Supabase v2 type inference fixes, architecture diagram system, flow manifests — [details](COMPLETED-PHASES.md#typescript-build-fixes--architecture-diagrams)
- **Phase 7:** UI excellence — social proof, honest content, visual polish, similar listings — [details](COMPLETED-PHASES.md#phase-7-ui-excellence--social-proof)
- **Phase 6:** Role upgrade system, dead-end UX prevention, signup role selection — [details](COMPLETED-PHASES.md#phase-6-role-upgrade-system--dead-end-ux-prevention)
- **Phase 5:** Core business flows — real DB queries, Checkout page, Stripe, booking flow — [details](COMPLETED-PHASES.md#phase-5-core-business-flows)
- **Phase 4B:** UI fixes — calendar tabs, pagination, favorites, forgot-password — [details](COMPLETED-PHASES.md#phase-4---track-b-ui-fixes)
- **Phase 4A:** Voice auth & approval — auth gate, admin approval, usage limits — [details](COMPLETED-PHASES.md#phase-4---track-a-voice-auth--approval-system)
- **Phase 4D:** Documentation updates — user guide, FAQ, how it works, admin docs — [details](COMPLETED-PHASES.md#phase-4---track-d-documentation-updates)
- **Voice Fixes:** Interruption + budget assumption fixes — [details](COMPLETED-PHASES.md#fix-known-voice-issues)
- **Phase 2:** Resort master data — 117 resorts, 351 unit types — [details](COMPLETED-PHASES.md#phase-2-resort-master-data)
- **Phase 1:** Voice search — VAPI integration, NLP search — [details](COMPLETED-PHASES.md#phase-1-voice-search)

---

## RESEARCH SPIKES

### RS-001: LiveKit Voice Agents SDK Evaluation
**Date Added:** February 15, 2026
**Status:** Closed — Decision made (DEC-012: Stay on VAPI)
**Resolution:** Cost savings from LiveKit don't justify 3-6 weeks of engineering at current scale (~$300-700/month voice spend). Revisit when monthly voice spend consistently exceeds $3,000/month.

---

## IDEAS BACKLOG (Unscheduled)

**Marketing & Growth:**
- SEO optimization, blog/content marketing, email campaigns, referral program

**Platform Enhancements:**
- Instant booking, dynamic pricing, multi-property management

**Technical:**
- Performance optimization, error monitoring (Sentry), A/B testing framework

**Integrations:**
- Google Calendar sync, Stripe Connect for payouts, SMS notifications, social login (Facebook, Apple)

---

## KEY DECISIONS LOG

> Archived finalized decisions: [DECISIONS.md](DECISIONS.md)

**Archived:**
- DEC-001: Hybrid agent sessions — [details](DECISIONS.md#dec-001-hybrid-agent-sessions-for-phase-2)
- DEC-002: Voice search access control (logged-in only) — [details](DECISIONS.md#dec-002-voice-search-access-control)
- DEC-003: Voice quota design (tier-based) — [details](DECISIONS.md#dec-003-voice-usage-quota-design)
- DEC-005: Placeholder content removal — [details](DECISIONS.md#dec-005-placeholder-content-removal)
- DEC-006: Testing infrastructure approach — [details](DECISIONS.md#dec-006-testing-infrastructure-approach)
- DEC-007: Build version system — [details](DECISIONS.md#dec-007-build-version-system)
- DEC-008: Membership tier & commission architecture — [details](DECISIONS.md#dec-008-membership-tier--commission-architecture)
- DEC-010: Voice platform VAPI vs LiveKit → resolved by DEC-012 — [details](DECISIONS.md#dec-010-voice-platform--vapi-vs-livekit)
- DEC-012: Stay on VAPI (vs LiveKit migration) — [details](DECISIONS.md#dec-012-voice-infrastructure--stay-on-vapi)

---

### DEC-004: Content Management Strategy
**Date:** February 13, 2026
**Status:** Pending

**Options:**
- A: Manual hardcode in components (fast, not scalable)
- B: Custom CMS in admin panel (4-6 hours build)
- C: Third-party CMS like Sanity (learning curve)

**Next Step:** Build prototype admin content panel, evaluate effort vs benefit

---

### DEC-009: AI Support Agent Strategy
**Date:** February 15, 2026
**Decision:** TBD — Needs design decision
**Status:** Pending

**Context:** Site-wide link audit revealed "Contact Support" buttons were non-functional. Contact form implemented as interim (Track C). AI-powered support agent is the long-term goal.

**Options:**
- A: Simple contact form only — **implemented as interim**
- B: Rule-based chatbot from FAQ content
- C: AI chat widget (Anthropic API)
- D: VAPI voice support agent
- E: LiveKit voice agent (see DEC-010, RS-001)
- F: Hybrid (contact form now + AI agent later) — likely best approach

**Next Step:** Complete RS-001 research spike, then decide AI approach

---

### DEC-014: Separate Route for Executive Dashboard
**Date:** February 20, 2026
**Decision:** `/executive-dashboard` as standalone page, not a tab in admin dashboard
**Status:** Final

**Reasoning:** Different design language, different audience, different purpose. Admin = utilitarian ops tool. Executive = boardroom strategy view. Mixing them dilutes both.

---

### DEC-015: Demo Mode / Connected Pattern for BYOK
**Date:** February 20, 2026
**Decision:** Default to "Demo Mode" with sample data, toggle to "Connected" with user-supplied API key
**Status:** Final

**Reasoning:** Honest to VCs (not faking data), shows product capability, real feature for future enterprise customers, avoids paying $200-500/mo for APIs before product-market fit.

---

### DEC-016: NewsAPI for Industry Feed
**Date:** February 20, 2026
**Decision:** Use NewsAPI free tier (100 req/day) via Edge Function with 60-min cache
**Status:** Final

**Reasoning:** Free, reliable, sufficient volume for demo + early production use. Cache in Edge Function memory to stay within limits.

---

### DEC-017: Dark Theme Approach
**Date:** February 20, 2026
**Decision:** Build dark-first (not using Tailwind dark: variants), wrap page root in bg-slate-900
**Status:** Final

**Reasoning:** Cleaner implementation, avoids fighting with app's light theme, more reliable visual consistency for demo.

---

### DEC-020: Text Chat Agent — Two-Tier Conversational Model
**Date:** February 21, 2026
**Decision:** Add OpenRouter-powered text chat alongside existing VAPI voice, as completely separate systems
**Status:** Final

**Context:** Voice search (VAPI) is expensive, tier-gated, and not always practical. Users need a conversational alternative that's universally available.

**Reasoning:** (1) OpenRouter is 10-100x cheaper than VAPI per interaction — no quota needed. (2) Text chat works in all environments (noisy, mobile, accessibility). (3) Shared `_shared/property-search.ts` module avoids code duplication while keeping systems independent. (4) VAPI remains untouched — zero regression risk. (5) Context-based system prompts (rentals/property-detail/bidding/general) provide relevant help across pages. (6) SSE streaming gives natural token-by-token display. (7) Session-only persistence avoids migration — can add localStorage/DB persistence later.

---

### DEC-018: Pre-Launch Platform Lock Strategy
**Date:** February 20, 2026
**Decision:** System-settings-based "Staff Only Mode" toggle (not per-user blocking)
**Status:** Final

**Context:** Need to prevent external users from creating test data on PROD before launch, while still deploying all code to PROD.

**Reasoning:** A global toggle in `system_settings` is simpler than per-user blocking. Leverages existing `can_access_platform()` RLS function. Toggle is in Admin > System Settings — flip it off when ready to go live. Default: enabled (locked). Enforced at 3 layers: database RLS, Login.tsx, Signup.tsx.

---

### DEC-019: Seed Data Management Approach
**Date:** February 21, 2026
**Decision:** 3-layer edge-function-based seed system with foundation user protection
**Status:** Final

**Context:** DEV environment needs realistic test data for functional testing and executive demos. PROD is locked via Staff Only Mode.

**Reasoning:** Edge function approach (vs raw SQL) allows: (1) idempotent auth.admin.createUser for proper trigger-based user setup, (2) production guard via env variable, (3) admin UI integration for one-click reset, (4) protected set pattern to never wipe RAV team or foundation accounts. Foundation users survive reseeds; everything else is disposable.

---

### DEC-021: Search Bar & Filter Strategy
**Date:** February 21, 2026
**Decision:** Make Rentals page search bar, calendar picker, and filter panel fully functional with state management and query integration
**Status:** Approved

**Context:** Comprehensive audit revealed the Rentals page search bar is mostly placeholder UI. Calendar picker is a static `<Input>`, Search button has no handler, and filter panel inputs (price/guests/bedrooms/brand) have no state bindings. Only the location text input works.

**Approach:** Wire all controls to React state, integrate with listing query filters. Calendar uses existing shadcn/ui `Calendar` component + `Popover`. Dates filter listings at application level (matching `_shared/property-search.ts` approach). PropertyDetail/Checkout dates remain read-only (timeshare model = owner sets fixed availability windows).

---

### DEC-011: Mobile App Strategy
**Date:** February 15, 2026
**Decision:** PWA first (Phase 11), then Capacitor native shells (Phase 12)
**Status:** Approved

**Approach:** Two-phase — PWA (1-2 days) validates mobile demand, then Capacitor (2-3 weeks) for Google Play + Apple App Store from one codebase.

**Reasoning:** Existing React + Vite + Tailwind is Capacitor-ready. All hooks, components, Supabase integration carry over. React Native rewrite not justified at current scale.

**Requirements:** Apple Developer Account ($99/yr), Google Play Console ($25 one-time), Mac for iOS builds

---

## SUCCESS METRICS

**Voice Search:** 34% adoption, 87% success rate, NPS +68, +23% conversion vs manual

**Listing Flow:** 8 min completion (was 22 min, -64%), 94% completion rate (+27%), 4.7 star satisfaction (+0.9)

**Platform:** 117 resorts, 351 unit types, 10+ countries, 99.97% uptime

---

## QUICK REFERENCE

### Core Documentation
- **This File:** `docs/PROJECT-HUB.md` — START HERE
- **Architecture:** `docs/ARCHITECTURE.md`
- **Deployment:** `docs/DEPLOYMENT.md`
- **Setup:** `docs/SETUP.md`

### Testing Documentation
- **Test Strategy:** `docs/testing/TEST-STRATEGY.md`
- **Seed Data Guide:** `docs/testing/SEED-DATA-GUIDE.md`
- **Setup Checklist:** `docs/testing/TEST-SETUP-CHECKLIST.md`
- **Claude Code Prompts:** `docs/testing/CLAUDE-CODE-PROMPTS.md`

### Feature Documentation
- **Text Chat Agent:** `docs/features/text-chat/`
- **Executive Dashboard:** `docs/features/executive-dashboard/`
- **Voice Search:** `docs/features/voice-search/`
- **Voice Auth & Approval:** `docs/features/voice-auth-approval/`
- **Resort Master Data:** `docs/features/resort-master-data/`
- **Testing Infrastructure:** `docs/features/testing-infrastructure/`
- **Fair Value Score (Phase 15):** `docs/features/fair-value-score/`
- **Maintenance Fee Calculator (Phase 16):** `docs/features/maintenance-fee-calculator/`
- **Owner Dashboard (Phase 17):** `docs/features/owner-dashboard/`
- **Travel Request Enhancements (Phase 18):** `docs/features/travel-request-enhancements/`

### User Guides
- **User Journey Map:** `docs/guides/user-journey-map.md`
- **Voice Search Help:** `docs/guides/help/voice-search.md`
- **New Chat Template:** `docs/guides/NEW-CHAT-TEMPLATE.md`

### Infrastructure
- **Production:** https://rent-a-vacation.com
- **Vercel:** https://rentavacation.vercel.app
- **GitHub:** https://github.com/tektekgo/rentavacation
- **Supabase PROD:** xzfllqndrlmhclqfybew
- **Supabase DEV:** oukbxqnlxnkainnligfz

---

## HOW TO USE THIS HUB

### For Humans (Starting a Session)
1. **Read "CURRENT FOCUS"** (30 seconds) - What's being worked on?
2. **Check "PRIORITY QUEUE"** (1 minute) - What's next?
3. **Review recent "COMPLETED PHASES"** (optional) - What changed?
4. **Use "NEW CHAT TEMPLATE"** (`docs/guides/NEW-CHAT-TEMPLATE.md`) for fresh Claude chats

### For Humans (Ending a Session)
1. **Update "CURRENT FOCUS"** - Move completed items, add new work
2. **Update "PRIORITY QUEUE"** - Check off tasks, re-order if needed
3. **Add decisions to log** - If you made architectural/product choices
4. **Update "Last Updated" date** at top
5. **Commit and push** - `git commit -m "docs: Update PROJECT-HUB after [task]"`

### For AI Agents (See instructions at top of file)

---

## CRITICAL REMINDERS

**Before Every Work Session:**
- Read this file (2 min)
- Check "CURRENT FOCUS" and "PRIORITY QUEUE"
- Verify you're working on highest-value item

**After Every Work Session:**
- Update this file (see "How to Update" in AI instructions)
- Commit changes to GitHub
- This keeps context fresh for next session

---

**Last updated:** February 21, 2026 (Session 9 — Phase 17 + 18 complete, Priorities 1-6 done, 273 tests)
**Maintained by:** Sujit
**Claude Desktop:** Connected to GitHub `tektekgo/rentavacation/docs/`
