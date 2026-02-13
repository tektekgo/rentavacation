# Voice Search: Known Issues

**Last Updated:** 2026-02-11

---

## Issue 1: Assistant Interruption (Talks Over User)

**Severity:** Medium
**Status:** Open
**First Observed:** VAPI integration testing (Session 1)

### Description

The voice assistant sometimes begins speaking (or fires `search_properties`) before the user has finished their query. This results in:
- The assistant talking over the user mid-sentence
- Function calls executing with incomplete parameters
- Duplicate `search_properties` calls fired in quick succession

### Observed Behavior

From test logs:
- **Test 2 (Orlando):** `search_properties` fired twice at nearly the same timestamp — possible race condition when user speech overlaps with assistant response
- **Test 3 (Smoky Mountains):** User tried to provide a check-in date *after* the function had already fired — assistant didn't wait long enough

### Root Cause Analysis

Likely a combination of:
1. **VAPI silence detection** — Deepgram's end-of-speech detection may trigger too early on natural pauses
2. **LLM eagerness** — GPT-4o-mini calls the function as soon as it has minimum required params (`destination`), without waiting for the user to finish
3. **No debounce** — No delay between detecting end-of-speech and executing the function call

### Investigation Steps

1. **Check VAPI assistant settings:**
   - Review `silenceTimeoutSeconds` (currently 30s) — this is for full silence, not mid-speech pauses
   - Check if VAPI has an `endpointing` or `speechTimeout` setting that controls how long to wait after a pause before considering speech "final"
   - Look for `responsePunctuationBehavior` or similar settings

2. **Adjust Deepgram transcriber config:**
   ```json
   {
     "transcriber": {
       "provider": "deepgram",
       "model": "nova-2",
       "language": "en",
       "endpointing": 500
     }
   }
   ```
   Increasing `endpointing` (milliseconds of silence before considering speech final) from the default (~300ms) to 500-800ms may help.

3. **Update VAPI assistant system prompt:**
   Add instructions to wait for complete input:
   ```
   IMPORTANT: Before calling search_properties, pause briefly to make sure the user
   has finished speaking. If they seem to be mid-sentence or hesitating, wait for them
   to complete their thought. Only call the function when you have a natural pause
   indicating the user is done.
   ```

4. **Consider adding `backchanneling`:**
   VAPI may support backchanneling settings that prevent the assistant from jumping in during pauses.

5. **Test with longer utterances:**
   Record test sessions where the user deliberately pauses mid-sentence to measure how aggressive the interruption is.

### VAPI Dashboard

- Assistant ID: `af9159c9-d480-42c4-ad20-9b38431531e7`
- Update via: `PATCH https://api.vapi.ai/assistant/{id}` with private key
- Or use VAPI dashboard UI directly

---

## Issue 2: Budget Assumption ($1500 Before User Provides)

**Severity:** Medium
**Status:** Open
**First Observed:** VAPI integration testing (Session 1, Test 1)

### Description

The assistant sometimes assumes a budget of $1500 even when the user explicitly states a different amount. In Test 1, the user said "under $2000" but the assistant reported searching for "$1500."

### Observed Behavior

From test logs:
- **Test 1 (Maui):** User said "under 2000 dollars" but assistant's response mentioned "$1500" — the function call may have used the wrong `max_price`
- The system prompt contains the guideline: *"If the user says 'cheap' or 'affordable', assume max_price = 1500"*
- The LLM appears to be over-applying this rule even when the user provides an explicit price

### Root Cause Analysis

1. **System prompt bleed:** The guideline about "cheap/affordable = 1500" may be influencing the LLM to default to $1500 in ambiguous situations
2. **Transcription error:** Deepgram may have transcribed "2000" as something the LLM misinterpreted
3. **LLM hallucination:** GPT-4o-mini may be conflating the system prompt guideline with the user's actual stated price

### Investigation Steps

1. **Review VAPI call logs:**
   - Check the actual `search_properties` function call parameters — did `max_price` contain 1500 or 2000?
   - If the function params were correct (2000) but the assistant *said* 1500, it's a response generation issue
   - If the function params were wrong (1500), it's a parameter extraction issue

2. **Refine the system prompt:**
   Make the $1500 rule more explicit and narrow:
   ```
   Price guidelines:
   - ONLY use max_price=1500 when the user literally says "cheap" or "affordable"
     without providing a specific number
   - If the user states ANY specific dollar amount, ALWAYS use their exact number
   - Never override an explicit user price with the default
   ```

3. **Consider removing the default entirely:**
   The $1500 default may cause more confusion than it solves. Alternative approach:
   ```
   If the user says "cheap" or "affordable" without a specific price, ask them:
   "What's your budget range?" instead of assuming $1500.
   ```

4. **Test with explicit prices:**
   Run voice tests with clear price statements ($500, $1000, $2000, $3000) and verify the function call parameters match.

5. **Check Deepgram transcription:**
   Review raw transcripts in VAPI logs to confirm "2000" was correctly transcribed.

### VAPI System Prompt Location

Current system prompt is in the VAPI assistant config. To update:
```bash
curl -X PATCH https://api.vapi.ai/assistant/af9159c9-d480-42c4-ad20-9b38431531e7 \
  -H "Authorization: Bearer YOUR_VAPI_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": {
      "messages": [{"role": "system", "content": "UPDATED PROMPT HERE"}]
    }
  }'
```

---

## Other Known Issues (Non-blocking)

| Issue | Severity | Description | Reference |
|-------|----------|-------------|-----------|
| Deepgram transcription quality | Low | Fragmented/hesitant speech garbled ("0 4 and, uh, 1 with") | VAPI handoff, Test 1 |
| Duplicate function calls | Low | `search_properties` fires twice in quick succession | VAPI handoff, Test 2 |
| No AbortController on fetch | Low | Edge Function fetch continues after user stops voice search | QA handoff, Issue #4 |
| Voice result cards not clickable | Low | Results use `<div>` not `<Link>` — can't click through to property | QA handoff, Issue #5 |
| CORS wildcard | Low | Edge Function allows `*` origin — tighten for production | QA handoff, Issue #7 |
| No rate limiting | Low | Edge Function has no request rate limiting | QA handoff, Issue #8 |

---

## Resolution Priority

1. **Budget assumption** — Fix the system prompt first (quick VAPI API call)
2. **Interruption** — Adjust Deepgram endpointing + system prompt (requires testing)
3. **Other issues** — Address in Phase 3 or as part of voice search v2
