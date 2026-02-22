# Fair Value Score

**Phase:** 15  
**Status:** 🟡 Ready to Build — Docs complete, awaiting implementation  
**Route:** Appears on listing cards + listing detail pages  
**Migration:** 014  
**Estimated Time:** 1 session (~2 hours)

---

## What This Feature Does

Displays a colored pricing confidence badge on every listing — calculated live from
real bid and booking data. Tells owners if they're priced correctly and gives
travelers confidence they're seeing a fair price.

Three tiers: **🟢 Fair Value** · **🟡 Below Market** · **🔴 Above Market**

---

## Files in This Folder

```
docs/features/fair-value-score/
├── README.md                    # This file — start here
├── 00-PROJECT-BRIEF.md          # Full spec: calculation logic, schema, file structure
├── 01-SESSION1-TASK.md          # Agent task: build everything in one session
├── handoffs/                    # Empty — agent fills after session
└── KNOWN-ISSUES.md              # Pre-populated with known constraints
```

---

## Quick Start for Agent

1. Read `00-PROJECT-BRIEF.md` fully
2. Run `01-SESSION1-TASK.md`
3. Save output to `handoffs/session1-handoff.md`

---

## Implementation Order

Must be built **before** Owner Dashboard (Phase 17), which imports `FairValueBadge`.

```
Phase 15: Fair Value Score   ← build this first
Phase 16: Calculator         ← independent, can run in parallel
Phase 17: Owner Dashboard    ← depends on FairValueBadge from Phase 15
Phase 18: Wishlist Matching  ← depends on Owner Dashboard
```

---

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Storage | Live RPC — not stored | Bid data changes constantly, stored score goes stale |
| Range method | P25–P75 percentile | More robust than mean, resistant to outlier bids |
| Fallback | Return null, render nothing | Better than showing wrong data |
| Migration # | 014 | Follows 013 (executive dashboard settings) |

---

## Success Criteria

- [ ] `calculate_fair_value_score()` deployed to DEV
- [ ] `FairValueBadge` on all listing cards
- [ ] `FairValueCard` on listing detail page
- [ ] Owner sees owner-specific messaging, traveler sees traveler-specific messaging
- [ ] `insufficient_data` → no badge shown, no broken UI
- [ ] 8+ new tests passing
- [ ] `npm run build` passes

---

## Dependencies

**Requires:** Existing `listing_bids`, `listings`, `properties` tables (already exist)  
**Required by:** Owner Dashboard (`FairValueBadge` component)  
**No new secrets required**

---

**Last Updated:** February 21, 2026
