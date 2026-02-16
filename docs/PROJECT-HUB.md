# PROJECT HUB - Rent-A-Vacation

> **The Single Source of Truth** for project status, roadmap, and decisions
> **Last Updated:** February 16, 2026
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

**Active Phase:** CI/CD Fix — Unblock Qase Test Reporting
**Started:** February 16, 2026

### Working on TODAY:
- [ ] Fix all 58 ESLint `no-explicit-any` errors to unblock CI pipeline
- [ ] Phase 12: Capacitor setup (after CI green)

### Recently Completed:
- [x] **Phase 11: PWA** — service worker, install banner, offline detection, iOS meta tags, 11 new tests (Feb 16)
- [x] **DevOps: Branch strategy** — `dev` → `main` workflow, branch protection, CLAUDE.md documented (Feb 15)
- [x] **Phase 10 Tracks A-C** — dead link fixes, footer consolidation, Contact page + edge function deployed (Feb 15)
- [x] **Phase 9: Voice Toggles, Membership Tiers & Commission** — 5 tracks, 22 files, migration deployed (Feb 14)

### Blocked/Waiting:
- Phase 10 Track D (AI Support Agent) — awaiting design decision (DEC-009)

---

## PRIORITY QUEUE (In Order)

### 1. Fix ESLint Errors — CRITICAL (CI Blocker)
**Status:** In Progress (Feb 16, 2026)
**Impact:** All CI runs failing → Qase test reporting inactive, no automated quality gate

**Problem:** 58 `@typescript-eslint/no-explicit-any` errors cause `npm run lint` to exit non-zero, failing the "Lint & Type Check" CI job. Tests never execute in CI, so Qase receives no results.

**Fix:** Replace all `any` types with proper TypeScript types across ~15 files.

**Files affected:**
- `scripts/import-resort-data.ts` (2 errors)
- `src/components/FeaturedResorts.tsx` (1)
- `src/components/admin/PendingApprovals.tsx` (2)
- `src/components/owner/OwnerListings.tsx` (6)
- `src/components/owner/OwnerProperties.tsx` (4)
- `src/components/owner/OwnerVerification.tsx` (2)
- `src/hooks/useBidding.ts` (18)
- `src/hooks/useFavorites.ts` (5)
- `src/hooks/useRoleUpgrade.ts` (6)
- `src/lib/email.ts` (2)
- `src/pages/ListProperty.tsx` (5)
- `src/pages/PropertyDetail.tsx` (2)
- `supabase/functions/send-approval-email/index.ts` (1)
- `supabase/functions/send-email/index.ts` (1)
- `tailwind.config.ts` (1)

---

### 2. Phase 10: Link Audit Fixes & Support Infrastructure — IN PROGRESS
**Status:** Tracks A-C complete, Track D deferred (Feb 15, 2026)
**Audit:** 68 internal links verified working, 7 issues found and fixed

**Completed:**
- [x] **Track A:** FAQ "Contact Support" → `/contact`, footer email/phone clickable, removed social placeholders, fixed live chat claim
- [x] **Track B:** Added Pricing & Success Stories sections to How It Works, hash scroll support, legacy route redirects via `<Navigate>`
- [x] **Track C:** `/contact` page with form, `send-contact-form` edge function (Resend), deployed to DEV + PROD

**Remaining:**
- [ ] **Track D:** AI Support Agent — needs design decision (DEC-009)

---

### 2. Phase 3: Voice Everywhere (Q2 2026)
**Status:** Planned
**Docs:** `docs/guides/user-journey-map.md`

**Features:**
- Voice-assisted property listing
- Voice-assisted booking
- Voice-assisted bidding

**Est. Time:** 3-4 weeks

---

### 3. Phase 12: Native App Shells (Capacitor) — Android + iOS
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

### 4. Phase 6: Advanced Features (Q3 2026)
**Status:** Backlog

**Features:**
- Saved searches & search alerts
- Advanced filtering (price range, amenities, rating)
- Owner analytics dashboard enhancements
- Calendar integration (Google/Outlook sync)

---

## COMPLETED PHASES

> Full details for all completed phases: [COMPLETED-PHASES.md](COMPLETED-PHASES.md)

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
**Status:** Not Started
**Priority:** High — could reshape voice architecture
**Docs:** https://docs.livekit.io/agents/start/voice-ai-quickstart/

**Objective:** Evaluate LiveKit Agents SDK as a platform for building a full voice agent experience on RAV — potentially replacing or complementing the current VAPI integration.

**Why LiveKit:**
- Open-source, self-hostable voice AI infrastructure
- Built-in STT/LLM/TTS pipeline orchestration, WebRTC transport
- Function calling / tool use for live data queries
- Could unify search + support + booking into one voice agent

**Research Tasks:**
- [ ] Read LiveKit Agents quickstart & architecture docs
- [ ] Compare LiveKit vs VAPI: cost model, latency, flexibility, vendor lock-in
- [ ] Prototype: minimal voice agent that can answer "find me a resort in Orlando"
- [ ] Evaluate hosting: LiveKit Cloud vs self-hosted
- [ ] Determine migration path from VAPI → LiveKit (if viable)

**Decision:** See DEC-010

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

### DEC-010: Voice Platform — VAPI vs LiveKit Agents SDK
**Date:** February 15, 2026
**Decision:** TBD — Research spike RS-001 required first
**Status:** Pending

**Options:**
- A: Stay with VAPI — proven, working, managed, but limited
- B: Migrate fully to LiveKit — more control, lower cost at scale
- C: Hybrid — keep VAPI for search, use LiveKit for new features
- D: LiveKit for everything new — build future voice on LiveKit, sunset VAPI when ready

**Key differences:** VAPI is managed/per-minute/WebSocket; LiveKit is self-hostable/WebRTC/full agent code control with any LLM (Claude, OpenAI, etc.)

**Next Step:** Complete RS-001 research spike, then revisit

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

**Last updated:** February 16, 2026
**Maintained by:** Sujit
**Claude Desktop:** Connected to GitHub `tektekgo/rentavacation/docs/`
