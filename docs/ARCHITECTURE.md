# Rent-A-Vacation — Architecture & Developer Guide

> **Version:** 1.0 · **Last updated:** February 2026  
> **Platform:** Vacation rental marketplace for timeshare & vacation club owners  
> **Tagline:** "Name Your Price. Book Your Paradise."

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Routing & Pages](#4-routing--pages)
5. [Authentication & RBAC](#5-authentication--rbac)
6. [Database Schema](#6-database-schema)
7. [Core Business Flows](#7-core-business-flows)
8. [Edge Functions (Backend)](#8-edge-functions-backend)
9. [Email System](#9-email-system)
10. [Bidding & Marketplace](#10-bidding--marketplace)
11. [Design System](#11-design-system)
12. [State Management](#12-state-management)
13. [Environments & Deployment](#13-environments--deployment)
14. [Key Conventions](#14-key-conventions)
15. [SEO & Meta Tags](#15-seo--meta-tags)
16. [Voice Admin & Observability](#16-voice-admin--observability)

---

## 1. High-Level Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        RENT-A-VACATION                               │
├──────────────┬───────────────────┬───────────────────────────────────┤
│   FRONTEND   │   BACKEND (Edge)  │          DATABASE                 │
│              │                   │                                   │
│  React SPA   │  Deno Functions   │  PostgreSQL (Supabase)            │
│  Vite + TS   │  on Supabase      │  + RLS policies                  │
│  Tailwind    │                   │  + pg_cron / pg_net              │
│  shadcn/ui   │  • Stripe checkout│  + Auth (Supabase Auth)          │
│              │  • Email (Resend) │                                   │
│              │  • CRON reminders │  Storage Buckets:                │
│              │                   │  • property-images               │
│              │                   │  • verification-documents        │
└──────────────┴───────────────────┴───────────────────────────────────┘
```

**Three user personas:**
- **Travelers (renters)** — browse listings, bid, book, check in
- **Property Owners** — list timeshares, manage bookings, verify identity
- **RAV Team (admin/staff)** — approve listings, verify owners, manage escrow & payouts

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18 + TypeScript | SPA with strict typing |
| **Build** | Vite + SWC | Fast dev server, HMR |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first with component library |
| **Routing** | React Router v6 | Client-side routing |
| **Data Fetching** | TanStack React Query v5 | Server state, caching, mutations |
| **Forms** | React Hook Form + Zod | Validation & form state |
| **Auth** | Supabase Auth | Email/password, Google OAuth |
| **Database** | Supabase PostgreSQL | With Row Level Security (RLS) |
| **Backend** | Supabase Edge Functions (Deno) | Serverless API endpoints |
| **Payments** | Stripe Checkout | Full payment capture at booking |
| **Email** | Resend API | Transactional emails |
| **Charts** | Recharts | Admin dashboard analytics |

---

## 3. Project Structure

```
src/
├── assets/                    # Static images (imported as ES6 modules)
├── components/
│   ├── ui/                    # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── executive/             # Executive dashboard components
│   │   ├── TooltipIcon.tsx              # Metric tooltip (definition + whyItMatters)
│   │   ├── SectionHeading.tsx           # Consistent section headers
│   │   ├── SectionDivider.tsx           # Full-width dividers
│   │   ├── HeadlineBar.tsx              # Sticky 5 KPI pills
│   │   ├── BusinessPerformance.tsx      # Section 2: GMV trend, bid activity, revenue waterfall
│   │   ├── MarketplaceHealth.tsx        # Section 3: liquidity, supply/demand, voice funnel
│   │   ├── LiquidityGauge.tsx           # SVG gauge for liquidity score
│   │   ├── SupplyDemandMap.tsx          # Destination cards
│   │   ├── VoiceFunnel.tsx              # Voice vs traditional conversion
│   │   ├── MarketIntelligence.tsx       # Section 4: BYOK market data
│   │   ├── BYOKCard.tsx                 # Reusable BYOK wrapper
│   │   ├── IndustryFeed.tsx             # Section 5: news + macro
│   │   ├── UnitEconomics.tsx            # Section 6: investor metrics
│   │   ├── IntegrationSettings.tsx      # API key management drawer
│   │   └── utils.ts                     # formatCurrency, CHART_COLORS
│   ├── admin/                 # Admin dashboard tab components
│   │   ├── AdminOverview.tsx       # KPI cards, charts
│   │   ├── AdminUsers.tsx          # User & role management
│   │   ├── AdminListings.tsx       # Listing approval workflow
│   │   ├── AdminBookings.tsx       # All bookings view
│   │   ├── AdminProperties.tsx     # Property oversight
│   │   ├── AdminVerifications.tsx  # Owner document review
│   │   ├── AdminEscrow.tsx         # Escrow status management + owner confirmation status
│   │   ├── AdminPayouts.tsx        # Owner payout tracking & processing
│   │   ├── AdminFinancials.tsx     # Revenue reports
│   │   └── AdminCheckinIssues.tsx  # Traveler issue resolution
│   ├── bidding/               # Bidding marketplace components
│   │   ├── BidFormDialog.tsx       # Place a bid or propose different dates (mode: 'bid' | 'date-proposal')
│   │   ├── BidsManagerDialog.tsx   # Owner manages incoming bids
│   │   ├── OpenForBiddingDialog.tsx # Owner opens listing for bids
│   │   ├── TravelRequestCard.tsx   # Display travel request
│   │   ├── TravelRequestForm.tsx   # Create travel request (supports defaultValues prefill)
│   │   ├── ProposalFormDialog.tsx  # Owner proposes to travel request
│   │   ├── InspiredTravelRequestDialog.tsx # "Request Similar Dates" from listing detail (pre-fills TravelRequestForm)
│   │   ├── DemandSignal.tsx       # Shows matching travel request count on listing form
│   │   ├── PostRequestCTA.tsx     # Empty search results → "Post a Travel Request" CTA
│   │   └── NotificationBell.tsx   # Real-time notification icon
│   ├── owner-dashboard/       # Owner dashboard analytics components
│   │   ├── OwnerHeadlineStats.tsx    # 4 KPI cards (earned, listings, bids, fees coverage)
│   │   ├── EarningsTimeline.tsx      # Recharts AreaChart with monthly/quarterly toggle
│   │   ├── MyListingsTable.tsx       # Listing rows with status, fair value, idle alerts
│   │   ├── BidActivityFeed.tsx       # Event stream with color-coded bid events
│   │   ├── PricingIntelligence.tsx   # Per-listing fair value + market range
│   │   └── MaintenanceFeeTracker.tsx # Fee input prompt or coverage progress bar
│   ├── owner/                 # Owner dashboard components
│   │   ├── OwnerProperties.tsx     # CRUD properties
│   │   ├── OwnerListings.tsx       # Manage listings
│   │   ├── OwnerBookings.tsx       # View bookings on owned listings
│   │   ├── OwnerBookingConfirmations.tsx # Submit resort confirmation (2-phase: owner acceptance + resort)
│   │   ├── OwnerConfirmationTimer.tsx   # Owner acceptance countdown timer with extensions
│   │   ├── OwnerEarnings.tsx       # Revenue & payout tracking
│   │   ├── OwnerPayouts.tsx        # Payout history view
│   │   ├── OwnerProposals.tsx      # Sent proposals to travelers
│   │   ├── PropertyImageUpload.tsx # Drag-and-drop image upload
│   │   └── OwnerVerification.tsx   # Upload verification docs
│   ├── Header.tsx             # Main navigation bar
│   ├── Footer.tsx             # Site footer
│   ├── HeroSection.tsx        # Landing page hero
│   ├── FeaturedResorts.tsx    # Landing featured resorts carousel
│   ├── TopDestinations.tsx    # Landing destination cards
│   ├── HowItWorks.tsx         # 3-step explanation
│   ├── Testimonials.tsx       # Social proof section
│   ├── CTASection.tsx         # Call-to-action banner
│   ├── TrustBadges.tsx        # Trust indicators
│   ├── NavLink.tsx            # Active-aware nav link
│   └── RoleBadge.tsx          # Visual role indicator (crown, shield, etc.)
├── contexts/
│   └── AuthContext.tsx        # Auth state, session, roles, sign-in/out
├── hooks/
│   ├── useAuth.ts             # Re-exports from AuthContext
│   ├── useTextChat.ts         # Text chat hook (SSE streaming, AbortController, context-aware)
│   ├── useBidding.ts          # All bidding queries & mutations (~600 lines)
│   ├── useOwnerConfirmation.ts # Owner acceptance timer, extensions, confirm/decline
│   ├── usePayouts.ts          # Owner & admin payout data hooks
│   ├── usePropertyImages.ts   # Upload, list, delete, reorder property images
│   ├── use-mobile.tsx         # Responsive breakpoint hook
│   ├── owner/                 # Owner dashboard data hooks
│   │   ├── useOwnerDashboardStats.ts  # RPC: get_owner_dashboard_stats + useUpdateMaintenanceFees
│   │   ├── useOwnerEarnings.ts        # RPC: get_owner_monthly_earnings + fillMissingMonths
│   │   ├── useOwnerListingsData.ts    # Join query → OwnerListingRow[]
│   │   └── useOwnerBidActivity.ts     # Join query → BidEvent[]
│   └── executive/             # Executive dashboard data hooks
│       ├── useBusinessMetrics.ts      # Tier 1 metrics from Supabase
│       ├── useMarketplaceHealth.ts    # Liquidity score + supply/demand
│       ├── useIndustryFeed.ts         # Tier 2: news + macro indicators
│       └── useMarketIntelligence.ts   # Tier 3: BYOK + settings
├── lib/
│   ├── supabase.ts            # Supabase client initialization
│   ├── email.ts               # Client-side email helpers (welcome, contact)
│   ├── pricing.ts             # calculateNights() + computeListingPricing() (shared utility)
│   ├── cancellation.ts        # Refund calculation logic
│   └── utils.ts               # cn() class merge utility
├── pages/                     # Route-level page components
│   ├── Index.tsx              # Landing page
│   ├── Rentals.tsx            # Browse listings
│   ├── PropertyDetail.tsx     # Single listing view + booking
│   ├── ListProperty.tsx       # Owner listing creation form
│   ├── Login.tsx / Signup.tsx  # Auth pages
│   ├── OwnerDashboard.tsx     # Tabbed owner management
│   ├── AdminDashboard.tsx     # Tabbed admin management
│   ├── ExecutiveDashboard.tsx # Investor-grade strategy dashboard (dark theme, rav_owner only)
│   ├── BiddingMarketplace.tsx # Browse bids & travel requests
│   ├── MyBidsDashboard.tsx    # Traveler's bid management
│   ├── BookingSuccess.tsx     # Post-payment confirmation
│   ├── TravelerCheckin.tsx    # Check-in confirmation flow
│   ├── Destinations.tsx       # Destination directory
│   ├── HowItWorksPage.tsx     # Full how-it-works
│   ├── Documentation.tsx      # Admin manual (RBAC-protected)
│   ├── UserGuide.tsx          # Public user guide
│   ├── FAQ.tsx / Terms.tsx / Privacy.tsx
│   └── NotFound.tsx           # 404 page
├── types/
│   ├── database.ts            # Complete DB schema types (~768 lines)
│   ├── bidding.ts             # Bidding system types
│   ├── chat.ts                # Text chat types (ChatMessage, ChatStatus, ChatContext)
│   ├── ownerDashboard.ts      # Owner dashboard types (OwnerDashboardStats, MonthlyEarning, OwnerListingRow, BidEvent)
│   └── voice.ts               # Voice search types
├── index.css                  # Design system tokens (HSL)
├── App.tsx                    # Router + providers
└── main.tsx                   # Entry point

supabase/
├── config.toml                # Edge function registration
└── functions/
    ├── _shared/
    │   ├── email-template.ts  # Unified email layout (buildEmailHtml, detailRow, infoBox)
    │   └── property-search.ts # Shared search query builder (used by voice-search + text-chat)
    ├── create-booking-checkout/   # Stripe checkout session creation
    ├── verify-booking-payment/    # Client-side payment verification → update booking + send confirmation email
    ├── stripe-webhook/            # Stripe webhook handler (payment verification, session expiry, refunds, Connect account + transfer events)
    ├── create-connect-account/    # Stripe Connect: create Express account + onboarding link for owners
    ├── create-stripe-payout/      # Stripe Connect: initiate transfer to owner's connected account (admin only)
    ├── process-cancellation/      # Booking cancellation: policy-based refund, Stripe refund, status updates
    ├── send-email/                # Generic email dispatch via Resend
    ├── send-booking-confirmation-reminder/  # Owner deadline reminders + owner confirmation notifications
    ├── send-approval-email/              # Admin approval/rejection notifications (listings + users)
    ├── send-cancellation-email/   # Traveler cancellation notifications
    ├── send-verification-notification/     # Admin notification on doc upload
    ├── process-deadline-reminders/         # CRON: scan & send overdue reminders + owner confirmation timeouts
    ├── voice-search/                     # VAPI webhook: property search via voice
    ├── text-chat/                        # OpenRouter LLM: text chat with tool calling + SSE streaming
    ├── match-travel-requests/            # Auto-match approved listings to open travel requests
    ├── seed-manager/                     # DEV only: 3-layer seed data system (status/reseed/restore)
    ├── fetch-industry-news/              # Executive: NewsAPI + Google News RSS (60-min cache)
    ├── fetch-macro-indicators/           # Executive: FRED consumer confidence + travel data
    ├── fetch-airdna-data/                # Executive: AirDNA market comps (BYOK)
    └── fetch-str-data/                   # Executive: STR hospitality benchmarks (BYOK)

docs/
├── SETUP.md                   # Local dev setup guide
├── DEPLOYMENT.md              # CI/CD, env vars, CRON setup
├── ARCHITECTURE.md            # This file
└── supabase-migrations/       # SQL migration scripts (001-006, 012-020)
```

---

## 4. Routing & Pages

All routes are defined in `src/App.tsx`. Key mapping:

| Route | Page Component | Access | Description |
|-------|---------------|--------|-------------|
| `/` | `Index` | Public | Landing page |
| `/rentals` | `Rentals` | Auth | Browse active listings + voice/text search |
| `/property/:id` | `PropertyDetail` | Public | Listing detail + book |
| `/list-property` | `ListProperty` | Owner | Create a new listing |
| `/login` | `Login` | Public | Email/password + Google |
| `/signup` | `Signup` | Public | Registration |
| `/owner-dashboard` | `OwnerDashboard` | Owner | Tabbed: properties, listings, bookings, earnings, verification |
| `/admin` | `AdminDashboard` | RAV Team | Tabbed: overview, users, listings, bookings, verifications, escrow, payouts, financials, issues |
| `/executive-dashboard` | `ExecutiveDashboard` | RAV Owner | Investor-grade strategy dashboard (dark theme) |
| `/bidding` | `BiddingMarketplace` | Auth | Browse biddable listings + travel requests |
| `/my-bids` | `MyBidsDashboard` | Auth | Traveler's bid & request management |
| `/my-bookings` | `MyBookings` | Auth | Renter booking history (upcoming/past/cancelled) |
| `/account` | `AccountSettings` | Auth | Profile editing, password change, account info |
| `/checkin` | `TravelerCheckin` | Auth | Post-arrival confirmation |
| `/booking-success` | `BookingSuccess` | Auth | Post-payment summary |
| `/documentation` | `Documentation` | RAV Team | Admin product manual |
| `/user-guide` | `UserGuide` | Public | Owner/traveler guide |
| `/destinations` | `Destinations` | Public | Destination directory |
| `/calculator` | `MaintenanceFeeCalculator` | Public | Free break-even calculator for timeshare owners (SEO magnet) |
| `/faq` | `FAQ` | Public | FAQ (with JSON-LD FAQPage schema) |
| `/terms` | `Terms` | Public | Terms of service |
| `/privacy` | `Privacy` | Public | Privacy policy |
| `/contact` | `Contact` | Public | Contact form |

**Legacy redirects:** `/deals` → `/rentals`, `/owner-resources` `/pricing` `/success-stories` → `/how-it-works`, `/owner-faq` → `/faq`

---

## 5. Authentication & RBAC

### Auth Flow (`src/contexts/AuthContext.tsx`)

```
User Action → Supabase Auth → onAuthStateChange listener
                                    ↓
                          Fetch profile + roles in parallel
                                    ↓
                          Set user/session/profile/roles state
```

**Methods provided:**
- `signUp(email, password, fullName)` — creates user, triggers profile auto-creation via DB trigger
- `signIn(email, password)` — email/password login
- `signInWithGoogle()` — OAuth redirect flow
- `signOut()` — clears all state

### Role Hierarchy

| Role | Badge | Capabilities |
|------|-------|-------------|
| `rav_owner` | 👑 Crown | Full access, role management |
| `rav_admin` | 🛡️ Shield | Full access except role management |
| `rav_staff` | 📋 Briefcase | View/manage listings and bookings |
| `property_owner` | ✓ Verified | Manage own properties, listings, bookings |
| `renter` | 🧳 Traveler | Browse, bid, book (default role) |

**Role checks available:**
- `hasRole(role)` — exact role check
- `isRavTeam()` — any of `rav_owner`, `rav_admin`, `rav_staff`
- `isPropertyOwner()` — `property_owner` role
- `isRenter()` — `renter` role

**DB Functions (security definers to prevent RLS recursion):**
- `has_role(_user_id, _role)` → boolean
- `get_user_roles(_user_id)` → AppRole[]
- `is_rav_team(_user_id)` → boolean
- `calculate_fair_value_score(p_listing_id)` → JSONB (tier, range_low/high, avg_accepted_bid, comparable_count)
- `get_owner_dashboard_stats(p_owner_id)` → JSONB (total_earned_ytd, active_listings, active_bids, maintenance fees, coverage %)
- `get_owner_monthly_earnings(p_owner_id)` → TABLE(month, earnings, booking_count)

---

## 6. Database Schema

### Entity Relationship Diagram

```
auth.users (Supabase managed)
    │
    ├── 1:1 ── profiles (auto-created on signup)
    ├── 1:N ── user_roles (RBAC)
    ├── 1:N ── properties (owner's vacation club units)
    │               │
    │               └── 1:N ── listings (available rental periods)
    │                              │
    │                              ├── 1:N ── listing_bids (traveler bids)
    │                              ├── 1:1 ── bookings (confirmed reservation)
    │                              │              │
    │                              │              ├── 1:1 ── booking_confirmations (resort conf#)
    │                              │              ├── 1:1 ── checkin_confirmations (arrival)
    │                              │              ├── 1:N ── cancellation_requests
    │                              │              └── 1:1 ── platform_guarantee_fund
    │                              └── 1:N ── travel_proposals (owner responses)
    │
    ├── 1:1 ── owner_agreements (commission terms)
    ├── 1:1 ── owner_verifications (trust/KYC)
    │               └── 1:N ── verification_documents
    ├── 1:N ── travel_requests (traveler-initiated)
    └── 1:N ── notifications
```

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User profile data | `id` (FK→auth.users), `email`, `full_name`, `phone`, `avatar_url` |
| `user_roles` | RBAC assignments | `user_id`, `role` (enum) |
| `properties` | Vacation club units | `owner_id`, `brand` (enum), `resort_name`, `location`, `bedrooms`, `amenities[]`, `images[]` |
| `owner_agreements` | Commission contracts | `owner_id`, `commission_rate`, `markup_allowed`, `max_markup_percent`, `status` |
| `listings` | Available rental periods | `property_id`, `owner_id`, `check_in_date`, `check_out_date`, `nightly_rate`, `owner_price`, `rav_markup`, `final_price`, `status`, `cancellation_policy` |
| `bookings` | Confirmed reservations | `listing_id`, `renter_id`, `total_amount`, `rav_commission`, `owner_payout`, `payment_intent_id`, `payout_status` |
| `booking_confirmations` | Resort confirmation + owner acceptance tracking | `booking_id`, `resort_confirmation_number`, `confirmation_deadline`, `escrow_status`, `escrow_amount`, `owner_confirmation_status`, `owner_confirmation_deadline`, `extensions_used` |
| `checkin_confirmations` | Arrival verification | `booking_id`, `traveler_id`, `confirmed_arrival`, `issue_reported`, `issue_type` |
| `cancellation_requests` | Cancellation workflow | `booking_id`, `requester_id`, `status`, `policy_refund_amount`, `final_refund_amount` |
| `owner_verifications` | Trust & KYC | `owner_id`, `trust_level` (new→verified→trusted→premium), `kyc_verified`, `verification_status` |
| `verification_documents` | Uploaded docs | `owner_id`, `doc_type` (deed, certificate, ID, etc.), `file_path`, `status` |
| `platform_guarantee_fund` | Safety fund contributions | `booking_id`, `contribution_amount`, `claim_reason` |

### Bidding Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `listing_bids` | Bids on listings | `listing_id`, `bidder_id`, `bid_amount`, `status`, `counter_offer_amount`, `requested_check_in`, `requested_check_out` |
| `travel_requests` | Traveler reverse-auctions | `traveler_id`, `destination_location`, dates, `budget_preference`, `proposals_deadline`, `source_listing_id`, `target_owner_only` |
| `travel_proposals` | Owner responses to requests | `request_id`, `property_id`, `owner_id`, `proposed_price`, `valid_until` |
| `notifications` | In-app alerts | `user_id`, `type` (enum), `title`, `message`, linked IDs |

### Enums (defined in DB and mirrored in `src/types/database.ts`)

`app_role`, `listing_status`, `booking_status`, `payout_status`, `agreement_status`, `vacation_club_brand`, `cancellation_policy`, `cancellation_status`, `owner_trust_level`, `verification_doc_type`, `verification_status`, `escrow_status`, `owner_confirmation_status`

### Migrations

Run in order via Supabase SQL Editor:

| # | File | What it creates |
|---|------|----------------|
| 001 | `initial_schema.sql` | profiles, user_roles, properties, owner_agreements, listings, bookings, RLS policies, triggers |
| 002 | `seed_data.sql` | Sample properties and listings (optional) |
| 003 | `bidding_system.sql` | listing_bids, travel_requests, travel_proposals, notifications, notification_preferences |
| 004 | `payout_tracking.sql` | Payout fields on bookings, booking_confirmations, checkin_confirmations |
| 005 | `cancellation_policies.sql` | cancellation_requests, policy enum, refund calculation function |
| 006 | `owner_verification.sql` | owner_verifications, verification_documents, trust levels, platform_guarantee_fund |
| 012 | `phase13_core_business.sql` | property-images storage bucket, owner confirmation columns on booking_confirmations, owner confirmation system_settings, `extend_owner_confirmation_deadline` RPC |
| 013 | `executive_dashboard_settings.sql` | Executive dashboard system_settings keys (newsapi_key, airdna_api_key, str_api_key, refresh_interval) |
| 014 | `platform_staff_only.sql` | `platform_staff_only` system setting + `can_access_platform()` RPC for pre-launch lock |
| 015 | `seed_foundation_flag.sql` | `profiles.is_seed_foundation` boolean column + partial index for seed data management |
| 016 | `fair_value_score.sql` | `calculate_fair_value_score(listing_id)` RPC — comparable bid analysis with P25/P75 tiers |
| 017 | `owner_dashboard.sql` | `profiles.annual_maintenance_fees` column, `get_owner_dashboard_stats(owner_id)` + `get_owner_monthly_earnings(owner_id)` RPCs |
| 018 | `travel_request_enhancements.sql` | `notification_type` enum: `travel_request_expiring_soon`, `travel_request_matched` |
| 019 | `profiles_fk_constraints.sql` | Redirects 10 tables' user FK columns from `auth.users(id)` to `profiles(id)` for PostgREST embedding |
| 020 | `flexible_dates_nightly_pricing.sql` | `listings.nightly_rate` column (backfilled), `listing_bids.requested_check_in/out` date proposal fields, `travel_requests.source_listing_id` + `target_owner_only` |

---

## 7. Core Business Flows

### 7.1 Listing & Booking Flow

```
Owner creates Property → Owner creates Listing (draft)
        ↓
RAV admin approves → status = 'active'
        ↓
Traveler browses /rentals → views /property/:id
        ↓
Traveler clicks "Book Now" → Edge Function: create-booking-checkout
        ↓
Stripe Checkout → payment captured → verify-booking-payment (client) + stripe-webhook (server)
        ↓
Booking created (status: confirmed) + booking_confirmation created
        ↓
Owner Acceptance (configurable timer, default 60 min, up to 2 extensions of 30 min)
  → Owner confirms → proceed to resort confirmation
  → Owner times out or declines → auto-cancel, full refund
        ↓
Owner submits resort confirmation # before 48h deadline
        ↓
RAV verifies → escrow_status: verified → released after checkout + 5 days
```

### 7.2 Escrow & Payout Flow

```
Payment captured → funds held in escrow (escrow_status: pending_confirmation)
        ↓
Owner submits resort confirmation → escrow_status: confirmation_submitted
        ↓
RAV staff verifies → escrow_status: verified
        ↓
Traveler checks in + confirms arrival → escrow_status: released
        ↓
Payout to owner (checkout_date + 5 days) → payout_status: paid
```

### 7.3 Cancellation Flow

```
Traveler requests cancellation → cancellation_request created
        ↓
System calculates policy_refund_amount (based on cancellation_policy + days_until_checkin)
        ↓
Owner responds: approve / deny / counter_offer
        ↓
If approved → refund processed → escrow refunded
If counter_offer → traveler accepts/rejects → resolve
```

**Cancellation policies** (`src/lib/cancellation.ts`):
- **Flexible:** 100% refund ≥1 day before check-in
- **Moderate:** 100% ≥5 days, 50% 1-4 days
- **Strict:** 50% ≥7 days, 0% after
- **Super Strict:** No refunds

### 7.4 Check-in Flow

```
Traveler arrives → navigates to /checkin
        ↓
Confirms arrival OR reports issue (access problem, safety concern, mismatch)
        ↓
If issue → admin notified → resolution tracked in checkin_confirmations
If OK → booking proceeds → payout released after checkout
```

---

## 8. Edge Functions (Backend)

All edge functions live in `supabase/functions/` and run on Deno. They share a common email template from `_shared/email-template.ts`.

| Function | Trigger | Purpose |
|----------|---------|---------|
| `create-booking-checkout` | Client call | Creates Stripe Checkout session with listing details |
| `verify-booking-payment` | Client call (post-redirect) | Client-side payment verification after Stripe redirect — updates booking status, creates booking_confirmation with owner acceptance timer, **sends traveler confirmation email + owner confirmation request** |
| `stripe-webhook` | **Stripe webhook** | Server-side safety net for payment verification, session expiry, refunds, Connect account updates, and transfer tracking. Handles 6 event types. Idempotent. |
| `create-connect-account` | Client call (owner) | Creates Stripe Express account for owner + generates onboarding link. Stores account ID in profiles. |
| `create-stripe-payout` | Client call (admin) | Initiates Stripe Transfer to owner's connected account. Updates booking payout_status + sends notification email. |
| `process-cancellation` | Client call (renter/owner) | Processes booking cancellation with policy-based refund. Creates Stripe refund, cancellation request record, updates booking/listing/escrow status, sends cancellation email. |
| `send-email` | Client call | Generic email dispatch via Resend API |
| `send-approval-email` | Client call | Sends approval/rejection emails for listings and users (4 variants) |
| `send-booking-confirmation-reminder` | Client/internal | Reminds owner to submit resort confirmation + owner acceptance notifications (request, extension, timeout) |
| `send-cancellation-email` | Internal | Notifies traveler of cancellation status (submitted, approved, denied, counter_offer) |
| `send-verification-notification` | Client call | Alerts admin when owner uploads verification docs |
| `process-deadline-reminders` | **CRON (pg_cron, every 30 min)** | Scans for upcoming deadlines, sends reminder emails, processes owner confirmation timeouts (auto-cancel + refund), sends travel request expiry warnings (48h before deadline) |
| `match-travel-requests` | Internal (admin listing approval) | Matches newly approved listings against open travel requests by destination, dates, bedrooms, budget, brand. Creates in-app notifications + sends email. Budget-aware (undisclosed budgets don't reveal pricing). |
| `voice-search` | VAPI webhook | Property search via voice — shared `_shared/property-search.ts` module, state name/abbreviation expansion |
| `text-chat` | Client call | OpenRouter LLM chat with SSE streaming, tool calling (`search_properties`), 4 context modes (rentals/property-detail/bidding/general). Model: `google/gemini-3-flash-preview`. Auth: manual JWT verification (`--no-verify-jwt`) |
| `seed-manager` | Client call | DEV only: 3-layer seed data system — status, reseed, restore-user actions. Production guard via `IS_DEV_ENVIRONMENT` secret |
| `fetch-industry-news` | Client call | Fetches NewsAPI + Google News RSS for vacation rental industry (60-min cache, NEWSAPI_KEY secret) |
| `fetch-macro-indicators` | Client call | Fetches FRED consumer confidence + travel data (public API, no key) |
| `fetch-airdna-data` | Client call | Fetches AirDNA market comp data (BYOK — user-supplied API key) |
| `fetch-str-data` | Client call | Fetches STR hospitality benchmarks (BYOK — user-supplied API key) |

### Required Secrets (set in Supabase Dashboard)

| Secret | Used by |
|--------|---------|
| `RESEND_API_KEY` | All email functions (domain: `updates.rent-a-vacation.com`) |
| `STRIPE_SECRET_KEY` | create-booking-checkout, verify-booking-payment, stripe-webhook, create-connect-account, create-stripe-payout |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook (webhook signature verification) |
| `NEWSAPI_KEY` | fetch-industry-news |
| `OPENROUTER_API_KEY` | text-chat |
| `IS_DEV_ENVIRONMENT` | seed-manager (production guard) |

### Required Secrets (GitHub Repository)

| Secret | Used by |
|--------|---------|
| `RESEND_GITHUB_NOTIFICATIONS_KEY` | `.github/workflows/issue-notifications.yml` — emails RAV team on issue events |

---

## 9. Email System

### Architecture

Two parallel implementations, both using the same visual design:

1. **Edge Functions** (server-side): Import `buildEmailHtml()` from `_shared/email-template.ts`
2. **Client-side** (`src/lib/email.ts`): Has its own `wrapEmail()` function mirroring the same design

### Shared Template API (`_shared/email-template.ts`)

```typescript
buildEmailHtml({
  recipientName?: string,   // "Hi {name},"
  heading: string,          // Displayed in branded header bar
  body: string,             // HTML content
  cta?: { label, url },     // Orange CTA button
  footerNote?: string       // Override default tagline
}): string

detailRow(label, value): string   // "Resort: Hilton Grand"
infoBox(content, variant): string // Colored info/warning/success/error box
```

### Emails Sent

| Email | Trigger | Recipient |
|-------|---------|-----------|
| Welcome | User signup | New user |
| Booking Confirmed | Payment verified | Traveler |
| Confirmation Reminder (standard) | CRON, 6-12h before deadline | Owner |
| Confirmation Reminder (urgent) | CRON, <6h before deadline | Owner |
| Check-in Reminder | CRON, near arrival | Traveler |
| Cancellation Submitted | Request created | Traveler |
| Cancellation Approved | Owner approves | Traveler |
| Cancellation Denied | Owner denies | Traveler |
| Cancellation Counter-Offer | Owner counter-offers | Traveler |
| Owner Confirmation Request | Payment verified | Owner |
| Owner Extension Notification | Owner requests extension | Renter |
| Owner Confirmation Timeout | Owner times out | Owner + Renter |
| Listing Approved | Admin approves listing | Owner |
| Listing Rejected | Admin rejects listing | Owner |
| User Approved | Admin approves user | User |
| User Rejected | Admin rejects user | User |
| Verification Doc Uploaded | Doc upload | RAV admin |
| Contact Form | Form submission | support@rent-a-vacation.com |

---

## 10. Bidding & Marketplace

Two-sided marketplace modeled after Priceline:

### Owner-Initiated Bidding

1. Owner opens a listing for bidding (`open_for_bidding = true`)
2. Sets `bidding_ends_at`, optional `min_bid_amount`, `reserve_price`
3. Travelers place bids via `BidFormDialog`
4. Owner reviews in `BidsManagerDialog` → accept / reject / counter-offer

### Traveler-Initiated (Reverse Auction)

1. Traveler posts a `TravelRequest` with destination, dates, budget, requirements
2. Property owners browse open requests on `/bidding`
3. Owners submit `TravelProposal` with property, price, dates
4. Traveler reviews proposals → accept (→ booking) or reject

### Data Hooks (`src/hooks/useBidding.ts`)

| Hook | Returns |
|------|---------|
| `useListingsOpenForBidding()` | Active biddable listings |
| `useBidsForListing(id)` | Bids on a specific listing |
| `useMyBids()` | Current user's bids |
| `useCreateBid()` | Mutation: place a bid |
| `useUpdateBidStatus()` | Mutation: accept/reject/counter |
| `useOpenListingForBidding()` | Mutation: flag listing for bidding |
| `useOpenTravelRequests()` | Active travel requests |
| `useMyTravelRequests()` | Current user's requests |
| `useCreateTravelRequest()` | Mutation: post request |
| `useProposalsForRequest(id)` | Proposals on a request |
| `useMyProposals()` | Current user's proposals |
| `useCreateProposal()` | Mutation: submit proposal |
| `useUpdateProposalStatus()` | Mutation: accept/reject |
| `useNotifications(limit)` | User notifications (auto-refresh 30s) |
| `useUnreadNotificationCount()` | Badge count |
| `useMarkNotificationRead()` | Mutation: mark as read |
| `useMarkAllNotificationsRead()` | Mutation: mark all read |

---

## 11. Design System

### Tokens (`src/index.css`)

All colors defined as HSL values in CSS custom properties:

| Token | Light Mode | Usage |
|-------|-----------|-------|
| `--primary` | `175 60% 28%` | Deep teal — buttons, links, brand |
| `--accent` | `18 85% 58%` | Warm coral — CTAs, highlights |
| `--background` | `45 25% 97%` | Page background |
| `--foreground` | `200 25% 15%` | Primary text |
| `--secondary` | `40 30% 94%` | Soft sand — secondary surfaces |
| `--muted` | `45 15% 92%` | Subtle backgrounds |
| `--destructive` | `0 84.2% 60.2%` | Error/delete |
| `--success` | `160 60% 40%` | Success states |
| `--warning` | `38 92% 50%` | Warning states |

**Dark mode** is fully themed with inverted token values.

### Typography

- **Font:** Roboto (imported from Google Fonts)
- Used for both display and body text (`--font-display`, `--font-body`)

### Component Library

Built on **shadcn/ui** (Radix primitives + Tailwind). All components in `src/components/ui/`.

**CRITICAL RULE:** Never use hardcoded color classes (`text-white`, `bg-black`). Always use semantic tokens (`text-foreground`, `bg-primary`, etc.).

---

## 12. State Management

| Concern | Solution | Location |
|---------|---------|----------|
| Auth state | React Context | `AuthContext.tsx` |
| Server data | TanStack React Query v5 | Custom hooks (`useBidding.ts`, page-level queries) |
| Form state | React Hook Form + Zod | Inline in page/dialog components |
| UI state | Local `useState` | Component-level |
| Notifications | Toast (sonner + shadcn) | `toast()` / `toast.success()` |

**Query client** instantiated in `App.tsx`, wraps entire app.

---

## 13. Environments & Deployment

| Environment | Frontend | Database | Purpose |
|-------------|----------|----------|---------|
| **Development** | Lovable Preview | Supabase DEV (`oukbxqnlxnkainnligfz`) | Active dev |
| **Preview** | Vercel Preview | Supabase DEV | PR reviews |
| **Production** | Vercel (`rentavacation.lovable.app`) | Supabase PROD (`xzfllqndrlmhclqfybew`) | Live users |

### Deployment Pipeline

```
Lovable Editor → GitHub main → Vercel auto-deploy → Production
                                                        ↓
                                               Supabase PROD
```

**Edge functions** must be deployed manually via Supabase CLI (see `docs/DEPLOYMENT.md`).

### Environment Variables

| Variable | Where Set |
|----------|-----------|
| `VITE_SUPABASE_URL` | Vercel env vars |
| `VITE_SUPABASE_ANON_KEY` | Vercel env vars |
| `RESEND_API_KEY` | Supabase Edge Function secrets |
| `STRIPE_SECRET_KEY` | Supabase Edge Function secrets |

---

## 14. Key Conventions

### Code Style

- **TypeScript strict mode** — no `any` unless unavoidable (marked with eslint-disable)
- **Functional components only** — no class components
- **Named exports** for hooks and utilities; **default exports** for pages
- **Parallel data fetching** — `Promise.all()` where possible
- **Error handling** — try/catch in async functions, toast on failure

### File Organization

- **One component per file** — keep files focused (<300 lines ideally)
- **Colocate related code** — admin components in `admin/`, bidding in `bidding/`, etc.
- **Types in `src/types/`** — shared across components
- **Hooks in `src/hooks/`** — reusable data logic
- **Libs in `src/lib/`** — pure utility functions (no React)

### Database

- **All tables have RLS** — never bypass
- **Security definer functions** — used for role checks to prevent RLS recursion
- **Triggers** — auto-create profile on signup, auto-assign `renter` role
- **Enums** — defined in DB, mirrored in `src/types/database.ts`
- **FK constraints for PostgREST** — user-related FK columns MUST reference `profiles(id)`, NOT `auth.users(id)`. PostgREST only traverses FKs within the `public` schema (migration 019)

### Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `BidFormDialog.tsx` |
| Hooks | camelCase, `use` prefix | `useBidding.ts` |
| Types | PascalCase | `ListingWithBidding` |
| Enums | snake_case (DB) | `pending_confirmation` |
| CSS tokens | kebab-case | `--primary-foreground` |
| DB tables | snake_case | `booking_confirmations` |
| Edge functions | kebab-case dirs | `create-booking-checkout/` |

### Storage Buckets

| Bucket | Access | Structure |
|--------|--------|-----------|
| `property-images` | Public read, owner write | `{owner_id}/{filename}` |
| `verification-documents` | Private | `{owner_id}/{filename}` |

---

## 15. SEO & Meta Tags

### Per-Page Meta (`src/hooks/usePageMeta.ts`)

Lightweight hook that sets `document.title` and meta description on mount, resets on unmount. Used by all 11 public pages.

```typescript
usePageMeta('Page Title', 'Meta description for search engines.');
```

### Static SEO Assets

| File | Purpose |
|------|---------|
| `public/sitemap.xml` | 10 public routes, calculator at priority 0.9 |
| `public/robots.txt` | Sitemap ref + disallow rules for admin/private routes |
| `index.html` | OG image, twitter card, canonical URL, Organization JSON-LD |

### Structured Data

- **Organization** (`index.html`) — JSON-LD with name, logo, social links
- **FAQPage** (`FAQ.tsx`) — JSON-LD for all 22 Q&A pairs, injected via useEffect

### OG Image

Uses `/android-chrome-512x512.png` (absolute URL with domain). The `.svg` logo exists but OG requires a raster image.

---

## 16. Voice Admin & Observability

### Admin Voice Tab (`/admin` → Voice tab)

5 management sections for the RAV team:

| Component | Purpose |
|-----------|---------|
| `VoiceConfigInfo` | Current VAPI config display |
| `VoiceTierQuotaManager` | Edit daily voice quotas per membership tier |
| `VoiceUserOverrideManager` | Per-user disable/custom quota overrides |
| `VoiceUsageDashboard` | Recharts usage charts + top users table |
| `VoiceObservability` | Search log viewer + alert threshold config |

### Quota Resolution Chain

`get_user_voice_quota()` RPC resolves in order:
1. RAV team → unlimited
2. `voice_user_overrides` → custom quota (or disabled if `is_disabled = true`)
3. `membership_tiers.voice_quota_daily` → tier-based (Free 5, Plus/Pro 25, Premium/Business -1=unlimited)
4. Default → 5/day

### Tables (Migration 021)

- `voice_search_logs` — per-search log (user, query, results, latency)
- `voice_user_overrides` — per-user voice controls

---

## Quick Start for New Developers

1. Read `docs/SETUP.md` for local environment setup
2. Read `docs/DEPLOYMENT.md` for deployment & CRON configuration
3. Start with `src/App.tsx` to understand routing
4. Review `src/types/database.ts` for the complete data model
5. Check `src/contexts/AuthContext.tsx` for auth patterns
6. Look at `src/hooks/useBidding.ts` for data fetching patterns
7. Reference this document for architecture decisions and flow understanding

**Questions?** Reach out to the team at support@rent-a-vacation.com | 1-800-RAV-0800
