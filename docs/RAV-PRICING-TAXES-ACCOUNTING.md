# Rent-A-Vacation — Pricing, Taxes & Accounting Framework

> **Document for:** RAV Partners & Stakeholders
> **Date:** February 21, 2026
> **Version:** 1.0

---

## 1. Fee Structure

Every booking on Rent-A-Vacation involves multiple fee layers. This document defines who sets, collects, and remits each fee.

| Fee | Who Sets It | Who Collects | Who Remits | Current Status |
|-----|------------|-------------|-----------|----------------|
| **Nightly rate** | Property Owner | RAV (at checkout via Stripe) | Paid to owner (minus commission) | Active |
| **RAV service fee** | RAV (15% default, tier-adjusted) | RAV (at checkout) | RAV keeps as revenue | Active |
| **Cleaning fee** | Owner (optional, per listing) | RAV (at checkout) | Passed through to owner | **Planned** |
| **Resort fee** | Resort (disclosed by owner) | Resort (at check-in, not RAV) | Resort | Display only |
| **Occupancy / lodging tax** | Government (varies by jurisdiction) | **RAV (marketplace facilitator)** | RAV must remit to tax authority | **Required before launch** |
| **State / local sales tax** | Government (varies by state) | RAV (marketplace facilitator) | RAV must remit | **Required before launch** |
| **Stripe processing fee** | Stripe (~2.9% + $0.30) | Stripe (auto-deducted) | N/A | Active (absorbed by RAV) |

---

## 2. Current Pricing Model

Today, RAV uses a **lump-sum pricing model**:

```
Owner sets total price for entire stay    →  owner_price = $1,800 (7 nights)
RAV adds 15% service fee                 →  rav_markup   = $270
Traveler pays total                       →  final_price  = $2,070
```

### Recommendation: Switch to Per-Night Rates

The vacation rental industry standard (Airbnb, VRBO, Booking.com) is **per-night pricing**. Benefits:

- **Comparison shopping:** Travelers can compare 5-night vs 7-night listings fairly
- **Flexible dates:** Enables partial-week booking ("I only need 6 of your 8 nights")
- **Bidding clarity:** Bids expressed as $/night are more intuitive
- **Fair Value Score:** Comparing per-night rates across listings is apples-to-apples
- **Travel Requests:** Budget ranges expressed as $/night are standard

**Proposed model:**

```
Nightly rate (owner sets)     $257/night
× Number of nights            × 7 nights
= Subtotal                    $1,800
+ RAV service fee (15%)       $270
+ Cleaning fee (optional)     $150
+ Occupancy tax (varies)      $TBD
─────────────────────────────
Total charged to traveler     $2,220+
```

---

## 3. Booking Price Breakdown

Every booking record should track fees as separate line items:

| Line Item | Field | Description |
|-----------|-------|-------------|
| Nightly rate | `nightly_rate` | Owner's per-night price |
| Number of nights | `num_nights` | Derived from check-in/check-out dates |
| Subtotal | `base_amount` | nightly_rate × num_nights |
| RAV service fee | `service_fee` | Commission (15% default, tier-adjusted) |
| Cleaning fee | `cleaning_fee` | Optional, set by owner per listing |
| Tax amount | `tax_amount` | Calculated by tax service based on location |
| **Total charged** | `total_charged` | Sum of all above — what Stripe captures |
| Owner payout | `owner_payout` | base_amount + cleaning_fee (owner's portion) |
| RAV revenue | `rav_revenue` | service_fee (RAV's portion) |
| Tax liability | `tax_remittance` | tax_amount (held for government remittance) |

---

## 4. Tax Obligations — Marketplace Facilitator Laws

### What RAV Must Do

As a marketplace that processes payments, RAV is classified as a **marketplace facilitator** in 43 US states + DC. This means RAV is legally required to:

1. **Calculate** applicable occupancy and sales taxes at checkout
2. **Collect** tax from the traveler as a line item
3. **Remit** tax to the appropriate government authority (state, county, city)
4. **File** periodic tax returns per jurisdiction

### Tax Rates (Examples)

| Location | Occupancy Tax | Sales Tax | Total Tax |
|----------|--------------|-----------|-----------|
| Orlando, FL | 6% county + 6% tourism | 6.5% state | ~12-18% |
| Las Vegas, NV | 13% transient lodging | 8.375% sales | ~13-21% |
| Myrtle Beach, SC | 3% accommodations | 6% state + 3% local | ~12% |
| Kapolei, HI (Oahu) | 10.25% transient | 4.5% excise | ~14.75% |

> Rates vary by city, county, and property type. Automated tax calculation is required.

### Integration Options

| Service | What It Does | Cost | Best For |
|---------|-------------|------|----------|
| **Stripe Tax** | Auto-calculates & collects tax at checkout | 0.5% per transaction | Already on Stripe — easiest integration |
| **Avalara** | Full tax compliance (calculation, filing, remittance) | $50-300/mo + per-transaction | End-to-end automation |
| **TaxJar** | Tax calculation + auto-filing for US states | $19-99/mo + per-transaction | Mid-range, good API |

**Recommendation:** Start with **Stripe Tax** (already integrated with our Stripe checkout) for tax calculation and collection. Add Avalara or TaxJar for automated filing and remittance when transaction volume justifies the cost.

---

## 5. Accounting & Reporting

### What RAV Needs to Track

| Report | Frequency | Purpose |
|--------|-----------|---------|
| **Revenue report** | Monthly | RAV service fees collected = gross revenue |
| **Owner payouts** | Per booking | Track amounts owed to each owner |
| **Tax collected** | Monthly | Taxes collected, by jurisdiction |
| **Tax remitted** | Per jurisdiction deadline | Proof of tax payment |
| **1099-K forms** | Annual (Jan 31) | Required for owners earning >$600/year |
| **Platform guarantee fund** | Monthly | 2% contribution tracking |

### Integration Options for Accounting

| Service | What It Does | Cost | Best For |
|---------|-------------|------|----------|
| **QuickBooks Online** | General ledger, invoicing, 1099 generation | $30-200/mo | Standard small-business accounting |
| **Stripe Revenue Recognition** | Auto-generates GAAP-compliant revenue reports | Included with Stripe | Revenue tracking, pass-through reconciliation |
| **Gusto / Deel** | 1099 generation and filing for contractors (owners) | $6-12/contractor/mo | Annual 1099-K compliance |

**Recommendation:** Use **QuickBooks Online** as the general ledger, sync via **Stripe's QuickBooks integration** (automatic transaction import). Add **Gusto** for 1099-K generation when approaching tax filing season.

---

## 6. Owner's Responsibilities vs. RAV's

| Concern | Owner's Job | RAV's Job |
|---------|------------|-----------|
| Set nightly rate | Yes | Display + collect |
| Set cleaning fee | Yes (optional) | Pass through to owner |
| Disclose resort fees | Yes (in listing description) | Display (don't collect) |
| Occupancy / lodging tax | Nothing | Calculate, collect, remit |
| Sales tax | Nothing | Calculate, collect, remit |
| Income tax (personal) | File own taxes | Issue 1099-K if >$600/year |
| RAV service fee | Nothing | Deduct as commission |
| Stripe processing fee | Nothing | Absorbed by RAV |
| Price accuracy | Set honest prices | Enforce via Fair Value Score |
| Cancellation refunds | Approve/deny | Process refund via Stripe |

---

## 7. Implementation Roadmap

| Phase | What | When | Effort |
|-------|------|------|--------|
| **Phase A** | Per-night pricing model + fee breakdown display | Next sprint | 8-10 hours |
| **Phase B** | Cleaning fee + resort fee fields on listings | With Phase A | 2-3 hours |
| **Phase C** | Stripe Tax integration (auto-calculate at checkout) | Before public launch | 6-8 hours |
| **Phase D** | Admin tax reporting dashboard | Before launch | 4-6 hours |
| **Phase E** | QuickBooks integration (revenue sync) | Post-launch | 8-12 hours |
| **Phase F** | 1099-K generation (Gusto or manual) | Before Jan 2027 | 4-8 hours |
| **Phase G** | Automated tax filing (Avalara/TaxJar) | When volume justifies | 8-16 hours |

---

## 8. Summary & Recommendations

1. **Switch to per-night pricing** as the atomic unit across the entire platform — this is industry standard and enables flexible date bookings
2. **Separate fee line items** in booking records — nightly rate, service fee, cleaning fee, tax — instead of a single bundled price
3. **Integrate Stripe Tax** before public launch — we're already on Stripe, and this handles tax calculation + collection with minimal code
4. **Use QuickBooks Online** as the accounting system of record, synced automatically via Stripe's integration
5. **Plan for 1099-K compliance** — owners earning >$600/year must receive a 1099-K by January 31 of the following year
6. **Resort fees are owner-disclosed, not RAV-collected** — these are paid at the resort, not at checkout
7. **Stripe processing fees (~2.9%) are absorbed by RAV** — standard marketplace practice, baked into the 15% service fee margin

---

*Prepared for RAV Partners — February 2026*
*Questions: support@rentavacation.com*
