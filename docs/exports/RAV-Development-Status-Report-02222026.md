# Rent-A-Vacation — Development Status Report

**Date:** February 22, 2026
**Prepared by:** Sujit (RAV Owner / Lead Developer)
**Version:** v0.9.0

---

## Executive Summary

Rent-A-Vacation (RAV) is a vacation club timeshare rental marketplace connecting property owners with travelers. The platform is feature-complete for MVP and deployed to production (currently in Staff Only Mode for pre-launch testing).

### Key Metrics

| Metric | Value |
|--------|-------|
| Automated Tests | 289 (all passing) |
| Type Errors | 0 |
| Lint Errors | 0 |
| Database Migrations | 20 (007–020 + 2 timestamped) |
| Edge Functions | 17 |
| Completed Phases | 19 |

---

## Technology Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth, PostgreSQL with RLS, Edge Functions, Storage)
- **Payments:** Stripe (checkout sessions, escrow, webhooks)
- **Voice AI:** VAPI (Deepgram transcription, natural language search)
- **Text AI:** OpenRouter (SSE streaming, context-aware chat)
- **Email:** Resend (transactional emails from `rav@mail.ai-focus.org`)
- **Hosting:** Vercel (frontend) + Supabase (backend)
- **CI/CD:** GitHub Actions (lint, test, build, Percy visual regression)

---

## Membership Tiers

### Renter Tiers

| Tier | Price | Voice Searches | Key Benefits |
|------|-------|----------------|--------------|
| Free | $0 | 5/day | Basic search, browse listings |
| Plus | $9.99/mo | 25/day | Priority support, saved searches |
| Premium | $24.99/mo | Unlimited | Early access, concierge service |

### Owner Tiers

| Tier | Price | Commission | Key Benefits |
|------|-------|-----------|--------------|
| Free | $0 | 15% (default) | List properties, basic dashboard |
| Pro | $19.99/mo | 13% (−2%) | Analytics, priority placement |
| Business | $49.99/mo | 10% (−5%) | Multi-property, API access, dedicated support |

> **Note:** The base commission rate (currently 15%) is admin-configurable in Admin > System Settings. Tier definitions are in migration 011.

---

## Edge Functions (17 total)

| Function | Purpose |
|----------|---------|
| `create-booking-checkout` | Stripe checkout session creation |
| `verify-booking-payment` | Stripe webhook handler for payment verification |
| `send-email` | Generic transactional email sender |
| `send-approval-email` | Listing/user approval notifications |
| `send-booking-confirmation-reminder` | Owner confirmation deadline reminders |
| `send-cancellation-email` | Booking cancellation notifications |
| `send-contact-form` | Contact form submission handler |
| `send-verification-notification` | Owner verification status emails |
| `process-deadline-reminders` | Cron-triggered deadline scanner |
| `match-travel-requests` | Auto-match travel requests to new listings |
| `seed-manager` | DEV-only seed data management |
| `voice-search` | VAPI voice search handler |
| `text-chat` | OpenRouter text chat with SSE streaming |
| `fetch-industry-news` | NewsAPI integration for exec dashboard |
| `fetch-airdna-data` | AirDNA market data (BYOK) |
| `fetch-str-data` | STR Global benchmarks (BYOK) |
| `fetch-macro-indicators` | Macro economic indicators |

---

## Supported Vacation Club Brands (9)

1. Hilton Grand Vacations
2. Marriott Vacation Club
3. Disney Vacation Club
4. Wyndham Destinations
5. Hyatt Residence Club
6. Bluegreen Vacations
7. Holiday Inn Club Vacations
8. WorldMark by Wyndham
9. Other / Independent Resort

---

## Completed Phases

### Phase 19: Flexible Date Booking + Per-Night Pricing (Feb 22)
- Migration 020: `nightly_rate` on listings, `requested_check_in/out` on bids, `source_listing_id` on travel requests
- Shared `pricing.ts` utility replaces 4 duplicated functions
- BidFormDialog dual-mode (bid vs date-proposal)
- InspiredTravelRequestDialog for "Request Similar Dates"
- 16 new tests (289 total)

### Phase 18: Travel Request Enhancements (Feb 21)
- Auto-match engine, demand signals, post-request CTA, expiry warnings
- Migration 018, 9 new tests

### Phase 17: Owner Dashboard (Feb 21)
- 6 business intelligence sections, 4 data hooks
- Migration 017, 30 new tests

### Phase 16: Maintenance Fee Calculator (Feb 21)
- Public `/calculator` route, 9 brands, break-even analysis
- 12 new tests

### Phase 15: Fair Value Score (Feb 21)
- PostgreSQL RPC, P25-P75 percentile pricing, role-specific messaging
- 14 new tests

### Phase 14: Executive Dashboard (Feb 20)
- Investor-grade dark-themed dashboard, 6 sections, BYOK pattern
- 4 edge functions, 15+ new tests

### Phase 13: Core Business Flow Completion (Feb 20)
- Owner bidding, image upload, payout tracking, confirmation timer
- Migration 012, 50+ tests

### Phases 1–12
- Voice search, resort master data, PWA, membership tiers, role upgrades, testing infrastructure
- See PROJECT-HUB.md for full details

---

## Platform Commission

The platform commission rate is **15% by default** and is **admin-configurable** via Admin > System Settings (`platform_commission_rate` in `system_settings` table).

- **Free owners:** 15% commission
- **Pro owners:** 13% commission (2% discount)
- **Business owners:** 10% commission (5% discount)

Stripe processing fees (~2.9%) are absorbed by RAV within the service fee margin.

---

## Deployment Status

| Environment | Status | URL |
|-------------|--------|-----|
| Production | Staff Only Mode | rentavacation.com |
| Staging/DEV | Active | Vercel preview URLs |

All 20 migrations deployed to both DEV and PROD Supabase instances.
All 17 edge functions deployed.

---

## Next Priorities

1. Voice Experience Tracks C-D (admin controls, observability)
2. Phase 20: Accounting, Tax & Fee Framework
3. Phase 3: Voice Everywhere
4. Phase 12: Native App Shells (Capacitor)

---

*Generated February 22, 2026. All statistics verified against source code.*
