# PROJECT HUB - Rent-A-Vacation

> **The Single Source of Truth** for project status, roadmap, and decisions
> **Last Updated:** February 20, 2026
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

**Active Phase:** Phase 13 complete. Next: Mobile UX polish + Voice Quality hardening
**Started:** February 20, 2026

### Working on TODAY:
- [x] Phase 13: Core Business Flow Completion (5 tracks) — deployed to DEV + PROD
- [ ] Mobile UX: Post-login welcome experience + mobile screen optimization
- [ ] Voice Experience: Quality fixes & admin controls

### Recently Completed:
- [x] **Phase 13: Core Business Flow Completion** — 5 tracks: approval emails wired to admin UI, bidding UI + Place Bid button, property image upload system, owner payout tracking, owner confirmation timer with configurable deadlines/extensions. Migration 012. 142 tests passing (Feb 20)
- [x] **Role Terminology Standardization** — "Traveler" → "Renter" across 27 files: UI labels, flow manifests, documentation, user guides, admin components. Centralized ROLE_LABELS/ROLE_COLORS in database.ts. Architecture link for rav_owner. 96 tests passing (Feb 17)
- [x] **UX Feedback Improvements** — ActionSuccessCard component, inline success states in 6 dialogs/pages, 2 email confirmations, BookingSuccess "What Happens Next" section, admin dashboard tab layout fix. 96 tests passing (Feb 16)
- [x] **Brand logo update** — new stylized "R" design, old assets archived (Feb 16)
- [x] **CI fully green** — all 4 jobs passing (lint, tests, E2E, Lighthouse), Qase receiving results (Feb 16)
- [x] **58 ESLint errors fixed** — `any` types replaced across 17 files, unblocked CI pipeline (Feb 16)
- [x] **Phase 11: PWA** — service worker, install banner, offline detection, iOS meta tags, 11 new tests (Feb 16)
- [x] **DevOps: Branch strategy** — `dev` → `main` workflow, branch protection, CLAUDE.md documented (Feb 15)
- [x] **Phase 10 Tracks A-C** — dead link fixes, footer consolidation, Contact page + edge function deployed (Feb 15)
- [x] **Phase 9: Voice Toggles, Membership Tiers & Commission** — 5 tracks, 22 files, migration deployed (Feb 14)

### Blocked/Waiting:
- Phase 10 Track D (AI Support Agent) — awaiting design decision (DEC-009)

### Known Issues:
- Admin dashboard console errors (400 Bad Request) — `bookings` table FK constraints (`bookings_renter_id_fkey`) may not exist on PROD. Affects Bookings, Financials, and Escrow tabs. Needs DB migration.

---

## PRIORITY QUEUE (In Order)

### 1. Mobile UX & Post-Login Experience
**Status:** Planned — User feedback driven
**Est. Time:** 2-3 days

**Problem:** User feedback: after logging in on mobile (PWA/browser), the UI doesn't clearly show the user is authenticated. No "Welcome [Name]" or visual confirmation of login state. Mobile screen optimization also needs review.

**Track A: Post-Login Welcome (~1 day)**
- [ ] Show "Welcome, [Name]" greeting in header or dashboard after login
- [ ] Visual login state indicator clearly visible on mobile (avatar, name, or badge)
- [ ] Review auth state transition — ensure no flash of unauthenticated UI

**Track B: Mobile Screen Optimization (~1-2 days)**
- [ ] Audit all key pages on mobile viewport (375px, 390px, 428px)
- [ ] Fix any overflow, truncation, or tap target issues
- [ ] Verify navigation, dialogs, and forms work well on mobile
- [ ] Test PWA standalone mode on iOS Safari + Android Chrome

---

### 2. Voice Experience: Quality & Admin Controls
**Status:** Planned — Pre-Phase 3 prerequisite
**Docs:** `docs/features/voice-search/KNOWN-ISSUES.md`
**Decision:** DEC-012 (Stay on VAPI)
**Goal:** Harden voice experience to premium standard + give RAV admin runtime control

**Track A: Fix Known Quality Issues (~1-2 days)**
- [ ] Duplicate function calls — `search_properties` fires twice in quick succession (race condition)
- [ ] Voice result cards not clickable — results use `<div>` not `<Link>`, users can't navigate to property
- [ ] CORS wildcard on Edge Function — tighten `*` origin to production domain only
- [ ] Add AbortController to Edge Function fetch — prevent dangling requests after user stops voice session
- [ ] Add rate limiting to Edge Function — protect against rapid-fire requests

**Track B: Voice Quality Tuning (~1 week)**
- [ ] Evaluate Deepgram endpointing sweet spot — currently 500ms, test 300ms vs 700ms
- [ ] Add backchanneling config — prevent assistant jumping in during pauses
- [ ] Evaluate transcription model upgrade — Deepgram Nova-2 vs Nova-3 for travel terms
- [ ] Test voice experience on mobile (iOS Safari, Android Chrome) — WebRTC behavior

**Track C: RAV Admin Voice Controls (~1-2 weeks)**
- [ ] Voice search ON/OFF global toggle — disable instantly without code deploy
- [ ] Daily quota adjustment — change limit from admin UI (currently DB-only)
- [ ] Per-user quota override — grant specific users higher limits
- [ ] Voice usage dashboard — searches/day chart, top queries, failure rate, cost estimate
- [ ] LLM model selector — toggle between gpt-4o-mini / gpt-4o from admin
- [ ] Approved user voice access toggle — enable/disable voice per user

**Track D: Observability (~2-3 days)**
- [ ] Log voice search queries + outcomes to Supabase (anonymized)
- [ ] Alert threshold — notify admin if daily cost exceeds configurable amount
- [ ] Failed search tracking — log queries that return 0 results (product intelligence)

---

### 3. Phase 3: Voice Everywhere (Q2 2026)
**Status:** Planned — After Voice Quality hardening
**Docs:** `docs/guides/user-journey-map.md`
**Prerequisite:** Voice Experience Quality & Admin Controls (priority #2)

**Features:**
- Voice-assisted property listing
- Voice-assisted booking
- Voice-assisted bidding

**Est. Time:** 3-4 weeks

---

### 4. Phase 12: Native App Shells (Capacitor) — Android + iOS
**Status:** Planned — After PWA validates demand
**Est. Time:** 2-3 weeks
**Decision:** DEC-011
**Prerequisite:** Phase 11 (PWA) complete

**Objective:** Wrap the existing React app in native shells using Capacitor for publishing to **Google Play Store** and **Apple App Store**. One codebase → two app stores.

**Track A: Project Setup (~2 days)**
- [ ] Install Capacitor, initialize Android + iOS projects
- [ ] Configure `capacitor.config.ts`, set up build environments

**Track B: Native Features (~1 week)**
- [ ] Push notifications, camera access, haptic feedback
- [ ] Status bar theming, deep linking, biometric auth (optional)

**Track C: App Store Publishing (~1 week)**
- [ ] Apple Developer Account ($99/year), Google Play Console ($25 one-time)
- [ ] App Store assets, signed builds, TestFlight beta, review process

**Track D: CI/CD for Mobile (~2-3 days)**
- [ ] GitHub Actions workflow for automated builds + app store submission

---

### 5. Phase 6: Advanced Features (Q3 2026)
**Status:** Backlog

**Features:**
- Saved searches & search alerts
- Advanced filtering (price range, amenities, rating)
- Owner analytics dashboard enhancements
- Calendar integration (Google/Outlook sync)

---

### Deferred Items
- **Phase 10 Track D:** AI Support Agent — needs design decision (DEC-009)
- **Phase 10 Tracks A-C:** Complete (Feb 15) — dead links, contact page, support form

---

## COMPLETED PHASES

> Full details for all completed phases: [COMPLETED-PHASES.md](COMPLETED-PHASES.md)

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
- **Setup Checklist:** `docs/testing/TEST-SETUP-CHECKLIST.md`
- **Claude Code Prompts:** `docs/testing/CLAUDE-CODE-PROMPTS.md`

### Feature Documentation
- **Voice Search:** `docs/features/voice-search/`
- **Voice Auth & Approval:** `docs/features/voice-auth-approval/`
- **Resort Master Data:** `docs/features/resort-master-data/`
- **Testing Infrastructure:** `docs/features/testing-infrastructure/`

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

**Last updated:** February 20, 2026
**Maintained by:** Sujit
**Claude Desktop:** Connected to GitHub `tektekgo/rentavacation/docs/`
