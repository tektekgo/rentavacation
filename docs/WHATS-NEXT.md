# Rent-A-Vacation: What's Next

**Last Updated:** 2026-02-11

---

## Phase 2 Completion Summary

Phase 2 added two major features to the platform:

### Voice Search (Phase 2A)
- VAPI-powered voice assistant for natural language property search
- Supabase Edge Function backend with full filter support
- Frontend integration on Rentals page with feature flag
- 4-agent build: VAPI config, backend, frontend, QA

### Resort Master Data (Phase 2B)
- 117 real production resorts (62 Hilton, 40 Marriott, 15 Disney)
- 351 unit type configurations
- Searchable resort selector on ListProperty page (brand > resort > unit type)
- Auto-population of bedrooms, bathrooms, sleeps from resort data
- Resort info display on PropertyDetail page with graceful fallback
- Resort brand badges on Rentals page
- Voice search enhanced with resort data joins

### Infrastructure
- DEV + PROD Supabase environments both populated
- Edge Functions deployed to both environments
- Vercel auto-deploys from GitHub main branch
- Custom domain: rent-a-vacation.com
- SVG logo with proper favicons

---

## Known Issues to Fix

### Voice Search
| Issue | Priority | Details |
|-------|----------|---------|
| Assistant interrupts user | Medium | Talks over user before they finish speaking. Adjust Deepgram endpointing and VAPI system prompt. |
| Budget assumption ($1500) | Medium | Defaults to $1500 even when user provides explicit price. Fix system prompt guideline. |
| Duplicate function calls | Low | `search_properties` fires twice on speech overlap. |
| Transcription quality | Low | Fragmented/hesitant speech garbled by Deepgram. |

See: `docs/features/voice-search/KNOWN-ISSUES.md`

### Frontend
| Issue | Priority | Details |
|-------|----------|---------|
| Bundle size | Low | 1.87 MB (488 kB gzipped). Consider code-splitting and lazy-loading VAPI SDK. |
| CSS @import order | Low | Google Fonts @import should precede other statements in global CSS. |
| Voice result cards not clickable | Low | Need `<Link>` routing once property pages support UUID-based IDs. |

### Backend
| Issue | Priority | Details |
|-------|----------|---------|
| CORS wildcard | Low | Edge Function uses `Access-Control-Allow-Origin: *`. Restrict to production domain. |
| No rate limiting | Low | Edge Function has no request rate limiting. |
| All errors return 400 | Low | Database errors should return 500. |

---

## Phase 3 Plans

### 3A: Core Functionality
- [ ] Wire up ListProperty form to actually create properties in database
- [ ] User authentication flow (signup > login > list property)
- [ ] Property photo upload to Supabase Storage
- [ ] Booking request flow (renter > owner approval)
- [ ] Payment integration (Stripe)

### 3B: Data & Content
- [ ] Add resort images (main_image_url, additional_images)
- [ ] Populate real listing data for demo/beta
- [ ] Add more resort brands (Wyndham, Hyatt, Bluegreen, Diamond)
- [ ] Street-level addresses for resorts (currently city/state only)

### 3C: Voice Search v2
- [ ] Fix interruption and budget issues (see Known Issues)
- [ ] Lazy-load VAPI SDK to reduce bundle size
- [ ] Make voice result cards clickable
- [ ] Add AbortController to Edge Function fetch
- [ ] Voice-powered listing creation for property owners
- [ ] Multi-language support

### 3D: Platform Features
- [ ] Owner dashboard (manage listings, view bookings)
- [ ] Renter dashboard (booking history, favorites)
- [ ] Resort comparison tool
- [ ] "Similar properties" recommendations
- [ ] Email notifications for bookings
- [ ] Admin panel for resort data management

### 3E: Production Hardening
- [ ] Restrict CORS to production domain
- [ ] Add rate limiting to Edge Functions
- [ ] Set up error logging (Sentry)
- [ ] Usage analytics (voice search, listing conversions)
- [ ] Multi-browser manual testing
- [ ] Mobile device testing
- [ ] Screen reader testing (NVDA/VoiceOver)

---

## Quick Reference

### Environments

| Environment | Supabase | URL |
|---|---|---|
| Local dev | `oukbxqnlxnkainnligfz` (DEV) | http://localhost:5173 |
| Production | `xzfllqndrlmhclqfybew` (PROD) | https://rent-a-vacation.com |

### Key Files

| Area | File |
|------|------|
| Resort selector | `src/components/resort/ResortSelector.tsx` |
| Unit type selector | `src/components/resort/UnitTypeSelector.tsx` |
| Resort info card | `src/components/resort/ResortInfoCard.tsx` |
| Unit type specs | `src/components/resort/UnitTypeSpecs.tsx` |
| List property page | `src/pages/ListProperty.tsx` |
| Property detail page | `src/pages/PropertyDetail.tsx` |
| Rentals page | `src/pages/Rentals.tsx` |
| Voice search hook | `src/hooks/useVoiceSearch.ts` |
| Voice types | `src/types/voice.ts` |
| Database types | `src/types/database.ts` |
| Edge Function | `supabase/functions/voice-search/index.ts` |
| DB migration | `supabase/migrations/20260211_resort_master_data.sql` |
| Import script | `scripts/import-resort-data.ts` |
| Resort data (JSON) | `docs/features/resort-master-data/sample-data/complete-resort-data.json` |

### VAPI Configuration

| Setting | Value |
|---------|-------|
| Assistant ID | `af9159c9-d480-42c4-ad20-9b38431531e7` |
| LLM | GPT-4o-mini |
| Voice | ElevenLabs "Bella" |
| Transcriber | Deepgram Nova-2 |
| Feature flag | `VITE_FEATURE_VOICE_ENABLED` |

### Documentation

| Doc | Path |
|-----|------|
| Architecture | `docs/ARCHITECTURE.md` |
| Setup | `docs/SETUP.md` |
| Deployment | `docs/DEPLOYMENT.md` |
| Voice search project brief | `docs/features/voice-search/00-PROJECT-BRIEF.md` |
| Voice search known issues | `docs/features/voice-search/KNOWN-ISSUES.md` |
| Resort master data brief | `docs/features/resort-master-data/00-PROJECT-BRIEF.md` |
| Session 1 handoff | `docs/features/resort-master-data/handoffs/session1-team-handoff.md` |
| Session 2 handoff | `docs/features/resort-master-data/handoffs/session2-display-handoff.md` |
| Session 3 handoff | `docs/features/resort-master-data/handoffs/session3-search-qa-handoff.md` |
| User journey map | `docs/guides/COMPLETE-USER-JOURNEY-MAP.md` |
| Voice search guide | `docs/guides/HOW-TO-SEARCH-WITH-VOICE.md` |
