# Travel Request Enhancements

**Phase:** 18  
**Status:** 🟡 Ready to Build — Docs complete, awaiting implementation  
**Routes:** Enhances existing `/bidding` · `/rentals` · `/list-property`  
**Migration:** 016 (minor — 2 enum values only)  
**Estimated Time:** 1 session (~3 hours)

---

## What This Feature Does

The Travel Request system (reverse auction) already exists with a complete
data model and owner proposal flow. This phase adds the automation layer
that makes it proactive rather than passive:

1. **Automated matching** — when a listing activates, notify travelers with
   matching open requests (the platform finds the match, not just the owner)
2. **Demand signal** — show owners how many open requests match their
   destination/dates while they're creating a listing
3. **"Post a Request" CTA** — surface the existing request flow on empty
   search results so travelers know it exists
4. **Request expiry email** — warn travelers 48h before their request expires

Zero new tables. Zero new pages. Enhances what's already built and tested.

---

## What Already Exists (Do Not Rebuild)

| Existing asset | Location |
|---------------|----------|
| `travel_requests` table | DB migration 003 |
| `travel_proposals` table | DB migration 003 |
| `TravelRequestForm` component | `src/components/bidding/TravelRequestForm.tsx` |
| `TravelRequestCard` component | `src/components/bidding/TravelRequestCard.tsx` |
| `ProposalFormDialog` component | `src/components/bidding/ProposalFormDialog.tsx` |
| `useOpenTravelRequests()` hook | `src/hooks/useBidding.ts` |
| `useCreateTravelRequest()` hook | `src/hooks/useBidding.ts` |
| `useMyTravelRequests()` hook | `src/hooks/useBidding.ts` |
| `new_travel_request_match` notification type | DB enum |
| `/bidding` marketplace page | `src/pages/BiddingMarketplace.tsx` |
| `/my-bids` traveler dashboard | `src/pages/MyBidsDashboard.tsx` |

---

## Files in This Folder

```
docs/features/travel-request-enhancements/
├── README.md                    # This file — start here
├── 00-PROJECT-BRIEF.md          # Full spec: 4 enhancements with exact file targets
├── 01-SESSION1-TASK.md          # Agent task: build all 4 in one session
├── handoffs/                    # Empty — agent fills after session
└── KNOWN-ISSUES.md              # Pre-populated constraints
```

---

## Quick Start for Agent

1. Read `00-PROJECT-BRIEF.md` fully — especially the "What Already Exists" section
2. Read `src/hooks/useBidding.ts` to understand existing hook patterns before adding to it
3. Run `01-SESSION1-TASK.md`
4. Save output to `handoffs/session1-handoff.md`

---

## The 4 Enhancements

| # | Enhancement | Effort | Value |
|---|------------|--------|-------|
| 1 | Automated match notification when listing activates | Medium | High — closes the loop between supply and demand |
| 2 | Demand signal on listing creation form | Small | High — motivates owners to list and price correctly |
| 3 | "Post a Request" CTA on empty search results | Small | Medium — surfaces existing feature to travelers |
| 4 | Request expiry warning email | Small | Medium — reduces silent request abandonment |

---

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| New table | None | `travel_requests` already has everything needed |
| New page | None | Enhances `/bidding`, `/rentals`, `/list-property` |
| Matching trigger | On listing status → 'active' | Real-time match at the moment of supply |
| Budget undisclosed | Honor existing enum | Don't expose budget in notification when `budget_preference = 'undisclosed'` |
| Migration # | 016 | 2 new notification_type enum values only |

---

## Success Criteria

- [ ] Traveler with matching open request receives notification when listing activates
- [ ] Budget not revealed in notification when `budget_preference = 'undisclosed'`
- [ ] Demand signal shows on `/list-property` after destination + dates entered
- [ ] "Post a Request" CTA shows on `/rentals` when search returns 0 results
- [ ] Expiry warning email sends 48h before `proposals_deadline`
- [ ] No regressions in existing bidding system tests
- [ ] `npm run build` passes

---

**Last Updated:** February 21, 2026
