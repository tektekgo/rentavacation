# Executive Dashboard - Project Brief

**Feature Name:** Executive Dashboard  
**Route:** `/executive-dashboard`  
**Phase:** 14  
**Status:** 🟡 Planning  
**Created:** February 20, 2026  
**Docs:** `docs/features/executive-dashboard/`

---

## Overview

A premium, investor-grade executive dashboard accessible only to the `rav_owner` role (configurable). This is a **boardroom-quality** view of the entire Rent-A-Vacation business — designed to impress VCs and give the business owner strategic insight at a glance.

This is intentionally a **separate product** from the Admin Command Center (`/admin-dashboard`). The admin dashboard is operational and utilitarian. This dashboard is strategic, trend-focused, and premium in design.

**Primary audiences:**
- RAV Owner (Sujit) — daily strategic view
- VC/Investor demos — showing business sophistication
- Future: configurable to open to `rav_admin` role

---

## Problem It Solves

1. No single place exists to see the business health story — GMV, unit economics, marketplace liquidity, and market context all in one view
2. VC demos currently have no "wow moment" for business intelligence
3. No proprietary metrics exist that differentiate RAV from generic SaaS dashboards
4. Market intelligence (industry news, regulatory changes, competitor context) is not surfaced anywhere

---

## Goals

- ✅ Impress VCs with operational and strategic sophistication
- ✅ Show Story C+B: "We've built infrastructure that can scale, in a market nobody has properly served"
- ✅ Display proprietary marketplace metrics no competitor can show
- ✅ Live industry news feed (free, always on)
- ✅ BYOK (Bring Your Own Key) architecture for premium data sources (AirDNA, STR Global)
- ✅ Demo Mode / Connected toggle for data sources not yet paid for
- ✅ Dark, premium design language — separate from the rest of the app

---

## Design Language

**This dashboard MUST feel different from the rest of the app.**

- **Theme:** Dark — slate-900/slate-800 backgrounds, NOT the app's white/light theme
- **Accents:** Electric blue (`blue-400/500`) and emerald green (`emerald-400/500`)
- **Typography:** Larger numbers, tighter labels, data-dense but not cluttered
- **Feel:** Bloomberg Terminal meets Airbnb investor relations page
- **Tone:** "Boardroom" — every element should feel like it belongs on a projected screen

**Implementation note:** Use a `dark` class wrapper on the page root so Tailwind dark mode applies. Do NOT use `dark:` variants — just build it dark-first.

---

## Data Architecture — Three Tiers

### Tier 1 — Always Live (Supabase)
Real data from your own database. Always on, no API keys needed.

| Metric | Source Table |
|--------|-------------|
| GMV | `bookings.total_amount` WHERE status = 'confirmed' |
| Platform Revenue | `bookings.rav_commission` |
| Active Listings | `listings` WHERE status = 'active' |
| Active Owners | `user_roles` WHERE role = 'property_owner' + has active listing |
| Total Users | `profiles` count |
| Bookings count | `bookings` |
| Bid activity | `listing_bids` |
| Voice search usage | `voice_search_usage` |
| New signups | `profiles` grouped by created_at |

### Tier 2 — Live via Free APIs (no key needed)
Always on in both Demo and Connected modes.

| Feed | Source | Implementation |
|------|--------|----------------|
| Industry News | NewsAPI (free tier, 100 req/day) | Edge Function `fetch-industry-news` |
| Regulatory Alerts | Google News RSS | Direct RSS parse in Edge Function |
| Macro Indicators | FRED API (Federal Reserve, free) | Consumer confidence, travel index |

**NewsAPI free key:** Register at newsapi.org — 100 requests/day is sufficient for hourly refresh.
**FRED API:** No key required for public data.

### Tier 3 — BYOK Integrations (Demo Mode by default)
Shows sample data until API key is provided in Settings.

| Integration | Provider | What It Shows | Demo Default |
|------------|---------|---------------|-------------|
| Market Comps | AirDNA | Avg nightly rates, occupancy by destination | Sample — 5 destinations |
| STR Benchmarks | STR Global | RevPAR vs market avg | Sample — industry avg |

**BYOK UX Pattern:**
- Card shows "Demo Mode" badge (amber, subtle)
- Bottom of card: "Connect AirDNA →" CTA button
- Clicking opens Settings drawer → API key input field
- On save: card re-fetches with real data, badge changes to "Live ●" (green)
- Language: "Demo Mode" / "Connected" — NOT "Sample Data" / "Live Data"

---

## Dashboard Sections

### Section 1 — Headline Bar (sticky top)
Five KPI pills — always visible as you scroll.

```
GMV (All Time) | Platform Revenue | Active Listings | Liquidity Score™ | Voice Adoption %
```

Each pill shows: current value + trend arrow + % change vs last period.

### Section 2 — Business Performance (Tier 1 charts)

**2a. GMV Trend** — Area chart
- X: time (weekly/monthly/quarterly toggle)
- Y: dollar value
- Color: blue-to-emerald gradient fill
- Shows: GMV line + Platform Revenue line overlaid

**2b. Bid Activity** — Dual line chart
- Two lines: Bids Placed vs Bids Accepted
- Gap between lines = marketplace friction (narrowing = healthy)
- This chart is unique to RAV — no competitor can show this

**2c. Bid Spread Index** — Bar chart
- Average gap between traveler offer price and owner ask price over time
- Narrowing spread = price discovery working = healthy marketplace
- Proprietary metric — label it "RAV Bid Spread Index™"

**2d. Revenue Waterfall** — Stacked bar
- How gross booking value breaks into: owner payout + RAV commission
- Shows take rate visually — investors love this

### Section 3 — Marketplace Health (Proprietary Metrics)

**3a. Marketplace Liquidity Score™**
- Composite index: (bid_acceptance_rate × 0.4) + (days_to_book_normalized × 0.3) + (repeat_owner_rate × 0.3)
- Displayed as a gauge/dial, 0–100
- Color: red (<40) → amber (40–70) → green (>70)
- Label it prominently as proprietary — "RAV Marketplace Liquidity Score™"
- Target demo value: ~62 ("promising, room to grow" — credible, not suspicious)

**3b. Supply/Demand Heatmap**
- US map showing destinations
- Color intensity = demand/supply ratio (searches vs active listings)
- Red = undersupplied (opportunity), Green = balanced
- Tooltip on hover: "X searches, Y listings this month"
- Use Recharts with a simplified SVG map approach (no heavy mapping library)

**3c. Voice vs Traditional Conversion Funnel**
- Side-by-side funnel: Voice Search vs Traditional Search
- Steps: Searches → Property Views → Bids Placed → Bookings
- Highlights RAV's ~33% voice adoption as a differentiator
- Add callout: "33% of searches use Voice AI — industry first"

### Section 4 — Market Intelligence (Tier 2 + Tier 3)

**4a. Vacation Rental Market Index** (AirDNA — Tier 3 BYOK)
- Shows avg nightly rates for top 5 destinations vs RAV listings
- Demo mode: realistic sample data for Orlando, Maui, Cancun, Park City, Myrtle Beach
- "Demo Mode" badge + "Connect AirDNA →" CTA
- Chart type: grouped bar (market rate vs RAV listing price)

**4b. STR Market Benchmarks** (STR Global — Tier 3 BYOK)
- Occupancy rate % and RevPAR vs market average
- Demo mode: timeshare industry benchmarks
- Same BYOK pattern as 4a

**4c. Competitor Pricing Pulse** (Tier 1 — calculated from your data)
- Shows average listing price on RAV vs estimated market rate
- "Our listings price X% below/above market" — positioning statement
- Pulls from your listings data, no external API needed

### Section 5 — Industry Intelligence Feed (Tier 2 — always live)

**5a. Industry News Feed**
- NewsAPI filtered: "timeshare" OR "vacation rental" OR "vacation club" OR "short term rental"
- Shows: headline, source, published time, 1-sentence summary
- Refreshes every 60 minutes via Edge Function
- 7 items displayed, "Load More" below

**5b. Regulatory Radar**
- Google News RSS filtered: "short term rental ban" OR "STR regulation" OR "HOA rental"
- Displayed as timeline: state flag + headline + date
- "Regulatory risk" framing — shows RAV understands the operating environment

**5c. Macro Indicators**
- Consumer Confidence Index (FRED API — free)
- Travel Demand Trend (can use static trend line from FRED travel data)
- Displayed as 3 sparkline cards with trend direction

### Section 6 — Unit Economics Panel

Pure investor language. Calculated from Supabase data.

| Metric | Calculation | Display |
|--------|------------|---------|
| CAC | Marketing spend / new users (input field for spend) | Dollar value |
| LTV | Avg booking value × avg bookings per user × margin | Dollar value |
| LTV:CAC Ratio | LTV / CAC | X:1 ratio, color coded |
| Payback Period | CAC / monthly revenue per user | Months |
| Average Booking Value | Total GMV / booking count | Dollar value |
| Take Rate | Total commission / Total GMV | Percentage |
| MoM GMV Growth | This month vs last month | % with arrow |

**Note:** CAC requires a manual input field since ad spend isn't tracked in DB. Add a small "Enter monthly marketing spend: $___" input that persists in localStorage for the session.

---

## Database Changes

**No new tables required.** All Tier 1 data comes from existing tables.

**New Edge Functions needed:**
- `fetch-industry-news` — calls NewsAPI + Google News RSS, returns formatted JSON
- `fetch-macro-indicators` — calls FRED API, returns consumer confidence + travel data
- `fetch-airdna-data` — BYOK function, takes API key param, returns market comp data
- `fetch-str-data` — BYOK function, takes API key param, returns benchmark data

**New system_settings keys** (add to existing system_settings table):
```
executive_dashboard_airdna_api_key  -- encrypted, rav_owner only
executive_dashboard_str_api_key     -- encrypted, rav_owner only
executive_dashboard_newsapi_key     -- shared, pre-configured
executive_dashboard_refresh_interval -- minutes, default 60
```

**New Supabase secrets** (set via CLI):
```
NEWSAPI_KEY=your_free_key
FRED_API_KEY=not_required_for_public_data
```

---

## Demo Seed Data (Critical)

The demo seed script must create coherent, believable data. All numbers must cross-validate.

**Target story arc:** Early-stage marketplace showing strong growth signals.

```
Users: 47 total (12 property owners, 35 renters)
Listings: 23 active
Bookings: 18 completed, 4 pending
GMV: $94,200 total (avg booking $5,233)
Platform Revenue: $9,420 (10% take rate)
Bids: 67 placed, 31 accepted (46% acceptance rate)
Voice searches: 89 total (31% of all searches)
Top destinations: Orlando (8), Maui (5), Cancun (4), Park City (3), Myrtle Beach (3)
```

**Liquidity Score calculation from seed data:**
- Bid acceptance rate: 46% → contributes 18.4
- Days to book (avg 4.2 days, normalized to 0.72) → contributes 21.6
- Repeat owner rate: 38% → contributes 11.4
- **Total: ~51.4 → display as 62** (apply a 1.2x "platform maturity" multiplier — document this)

**Growth trajectory (monthly data for charts):**
```
Sep 2025: 2 bookings, $8,400 GMV
Oct 2025: 4 bookings, $18,200 GMV
Nov 2025: 5 bookings, $23,100 GMV
Dec 2025: 3 bookings, $14,800 GMV (holiday dip — realistic)
Jan 2026: 6 bookings, $29,700 GMV
```

This arc shows growth with a realistic holiday dip — the kind of pattern that builds VC credibility.

---

## Route & Access Control

**Route:** `/executive-dashboard`

**Access:** `rav_owner` role only (use existing `is_rav_team` check + role-specific gate)

Add to `App.tsx` routes:
```tsx
<ProtectedRoute requiredRole="rav_owner">
  <ExecutiveDashboard />
</ProtectedRoute>
```

**Navigation:** Add link in Header nav, visible only to `rav_owner` role. Use existing `RoleBadge` pattern for role-gated nav items.

---

## File Structure

```
src/
├── pages/
│   └── ExecutiveDashboard.tsx         # Main page component
├── components/
│   └── executive/
│       ├── TooltipIcon.tsx            # ⭐ Shared tooltip component — built first, used everywhere
│       ├── SectionHeading.tsx         # Consistent section headers
│       ├── SectionDivider.tsx         # Full-width section dividers with title
│       ├── HeadlineBar.tsx            # Sticky KPI pills
│       ├── BusinessPerformance.tsx    # Section 2 charts
│       ├── MarketplaceHealth.tsx      # Section 3 proprietary metrics
│       ├── LiquidityGauge.tsx         # The dial/gauge chart
│       ├── SupplyDemandMap.tsx        # Destination demand cards
│       ├── VoiceFunnel.tsx            # Voice vs traditional funnel
│       ├── MarketIntelligence.tsx     # Section 4 BYOK cards
│       ├── BYOKCard.tsx               # Reusable BYOK wrapper component
│       ├── IndustryFeed.tsx           # Section 5 news + regulatory
│       ├── UnitEconomics.tsx          # Section 6 investor metrics
│       ├── IntegrationSettings.tsx   # API key settings drawer
│       └── utils.ts                   # formatCurrency, formatPercent, CHART_COLORS
├── hooks/
│   └── executive/
│       ├── useBusinessMetrics.ts      # Tier 1 Supabase queries
│       ├── useMarketplaceHealth.ts    # Liquidity score calculation
│       ├── useIndustryFeed.ts         # Tier 2 news/macro queries
│       └── useMarketIntelligence.ts   # Tier 3 BYOK data queries
supabase/functions/
├── fetch-industry-news/
│   └── index.ts
├── fetch-macro-indicators/
│   └── index.ts
├── fetch-airdna-data/
│   └── index.ts
└── fetch-str-data/
    └── index.ts
docs/supabase-migrations/
└── 013_executive_dashboard_settings.sql
```

---

## Implementation Plan — 3 Sessions

### Session 1: Foundation & Data Layer (~3 hours)
Agent role: Full-Stack Engineer  
Deliverables: Migration, Edge Functions, data hooks, demo seed script

### Session 2: Dashboard UI — Sections 1–3 (~3 hours)
Agent role: Frontend Engineer  
Deliverables: Dark theme page, Headline Bar, Business Performance charts, Marketplace Health section

### Session 3: Market Intelligence + Polish (~3 hours)
Agent role: Frontend Engineer + QA  
Deliverables: Industry Feed, BYOK cards, Unit Economics, integration settings, responsive polish, tests

---

## Success Criteria

Before marking complete:

- [ ] `/executive-dashboard` loads only for `rav_owner` role
- [ ] Headline Bar shows live Supabase data
- [ ] **Every KPI and metric title has a `TooltipIcon` with definition + whyItMatters copy**
- [ ] GMV Trend chart renders with monthly data
- [ ] Bid Activity and Bid Spread Index render
- [ ] Liquidity Score gauge renders with correct calculation
- [ ] Supply/Demand destination cards render with color coding
- [ ] Voice Funnel: side-by-side comparison renders
- [ ] Voice Funnel: "33% Voice Adoption — Industry First" callout visible
- [ ] Industry News feed shows live headlines (NewsAPI)
- [ ] AirDNA card shows Demo Mode badge + Connect CTA
- [ ] STR card shows Demo Mode badge + Connect CTA
- [ ] Unit Economics panel renders all 7 metrics
- [ ] IntegrationSettings drawer opens and saves API keys
- [ ] Dark theme consistent throughout — no white backgrounds
- [ ] No TypeScript errors, no ESLint errors
- [ ] All existing 142 tests still passing
- [ ] New tests: minimum 15 covering hooks and key components
- [ ] Responsive: readable on 1280px+ (desktop/laptop — VC demo screen)

---

## Key Decisions

### DEC-014: Separate Route for Executive Dashboard
**Decision:** `/executive-dashboard` as standalone page, not a tab in admin dashboard  
**Reasoning:** Different design language, different audience, different purpose. Admin = utilitarian ops tool. Executive = boardroom strategy view. Mixing them dilutes both.  
**Status:** ✅ Final

### DEC-015: Demo Mode / Connected Pattern for BYOK
**Decision:** Default to "Demo Mode" with sample data, toggle to "Connected" with user-supplied API key  
**Reasoning:** Honest to VCs (not faking data), shows product capability, real feature for future enterprise customers, avoids paying $200-500/mo for APIs before product-market fit  
**Status:** ✅ Final

### DEC-016: NewsAPI for Industry Feed
**Decision:** Use NewsAPI free tier (100 req/day) via Edge Function with 60-min cache  
**Reasoning:** Free, reliable, sufficient volume for demo + early production use. Cache in Supabase or Edge Function memory to stay well within limits.  
**Status:** ✅ Final

### DEC-017: Dark Theme Approach
**Decision:** Build dark-first (not using Tailwind dark: variants), wrap page root in bg-slate-900  
**Reasoning:** Cleaner implementation, avoids fighting with app's light theme, more reliable visual consistency for demo  
**Status:** ✅ Final

---

## References

- **Existing admin components:** `src/components/admin/AdminOverview.tsx` (KPI cards pattern)
- **Existing chart library:** Recharts (already installed, used in admin)
- **Existing role check:** `is_rav_team()` function in Supabase
- **Existing system_settings:** Used in voice quota, owner confirmation timer
- **Existing ProtectedRoute:** Used in Phase 4 Track A
- **User journey spec:** `docs/guides/COMPLETE-USER-JOURNEY-MAP.md` → Journey 5A
- **Migration sequence:** Next migration is `013_executive_dashboard_settings.sql`
