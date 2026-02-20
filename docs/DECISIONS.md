# Archived Decisions Log

> Finalized decisions moved from [PROJECT-HUB.md](PROJECT-HUB.md) to keep the hub concise.
> **Last Archived:** February 20, 2026

---

## DEC-001: Hybrid Agent Sessions for Phase 2
**Date:** February 11, 2026
**Decision:** Use 3 coordinated sessions (Database Engineer → Backend → Frontend)
**Reasoning:** Complex features need specialized expertise per layer
**Result:** Validated - worked perfectly (2.5 hours exactly)
**Status:** Final

---

## DEC-002: Voice Search Access Control
**Date:** February 13, 2026
**Decision:** Option B — Logged-in users only
**Status:** Implemented (Phase 1 deployed Feb 14)

**Options Considered:**
- A: Voice for everyone (high cost risk: $30K/month)
- B: Logged-in users only — **CHOSEN**
- C: Paid users only (limits growth)
- D: Freemium (5/day free, unlimited paid)

**Reasoning:**
- Preserves competitive advantage
- Manageable costs (~$0.10/search)
- Builds user base without payment friction
- Usage quotas deferred to Phase 3

**Trade-offs:**
- Slightly higher friction (must sign up)
- But necessary for cost control

---

## DEC-003: Voice Usage Quota Design
**Date:** February 15, 2026 (Updated Feb 14, 2026 — Phase 9)
**Decision:** Tier-based quotas: Free=5/day, Plus/Pro=25/day, Premium/Business/RAV=unlimited
**Status:** Implemented (Phase 3, upgraded in Phase 9)

**Design Choices:**
- Counter increments only after successful search (not on VAPI call start)
- RAV team returns -1 from `get_user_voice_quota` (unlimited)
- Quota resets at midnight UTC
- Old usage records cleaned up after 90 days
- **Phase 9 upgrade:** Quotas now driven by `membership_tiers.voice_quota_daily` instead of hardcoded 10
- Auto-assigned free tier on signup via `handle_new_user()` trigger

**Reasoning:**
- Tier-based quotas incentivize upgrades
- Free tier (5/day) balances access with cost control
- Paid tiers (25/unlimited) reward commitment

**Trade-offs:**
- No carryover of unused searches
- Billing/subscription not yet implemented (tier assignment is manual for paid tiers)

---

## DEC-005: Placeholder Content Removal
**Date:** February 13, 2026
**Decision:** Replace with realistic content from actual data
**Status:** Approved

**Approach:**
- Use real database counts (resorts, properties, etc.)
- Remove inflated fake numbers (50K+ owners, 100% direct booking)
- Honesty builds trust > fake social proof

---

## DEC-006: Testing Infrastructure Approach
**Date:** February 13, 2026
**Decision:** Option B - Comprehensive foundation (60%+ coverage, 2-3 weeks)
**Status:** Implemented (Phase 8)

**Options:**
- A: Minimal safety net (20% tests, 1 week)
- B: Comprehensive foundation (60%+ coverage, 2-3 weeks) — **CHOSEN**

**Reasoning:**
- Development already underway - need to catch up AND keep up
- Confidence > speed (prevent production breaks)
- AI agents can accelerate test writing
- Investment now saves debugging time later

**Tools:** Vitest (unit + integration), Playwright (E2E), Percy.io (visual regression), GitHub Actions (CI/CD)

---

## DEC-007: Build Version System
**Date:** February 13, 2026
**Decision:** Inject git metadata at build time via Vite `define`, display in footer
**Status:** Implemented

**Format:** `v{semver}.{commitCount} · {shortSHA}`
- Semver from `package.json` (bump manually for milestones)
- Commit count auto-increments with each commit
- Short SHA for instant deploy verification
- Vercel needs `VERCEL_GIT_FETCH_DEPTH=0` env var for full clone

---

## DEC-008: Membership Tier & Commission Architecture
**Date:** February 14, 2026
**Decision:** 6-tier system (3 traveler + 3 owner) with configurable commission and DB-controlled voice toggles
**Status:** Implemented (Phase 9)

**Design Choices:**
- `membership_tiers` as reference table (not hardcoded) — admin can add/modify tiers
- One active membership per user (`user_memberships.user_id` UNIQUE)
- Commission: per-owner agreement override > platform base rate - tier discount
- Voice toggles: master kill switch + per-feature toggles in `system_settings`
- Free tier auto-assigned on signup via trigger
- Billing deferred — tier assignment is manual for paid tiers until Stripe Subscriptions integrated

**Tier Structure:**
| Tier | Voice/day | Commission Discount | Listing Limit |
|------|-----------|--------------------|----|
| Traveler Free | 5 | - | - |
| Traveler Plus ($5/mo) | 25 | - | - |
| Traveler Premium ($15/mo) | unlimited | - | - |
| Owner Free | 5 | 0% | 3 |
| Owner Pro ($10/mo) | 25 | 2% | 10 |
| Owner Business ($25/mo) | unlimited | 5% | unlimited |

**Reasoning:**
- Infrastructure-first approach: build data model before billing
- Configurable commission allows A/B testing and per-owner deals
- DB-controlled toggles eliminate deploy cycles for feature flags

---

## DEC-010: Voice Platform — VAPI vs LiveKit
**Date:** February 15, 2026
**Decision:** Stay on VAPI (see DEC-012)
**Status:** Resolved → DEC-012

**Original Options:**
- A: Stay with VAPI — proven, working, managed, but limited
- B: Migrate fully to LiveKit — more control, lower cost at scale
- C: Hybrid — keep VAPI for search, use LiveKit for new features
- D: LiveKit for everything new — build future voice on LiveKit, sunset VAPI when ready

**Resolution:** DEC-012 decided to stay on VAPI. LiveKit migration not justified at current scale.

---

## DEC-012: Voice Infrastructure — Stay on VAPI
**Date:** February 20, 2026
**Decision:** Remain on VAPI for voice search. Do not migrate to LiveKit.
**Status:** Approved

**Options evaluated:**
- VAPI (current) — managed, turnkey, ~$0.10/search
- LiveKit open source — self-hosted pipeline, ~$0.01/search at scale

**Rationale:**
- Current beta cost is ~$300-700/month with auth gates + 10/day quota in place
- LiveKit migration = 3-6 weeks engineering to solve a sub-$1K/month problem
- Break-even requires 5,000+ searches/month — not at that scale yet
- Acquisition thesis favors best-in-class managed services over self-hosted optimization
- Revisit when monthly voice spend consistently exceeds $3,000/month

**Owner:** Sujit