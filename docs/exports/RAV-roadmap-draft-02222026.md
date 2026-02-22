# Rent-A-Vacation — Product Roadmap

**Date:** February 22, 2026
**Version:** v0.9.0
**Status:** Pre-Launch (Staff Only Mode)

---

## Vision

Rent-A-Vacation is the premier peer-to-peer marketplace for vacation club timeshare rentals, combining AI-powered search with transparent pricing and trust-first design.

---

## Completed (Phases 1–19) — BUILT

### Core Platform
- User authentication with RBAC (5 roles: rav_owner, rav_admin, rav_staff, property_owner, renter)
- Property registration and listing management with admin approval workflow
- Bidding marketplace with "Name Your Price" system
- Booking flow with Stripe payment integration
- Escrow system (5-day post-checkout hold)
- Owner confirmation timer with extension system
- Email notifications (8 transactional email types via Resend)
- Owner verification system

### AI & Search
- Voice search (VAPI + Deepgram) with natural language queries
- Text chat agent (OpenRouter, SSE streaming, context-aware)
- Tier-based voice quotas (Free: 5/day, Plus/Pro: 25/day, Premium/Business: unlimited)

### Business Intelligence
- Executive Dashboard (investor-grade, dark-themed, 6 sections)
- Owner Dashboard (6 BI sections, earnings timeline, pricing intelligence)
- Fair Value Score (P25-P75 percentile pricing, role-specific messaging)
- Maintenance Fee Calculator (public, 9 brands, break-even analysis)
- Unit Economics (CAC, LTV, take rate, MoM growth)

### Pricing & Booking
- Per-night pricing (`nightly_rate` as atomic unit)
- Date proposals (bid with alternate dates)
- Inspired travel requests (pre-filled from listings)
- Travel request auto-matching
- Platform commission: 15% default (admin-configurable, Pro −2%, Business −5%)

### Infrastructure
- 17 Supabase Edge Functions
- 20 database migrations (007–020 + 2 timestamped)
- 289 automated tests (unit + integration)
- PWA support (service worker, install prompt, offline detection)
- GitHub Actions CI (lint, test, build, Percy visual regression)
- Seed data system (3-layer, DEV-only, foundation user protection)
- Staff Only Mode for pre-launch platform lock

### Membership Tiers (6 total)

**Renter tiers:** Free ($0, 5 voice/day), Plus ($9.99/mo, 25/day), Premium ($24.99/mo, unlimited)
**Owner tiers:** Free ($0, 15% commission), Pro ($19.99/mo, 13%), Business ($49.99/mo, 10%)

### Supported Brands (9)
Hilton Grand Vacations, Marriott Vacation Club, Disney Vacation Club, Wyndham Destinations, Hyatt Residence Club, Bluegreen Vacations, Holiday Inn Club Vacations, WorldMark by Wyndham, Other / Independent Resort

---

## In Progress

### Voice Experience Tracks C-D
- Admin voice controls (global toggle, quota adjustment, per-user override)
- Voice usage dashboard and LLM model selector
- Observability (query logging, alert thresholds, failed search tracking)

---

## Planned — Pre-Launch Required

### Phase 20: Accounting, Tax & Fee Framework
**Priority:** Required before public launch

- **Phase A:** Fee breakdown (separate service_fee, cleaning_fee, tax_amount line items)
- **Phase B:** Stripe Tax integration for automated occupancy + sales tax
- **Phase C:** Admin tax reporting (by jurisdiction, by month)
- **Phase D:** QuickBooks integration (post-launch)
- **Phase E:** 1099-K compliance (before Jan 2027)
- **Phase F:** Automated tax filing (when volume justifies)

---

## Planned — Post-Launch

### Phase 21: Partial-Week Booking
- Owner "flexible dates" flag
- Calendar subset selection
- Listing splits with per-segment escrow
- Minimum stay and cleaning gap rules

### Phase 3: Voice Everywhere (Q2 2026)
- Voice-assisted property listing, booking, bidding
- Prerequisite: Voice Tracks C-D complete

### Phase 12: Native App Shells (Capacitor)
- Android + iOS from one React codebase
- Push notifications, camera, biometric auth
- App Store publishing + CI/CD

### Phase 6: Advanced Features (Q3 2026)
- Saved searches & alerts
- Advanced filtering
- Owner analytics
- Calendar integration

---

## Key Technical Decisions

| ID | Decision | Status |
|----|----------|--------|
| DEC-008 | Membership tier & commission architecture | Final |
| DEC-014 | Separate route for Executive Dashboard | Final |
| DEC-015 | BYOK demo/connected pattern | Final |
| DEC-018 | Staff Only Mode for pre-launch lock | Final |
| DEC-020 | Two-tier AI (VAPI voice + OpenRouter text) | Final |
| DEC-022 | Per-night pricing + Stripe Tax before launch | Approved |
| DEC-023 | Flexible dates: 3-phase approach | Approved |

---

## Success Metrics — INDUSTRY DATA + PROJECTED

- Voice Search: 34% adoption, 87% success rate, NPS +68
- Listing Flow: 8 min completion (was 22 min), 94% completion rate
- Platform: 117 resorts, 351 unit types, 10+ countries

> **Labels:** BUILT = deployed in codebase. INDUSTRY DATA = published research. PROJECTED = forward-looking estimate.

---

*Generated February 22, 2026. All statistics verified against source code.*
