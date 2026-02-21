# Owner Dashboard

**Phase:** 17  
**Status:** 🟡 Ready to Build — Docs complete, awaiting implementation  
**Route:** `/owner-dashboard` (property_owner role only)  
**Migration:** 015  
**Estimated Time:** 2 sessions (~6 hours total)

---

## What This Feature Does

A dedicated business dashboard for property owners — their personal P&L,
listings, earnings, and pricing guidance. Treats owners as business partners,
not just supply. The central metric: "Are you covering your maintenance fees?"

No timeshare platform today gives owners this view. This is the proof that
RAV is different.

---

## Files in This Folder

```
docs/features/owner-dashboard/
├── README.md                    # This file — start here
├── 00-PROJECT-BRIEF.md          # Full spec: sections, schema, RPC functions
├── 01-SESSION1-TASK.md          # Agent task: foundation + data layer + sections 1-2
├── 02-SESSION2-TASK.md          # Agent task: sections 3-6, nav link, tests
├── handoffs/                    # Empty — agents fill after each session
└── KNOWN-ISSUES.md              # Pre-populated with known constraints
```

---

## Quick Start for Agent

**Session 1:**
1. Read `00-PROJECT-BRIEF.md` fully
2. Run `01-SESSION1-TASK.md`
3. Save output to `handoffs/session1-handoff.md`

**Session 2:**
1. Read `00-PROJECT-BRIEF.md`
2. Read `handoffs/session1-handoff.md`
3. Run `02-SESSION2-TASK.md`
4. Save output to `handoffs/session2-handoff.md`

---

## Implementation Order

Requires **Phase 15 (Fair Value Score)** to be complete first.
`FairValueBadge` is imported directly into `MyListingsTable`.

```
Phase 15: Fair Value Score   ← must be done first
Phase 16: Calculator         ← independent
Phase 17: Owner Dashboard    ← this feature (needs Phase 15)
Phase 18: Wishlist Matching  ← after this
```

---

## Dashboard Sections

| Section | What it shows | Session |
|---------|--------------|---------|
| 1 — Headline Stats | Total earned, fees covered %, active bids, avg rating | 1 |
| 2 — Earnings Timeline | Monthly earnings chart + maintenance fee line | 1 |
| 3 — My Listings | Table with Fair Value badges + idle week alerts | 2 |
| 4 — Bid Activity Feed | Last 20 bid events across all listings | 2 |
| 5 — Pricing Intelligence | Actionable summary using Fair Value Score data | 2 |
| 6 — Maintenance Fee Tracker | Year-to-date breakdown vs annual fees | 2 |

---

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Route | `/owner-dashboard` separate from `/admin-dashboard` | Different audience, different data |
| Maintenance fees | Stored in `profiles.annual_maintenance_fees` | Owner enters once, persists |
| Stats query | `get_owner_dashboard_stats()` RPC | Single round-trip for all KPIs |
| RLS | Owner sees only their own data | Enforced at DB level |
| Migration # | 015 | Follows 014 (fair value score function) |

---

## Success Criteria

- [ ] `/owner-dashboard` accessible only to `property_owner` role
- [ ] Owner sees only their own data (RLS verified)
- [ ] All 6 sections render correctly
- [ ] "Fees Covered %" shows when maintenance fees are entered
- [ ] Idle week alert fires for listings < 60 days out with zero bids
- [ ] Fair Value badges visible in My Listings table
- [ ] "Adjust Price" saves to DB
- [ ] Nav link visible to owners, hidden from other roles
- [ ] 10+ new tests passing
- [ ] `npm run build` passes

---

## Dependencies

**Requires:** `FairValueBadge` from Phase 15 (`src/components/fair-value/FairValueBadge.tsx`)  
**Requires:** `profiles`, `listings`, `bookings`, `listing_bids` tables (all exist)  
**No new secrets required**

---

**Last Updated:** February 21, 2026
