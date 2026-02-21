# Fair Value Score — Known Issues & Constraints

**Status:** Pre-implementation — issues are anticipated, not yet confirmed  
**Feature:** Phase 15 — Fair Value Score  
**Last Updated:** February 21, 2026

---

## Anticipated Issues

### Early-Stage Data Sparsity (HIGH — expected)

**Issue:** With limited beta listings and bids, many listings will hit the
`insufficient_data` path (fewer than 3 comparable accepted bids).  
**Impact:** Badge won't show on most listings initially.  
**Mitigation:** The `insufficient_data` state renders nothing — no broken UI.
As bid volume grows this resolves itself. Consider widening the comparison
window from ±45 days to ±90 days for early stage.  
**Status:** 🟡 By Design — monitor as platform grows

---

### RPC Performance at Scale (LOW — future concern)

**Issue:** `calculate_fair_value_score()` runs a live query on every listing
load. At high listing volume this could add latency.  
**Impact:** None currently (low listing count).  
**Mitigation:** Add a materialized view or caching layer if query time exceeds
200ms. `staleTime: 5 * 60 * 1000` in the hook limits re-fetches.  
**Status:** 🟢 Acceptable for current scale — revisit at 500+ listings

---

### Comparison Logic for Multi-Location Resorts (MEDIUM)

**Issue:** Some resort chains (e.g. Hilton Grand Vacations) have multiple
properties in the same city. The current comparison uses city-level matching,
which may mix units from different resorts.  
**Impact:** Slight imprecision in the fair value range for multi-resort cities.  
**Mitigation:** Future improvement: add resort-level comparison as primary
match before falling back to city-level.  
**Status:** 🟡 Acceptable for launch — log for Phase 15 v2

---

### No Historical Price Trending (LOW)

**Issue:** The score is a point-in-time snapshot. It doesn't show whether
prices are trending up or down.  
**Impact:** Owners can't see if they should raise or lower prices over time.  
**Mitigation:** Add trending indicator in Owner Dashboard (Phase 17) using
the same RPC data plotted over time.  
**Status:** 🟢 Out of scope for Phase 15 — addressed in Phase 17

---

## Post-Implementation Issues

*This section will be filled by the agent after Session 1.*

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| | | | |

---

## Resolution Priority Order

1. Any issue blocking `npm run build`
2. Any issue causing broken UI (crashes, blank pages)
3. Data accuracy issues
4. Performance issues
5. Edge case display issues
