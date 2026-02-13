# Voice Authentication & User Approval System - Project Brief

**Feature:** Voice Search Authentication + Admin User Approval System  
**Priority:** Critical (protects API costs + controls beta access)  
**Estimated Time:** 5 hours (split across 3 phases)  
**Target Environment:** Supabase DEV → Production

---

## Executive Summary

### **Problem Statement**

1. **Voice search is currently unprotected** - Any visitor can use it, causing potential API cost abuse (~$0.10 per search via VAPI)
2. **Beta launch needs gating** - Site is not final, need to control who can access the platform
3. **No usage limits** - Authenticated users could abuse voice search with unlimited queries

### **Solution**

**Three-layer protection system:**

1. **Authentication Gate** - Voice search button disabled for non-authenticated users
2. **User Approval System** - New signups require RAV admin approval before platform access
3. **Usage Limits** - Authenticated users get 10 voice searches per day

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROTECTION LAYERS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: AUTHENTICATION GATE                                   │
│  ├─ Unauthenticated user → Voice button disabled                │
│  ├─ Tooltip: "Sign in to use voice search"                      │
│  └─ Manual search still available                               │
│                                                                  │
│  Layer 2: USER APPROVAL SYSTEM                                  │
│  ├─ New signup → profile.approval_status = 'pending_approval'   │
│  ├─ User sees: "Account pending approval" page                  │
│  ├─ Admin dashboard: Review pending users                       │
│  ├─ Admin clicks Approve/Reject                                 │
│  └─ Email notifications sent                                    │
│                                                                  │
│  Layer 3: USAGE LIMITS                                          │
│  ├─ Track voice searches in voice_search_usage table            │
│  ├─ Daily quota: 10 searches per user                           │
│  ├─ Resets at midnight UTC                                      │
│  └─ UI shows: "7 searches remaining today"                      │
│                                                                  │
│  Layer 4: SYSTEM TOGGLE (Admin Control)                         │
│  ├─ system_settings table with 'require_user_approval' key      │
│  ├─ Admin can toggle ON/OFF from dashboard                      │
│  └─ When OFF, new users get instant access                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### **1. Update `profiles` Table**

```sql
-- Add approval system columns
ALTER TABLE profiles 
  ADD COLUMN approval_status TEXT DEFAULT 'pending_approval' 
  CHECK (approval_status IN ('pending_approval', 'approved', 'rejected'));

ALTER TABLE profiles 
  ADD COLUMN approved_by UUID REFERENCES auth.users(id);

ALTER TABLE profiles 
  ADD COLUMN approved_at TIMESTAMPTZ;

ALTER TABLE profiles
  ADD COLUMN rejection_reason TEXT;

-- Migration: Approve all existing users
UPDATE profiles SET approval_status = 'approved' WHERE approval_status = 'pending_approval';
```

### **2. Create `voice_search_usage` Table**

```sql
CREATE TABLE voice_search_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  search_date DATE NOT NULL DEFAULT CURRENT_DATE,
  search_count INTEGER DEFAULT 0,
  last_search_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, search_date)
);

CREATE INDEX idx_voice_search_usage_user_date ON voice_search_usage(user_id, search_date);
CREATE INDEX idx_voice_search_usage_date ON voice_search_usage(search_date);
```

### **3. Create `system_settings` Table**

```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'require_user_approval',
  '{"enabled": true}'::jsonb,
  'When enabled, new user signups must be approved by RAV admin before they can access the platform'
);
```

### **4. Create Database Functions**

```sql
-- Function to increment voice search count
CREATE OR REPLACE FUNCTION increment_voice_search_count(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO voice_search_usage (user_id, search_date, search_count, last_search_at)
  VALUES (_user_id, CURRENT_DATE, 1, NOW())
  ON CONFLICT (user_id, search_date)
  DO UPDATE SET
    search_count = voice_search_usage.search_count + 1,
    last_search_at = NOW(),
    updated_at = NOW();
END;
$$;

-- Function to get today's search count
CREATE OR REPLACE FUNCTION get_voice_search_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(search_count, 0)
  FROM voice_search_usage
  WHERE user_id = _user_id AND search_date = CURRENT_DATE;
$$;

-- Function to check if user can access platform
CREATE OR REPLACE FUNCTION can_access_platform(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  approval_required BOOLEAN;
  user_status TEXT;
  user_is_rav_team BOOLEAN;
BEGIN
  -- Check if approval is required
  SELECT (setting_value->>'enabled')::boolean INTO approval_required
  FROM system_settings
  WHERE setting_key = 'require_user_approval';
  
  -- If approval not required, everyone can access
  IF NOT approval_required THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is RAV team (they always have access)
  user_is_rav_team := public.is_rav_team(_user_id);
  IF user_is_rav_team THEN
    RETURN TRUE;
  END IF;
  
  -- Check user approval status
  SELECT approval_status INTO user_status
  FROM profiles
  WHERE id = _user_id;
  
  RETURN user_status = 'approved';
END;
$$;
```

### **5. Row Level Security Policies**

```sql
-- voice_search_usage RLS
ALTER TABLE voice_search_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice search usage"
  ON voice_search_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "RAV team can view all voice search usage"
  ON voice_search_usage FOR SELECT
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

-- system_settings RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only RAV team can update system settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()))
  WITH CHECK (public.is_rav_team(auth.uid()));
```

---

## Component Changes Required

### **Frontend Components to Modify**

1. **`src/components/VoiceSearchButton.tsx`**
   - Add authentication check
   - Show disabled state with tooltip for unauthenticated users
   - Add usage quota check before starting session

2. **`src/hooks/useVoiceSearch.ts`**
   - Add quota checking logic
   - Increment counter after successful search
   - Handle quota exceeded error

3. **`src/pages/Rentals.tsx`**
   - Show quota counter near voice button
   - Handle pending approval state

4. **`src/contexts/AuthContext.tsx`**
   - Add `canAccessPlatform` method
   - Add `voiceSearchesRemaining` state

### **New Components to Create**

1. **`src/pages/PendingApproval.tsx`**
   - Page shown to users awaiting approval
   - Clear messaging about approval process

2. **`src/components/admin/PendingApprovals.tsx`**
   - Tab in Admin Dashboard
   - List of pending users
   - Approve/Reject actions

3. **`src/components/admin/SystemSettings.tsx`**
   - Tab in Admin Dashboard
   - Toggle for "Require User Approval"
   - Other system-wide settings

4. **`src/components/VoiceQuotaIndicator.tsx`**
   - Shows "X searches remaining today"
   - Warning when close to limit

### **New Hooks to Create**

1. **`src/hooks/useVoiceQuota.ts`**
   - Fetch current usage count
   - Check if user can search
   - Increment counter

---

## User Flows

### **Flow 1: Unauthenticated User**

```
User visits /rentals
  ↓
Sees voice button (disabled, grayed out)
  ↓
Hovers → Tooltip: "Sign in to use voice search"
  ↓
Can still use manual search filters
```

### **Flow 2: New User Signup (Approval Required = ON)**

```
User signs up with email/password or Google
  ↓
Account created → approval_status = 'pending_approval'
  ↓
Redirected to /pending-approval page
  ↓
"Your account is being reviewed. You'll get an email within 24 hours."
  ↓
User tries to access /rentals → Redirected back to /pending-approval
  ↓
RAV Admin gets notification
  ↓
Admin reviews in dashboard → Clicks "Approve"
  ↓
approval_status = 'approved', email sent to user
  ↓
User logs in → Full access granted
```

### **Flow 3: Authenticated User (Voice Search)**

```
Approved user visits /rentals
  ↓
Sees voice button (enabled) + "10 searches remaining today"
  ↓
Clicks voice button
  ↓
useVoiceSearch hook:
  1. Check quota: get_voice_search_count(user.id)
  2. If >= 10: Show error "Daily limit reached"
  3. If < 10: Start VAPI session
  ↓
User speaks query
  ↓
Search completes successfully
  ↓
Increment counter: increment_voice_search_count(user.id)
  ↓
Update UI: "9 searches remaining today"
```

### **Flow 4: Admin Approval**

```
Admin logs in → Visits /admin dashboard
  ↓
Clicks "Pending Approvals" tab (shows badge with count)
  ↓
Sees list of pending users:
  - Name, email, signup date
  - [Approve] [Reject] buttons
  ↓
Admin clicks "Approve"
  ↓
1. UPDATE profiles SET approval_status = 'approved'
  2. Send email notification (Edge Function)
  3. Refresh list
  ↓
User receives email → Can now access platform
```

### **Flow 5: Toggle Approval System**

```
Admin visits /admin → "System Settings" tab
  ↓
Sees toggle: "Require approval for new users" [ON]
  ↓
Admin toggles to OFF
  ↓
UPDATE system_settings SET setting_value = '{"enabled": false}'
  ↓
New signups now get approval_status = 'approved' automatically
  ↓
(Existing pending users still need manual approval)
```

---

## API Changes & Edge Functions

### **New Edge Function: `send-approval-email`**

**Purpose:** Send email notification when user is approved/rejected

**Endpoint:** `https://[project].supabase.co/functions/v1/send-approval-email`

**Request:**
```json
{
  "user_id": "uuid",
  "action": "approved" | "rejected",
  "rejection_reason": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "email_sent": true
}
```

**Email Templates:**

**Approval Email:**
```
Subject: Your Rent-A-Vacation account has been approved! 🎉

Hi {name},

Great news! Your account has been approved and you now have full access to Rent-A-Vacation.

You can now:
✓ Browse and book vacation rentals
✓ Use voice search to find properties
✓ Create bids and travel requests
✓ List your own timeshare properties

Get started: https://rent-a-vacation.com/rentals

Questions? Reply to this email or visit our FAQ.

Happy travels!
The Rent-A-Vacation Team
```

**Rejection Email:**
```
Subject: Update on your Rent-A-Vacation account

Hi {name},

Thank you for your interest in Rent-A-Vacation.

Unfortunately, we're unable to approve your account at this time.

Reason: {rejection_reason}

If you believe this is an error, please reply to this email.

Best regards,
The Rent-A-Vacation Team
```

---

## Environment Variables

### **No new variables needed!**

All existing variables work:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_VAPI_PUBLIC_KEY`
- `VITE_VAPI_ASSISTANT_ID`
- `VITE_FEATURE_VOICE_ENABLED`

---

## Success Criteria

### **Phase 1: Authentication Gate (30 min)**
- ✅ Unauthenticated users see disabled voice button
- ✅ Tooltip explains "Sign in to use voice search"
- ✅ Authenticated users can use voice (existing behavior)
- ✅ Manual search always available
- ✅ No errors in console

### **Phase 2: User Approval System (2 hours)**
- ✅ New signups get `approval_status = 'pending_approval'`
- ✅ Pending users redirected to `/pending-approval` page
- ✅ Pending users blocked from protected routes
- ✅ Admin dashboard shows "Pending Approvals" tab
- ✅ Admin can approve/reject users
- ✅ Email notifications sent on approval/rejection
- ✅ Approved users get full access

### **Phase 3: Usage Limits & Toggle (2 hours)**
- ✅ `voice_search_usage` table tracks daily counts
- ✅ Users see "X searches remaining today"
- ✅ After 10 searches, button shows "Daily limit reached"
- ✅ Quota resets at midnight UTC
- ✅ Admin dashboard has "System Settings" tab
- ✅ Toggle for "Require approval" works
- ✅ When OFF, new users get instant access

---

## Testing Checklist

### **Phase 1 Tests**

- [ ] Logout → Visit /rentals → Voice button is disabled
- [ ] Hover disabled button → Tooltip shows
- [ ] Login → Voice button becomes enabled
- [ ] Voice search works normally for authenticated users

### **Phase 2 Tests**

- [ ] Signup new user → approval_status is 'pending_approval'
- [ ] New user redirected to /pending-approval page
- [ ] New user tries /rentals → Blocked, redirected back
- [ ] Admin sees new user in "Pending Approvals" tab
- [ ] Admin approves user → Status changes to 'approved'
- [ ] Approved user receives email notification
- [ ] Approved user can now access /rentals

### **Phase 3 Tests**

- [ ] Approved user sees "10 searches remaining"
- [ ] After voice search, counter decrements to "9 remaining"
- [ ] After 10 searches, button shows "Daily limit reached"
- [ ] Next day (or manual date change), quota resets
- [ ] Admin toggles "Require approval" OFF
- [ ] New signup gets approval_status = 'approved' automatically

---

## Rollback Plan

If issues arise after deployment:

### **Phase 1 Rollback**
- Remove authentication check from VoiceSearchButton
- Redeploy previous version

### **Phase 2 Rollback**
- Set all pending users to 'approved' status
- Remove redirect logic

### **Phase 3 Rollback**
- Set VITE_FEATURE_VOICE_LIMITS=false (disable quota checking)
- Voice search works unlimited again

---

## Cost Analysis

### **Current Risk (No Protection)**
- Abuse scenario: 100 users × 100 searches/day = 10,000 searches
- Cost: 10,000 × $0.10 = **$1,000/day** 😱
- Monthly: **$30,000**

### **With Protection (10/day limit)**
- Realistic usage: 100 users × 10 searches/day = 1,000 searches
- Cost: 1,000 × $0.10 = **$100/day** ✅
- Monthly: **$3,000** (manageable)

### **With Approval System**
- Beta phase: ~20-50 approved users
- Cost: 50 users × 10 searches/day × $0.10 = **$50/day**
- Monthly: **$1,500** (ideal for beta)

---

## Future Enhancements (Post-MVP)

- [ ] Paid tiers: Pro users get 100 searches/day
- [ ] Analytics: Track which searches hit quota
- [ ] Automatic approval after identity verification
- [ ] Grace period: 1 extra search after hitting limit
- [ ] Weekly quota option (70 searches/week vs 10/day)

---

## Files to Create/Modify

### **Database Migration**
- `supabase/migrations/007_voice_auth_approval.sql`

### **Edge Functions**
- `supabase/functions/send-approval-email/index.ts`

### **Frontend Components (Modify)**
- `src/components/VoiceSearchButton.tsx`
- `src/hooks/useVoiceSearch.ts`
- `src/contexts/AuthContext.tsx`
- `src/pages/Rentals.tsx`
- `src/pages/AdminDashboard.tsx`

### **Frontend Components (New)**
- `src/pages/PendingApproval.tsx`
- `src/components/admin/PendingApprovals.tsx`
- `src/components/admin/SystemSettings.tsx`
- `src/components/VoiceQuotaIndicator.tsx`
- `src/hooks/useVoiceQuota.ts`
- `src/hooks/useSystemSettings.ts`

### **Documentation**
- `docs/features/voice-auth-approval/00-PROJECT-BRIEF.md` (this file)
- `docs/features/voice-auth-approval/handoffs/phase1-handoff.md`
- `docs/features/voice-auth-approval/handoffs/phase2-handoff.md`
- `docs/features/voice-auth-approval/handoffs/phase3-handoff.md`

---

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1 | 30 min | Auth gate on voice button |
| Phase 2 | 2 hours | User approval system |
| Phase 3 | 2 hours | Usage limits + admin toggle |
| Testing | 30 min | All flows validated |
| **Total** | **5 hours** | Production-ready |

---

## Questions for Product Owner (You!)

Before starting, confirm:

1. ✅ **Quota:** 10 voice searches per day is the right number?
2. ✅ **Approval:** New users should be "pending" by default (toggle = ON initially)?
3. ✅ **Email:** Use existing Resend setup for approval notifications?
4. ✅ **Existing Users:** Auto-approve all current users in database?
5. ✅ **RAV Team Exception:** RAV admins/staff bypass approval + quota limits?

**Assumptions (unless you tell me otherwise):**
- RAV team members always have unlimited access (no approval, no quota)
- Quota resets at midnight UTC (not user's local timezone)
- Rejected users can re-apply by contacting support (no auto-retry)

---

**Ready to proceed to Phase 1 task document?**
