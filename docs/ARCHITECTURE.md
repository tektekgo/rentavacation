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
│   ├── admin/                 # Admin dashboard tab components
│   │   ├── AdminOverview.tsx       # KPI cards, charts
│   │   ├── AdminUsers.tsx          # User & role management
│   │   ├── AdminListings.tsx       # Listing approval workflow
│   │   ├── AdminBookings.tsx       # All bookings view
│   │   ├── AdminProperties.tsx     # Property oversight
│   │   ├── AdminVerifications.tsx  # Owner document review
│   │   ├── AdminEscrow.tsx         # Escrow status management
│   │   ├── AdminPayouts.tsx        # Owner payout tracking
│   │   ├── AdminFinancials.tsx     # Revenue reports
│   │   └── AdminCheckinIssues.tsx  # Traveler issue resolution
│   ├── bidding/               # Bidding marketplace components
│   │   ├── BidFormDialog.tsx       # Place a bid on listing
│   │   ├── BidsManagerDialog.tsx   # Owner manages incoming bids
│   │   ├── OpenForBiddingDialog.tsx # Owner opens listing for bids
│   │   ├── TravelRequestCard.tsx   # Display travel request
│   │   ├── TravelRequestForm.tsx   # Create travel request
│   │   ├── ProposalFormDialog.tsx  # Owner proposes to travel request
│   │   └── NotificationBell.tsx   # Real-time notification icon
│   ├── owner/                 # Owner dashboard components
│   │   ├── OwnerProperties.tsx     # CRUD properties
│   │   ├── OwnerListings.tsx       # Manage listings
│   │   ├── OwnerBookings.tsx       # View bookings on owned listings
│   │   ├── OwnerBookingConfirmations.tsx # Submit resort confirmation
│   │   ├── OwnerEarnings.tsx       # Revenue & payout tracking
│   │   ├── OwnerProposals.tsx      # Sent proposals to travelers
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
│   ├── useBidding.ts          # All bidding queries & mutations (~600 lines)
│   └── use-mobile.tsx         # Responsive breakpoint hook
├── lib/
│   ├── supabase.ts            # Supabase client initialization
│   ├── email.ts               # Client-side email helpers (welcome, contact)
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
│   └── bidding.ts             # Bidding system types
├── index.css                  # Design system tokens (HSL)
├── App.tsx                    # Router + providers
└── main.tsx                   # Entry point

supabase/
├── config.toml                # Edge function registration
└── functions/
    ├── _shared/
    │   └── email-template.ts  # Unified email layout (buildEmailHtml, detailRow, infoBox)
    ├── create-booking-checkout/   # Stripe checkout session creation
    ├── verify-booking-payment/    # Stripe webhook → update booking + send confirmation email
    ├── send-email/                # Generic email dispatch via Resend
    ├── send-booking-confirmation-reminder/  # Owner deadline reminders
    ├── send-cancellation-email/   # Traveler cancellation notifications
    ├── send-verification-notification/     # Admin notification on doc upload
    └── process-deadline-reminders/         # CRON: scan & send overdue reminders

docs/
├── SETUP.md                   # Local dev setup guide
├── DEPLOYMENT.md              # CI/CD, env vars, CRON setup
├── ARCHITECTURE.md            # This file
└── supabase-migrations/       # SQL migration scripts (001-006)
```

---

## 4. Routing & Pages

All routes are defined in `src/App.tsx`. Key mapping:

| Route | Page Component | Access | Description |
|-------|---------------|--------|-------------|
| `/` | `Index` | Public | Landing page |
| `/rentals` | `Rentals` | Public | Browse active listings |
| `/property/:id` | `PropertyDetail` | Public | Listing detail + book |
| `/list-property` | `ListProperty` | Owner | Create a new listing |
| `/login` | `Login` | Public | Email/password + Google |
| `/signup` | `Signup` | Public | Registration |
| `/owner-dashboard` | `OwnerDashboard` | Owner | Tabbed: properties, listings, bookings, earnings, verification |
| `/admin` | `AdminDashboard` | RAV Team | Tabbed: overview, users, listings, bookings, verifications, escrow, payouts, financials, issues |
| `/bidding` | `BiddingMarketplace` | Auth | Browse biddable listings + travel requests |
| `/my-bids` | `MyBidsDashboard` | Auth | Traveler's bid & request management |
| `/checkin` | `TravelerCheckin` | Auth | Post-arrival confirmation |
| `/booking-success` | `BookingSuccess` | Auth | Post-payment summary |
| `/documentation` | `Documentation` | RAV Team | Admin product manual |
| `/user-guide` | `UserGuide` | Public | Owner/traveler guide |
| `/destinations` | `Destinations` | Public | Destination directory |
| `/faq` | `FAQ` | Public | FAQ |
| `/terms` | `Terms` | Public | Terms of service |
| `/privacy` | `Privacy` | Public | Privacy policy |

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
| `listings` | Available rental periods | `property_id`, `owner_id`, `check_in_date`, `check_out_date`, `owner_price`, `rav_markup`, `final_price`, `status`, `cancellation_policy` |
| `bookings` | Confirmed reservations | `listing_id`, `renter_id`, `total_amount`, `rav_commission`, `owner_payout`, `payment_intent_id`, `payout_status` |
| `booking_confirmations` | Resort confirmation tracking | `booking_id`, `resort_confirmation_number`, `confirmation_deadline`, `escrow_status`, `escrow_amount` |
| `checkin_confirmations` | Arrival verification | `booking_id`, `traveler_id`, `confirmed_arrival`, `issue_reported`, `issue_type` |
| `cancellation_requests` | Cancellation workflow | `booking_id`, `requester_id`, `status`, `policy_refund_amount`, `final_refund_amount` |
| `owner_verifications` | Trust & KYC | `owner_id`, `trust_level` (new→verified→trusted→premium), `kyc_verified`, `verification_status` |
| `verification_documents` | Uploaded docs | `owner_id`, `doc_type` (deed, certificate, ID, etc.), `file_path`, `status` |
| `platform_guarantee_fund` | Safety fund contributions | `booking_id`, `contribution_amount`, `claim_reason` |

### Bidding Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `listing_bids` | Bids on listings | `listing_id`, `bidder_id`, `bid_amount`, `status`, `counter_offer_amount` |
| `travel_requests` | Traveler reverse-auctions | `traveler_id`, `destination_location`, dates, `budget_preference`, `proposals_deadline` |
| `travel_proposals` | Owner responses to requests | `request_id`, `property_id`, `owner_id`, `proposed_price`, `valid_until` |
| `notifications` | In-app alerts | `user_id`, `type` (enum), `title`, `message`, linked IDs |

### Enums (defined in DB and mirrored in `src/types/database.ts`)

`app_role`, `listing_status`, `booking_status`, `payout_status`, `agreement_status`, `vacation_club_brand`, `cancellation_policy`, `cancellation_status`, `owner_trust_level`, `verification_doc_type`, `verification_status`, `escrow_status`

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
Stripe Checkout → payment captured → webhook: verify-booking-payment
        ↓
Booking created (status: confirmed) + booking_confirmation created
        ↓
Owner submits resort confirmation # before deadline
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
| `verify-booking-payment` | Stripe webhook | Validates payment, updates booking status, creates booking_confirmation, **sends traveler confirmation email** |
| `send-email` | Client call | Generic email dispatch via Resend API |
| `send-booking-confirmation-reminder` | Client/internal | Reminds owner to submit resort confirmation |
| `send-cancellation-email` | Internal | Notifies traveler of cancellation status (submitted, approved, denied, counter_offer) |
| `send-verification-notification` | Client call | Alerts admin when owner uploads verification docs |
| `process-deadline-reminders` | **CRON (pg_cron, every 30 min)** | Scans for upcoming deadlines, sends reminder emails |

### Required Secrets (set in Supabase Dashboard)

| Secret | Used by |
|--------|---------|
| `RESEND_API_KEY` | All email functions |
| `STRIPE_SECRET_KEY` | create-booking-checkout, verify-booking-payment |

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
| Verification Doc Uploaded | Doc upload | RAV admin |
| Contact Form | Form submission | support@rentavacation.com |

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
| `property-images` | Private | `{owner_id}/{filename}` |
| `verification-documents` | Private | `{owner_id}/{filename}` |

---

## Quick Start for New Developers

1. Read `docs/SETUP.md` for local environment setup
2. Read `docs/DEPLOYMENT.md` for deployment & CRON configuration
3. Start with `src/App.tsx` to understand routing
4. Review `src/types/database.ts` for the complete data model
5. Check `src/contexts/AuthContext.tsx` for auth patterns
6. Look at `src/hooks/useBidding.ts` for data fetching patterns
7. Reference this document for architecture decisions and flow understanding

**Questions?** Reach out to the team at support@rentavacation.com | 1-800-RAV-0800
