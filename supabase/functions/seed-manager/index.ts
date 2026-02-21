// Seed Manager Edge Function
// Manages 3-layer test data for DEV environment:
//   Layer 1 — Foundation users (never wiped)
//   Layer 2 — Inventory (properties + listings)
//   Layer 3 — Transactions (renters + bookings + pipeline)

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// CONSTANTS
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SEED_PASSWORD = "SeedTest2026!";

// ============================================================
// FOUNDATION USERS (Layer 1)
// ============================================================

interface FoundationUser {
  email: string;
  full_name: string;
  account_type: "traveler" | "owner";
  extra_role?: string; // additional role to assign after trigger
}

const FOUNDATION_USERS: FoundationUser[] = [
  // RAV team (sign up as traveler → trigger gives 'renter' → we add rav_* role)
  { email: "dev-owner@rent-a-vacation.com", full_name: "RAV Dev Owner", account_type: "traveler", extra_role: "rav_owner" },
  { email: "dev-admin@rent-a-vacation.com", full_name: "RAV Dev Admin", account_type: "traveler", extra_role: "rav_admin" },
  { email: "dev-staff@rent-a-vacation.com", full_name: "RAV Dev Staff", account_type: "traveler", extra_role: "rav_staff" },
  // Property owners (sign up as owner → trigger gives 'property_owner' + creates verification)
  { email: "owner1@rent-a-vacation.com", full_name: "Alex Rivera", account_type: "owner" },
  { email: "owner2@rent-a-vacation.com", full_name: "Maria Chen", account_type: "owner" },
  { email: "owner3@rent-a-vacation.com", full_name: "James Thompson", account_type: "owner" },
  { email: "owner4@rent-a-vacation.com", full_name: "Priya Patel", account_type: "owner" },
  { email: "owner5@rent-a-vacation.com", full_name: "Robert Kim", account_type: "owner" },
];

// ============================================================
// PROPERTY DATA (Layer 2)
// ============================================================

interface PropertySeed {
  owner_email: string;
  brand: string;
  resort_name: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  sleeps: number;
  description: string;
  amenities: string[];
}

const PROPERTIES: PropertySeed[] = [
  // Owner 1 — Alex Rivera (HGV)
  {
    owner_email: "owner1@rent-a-vacation.com",
    brand: "hilton_grand_vacations",
    resort_name: "Elara by Hilton Grand Vacations",
    location: "Las Vegas, NV",
    bedrooms: 2, bathrooms: 2, sleeps: 6,
    description: "Luxury 2BR suite on the Las Vegas Strip with panoramic city views. Full kitchen, separate living area, and access to resort pool.",
    amenities: ["Pool", "Spa", "Fitness Center", "Full Kitchen", "Washer/Dryer", "Balcony"],
  },
  {
    owner_email: "owner1@rent-a-vacation.com",
    brand: "hilton_grand_vacations",
    resort_name: "Parc Soleil by Hilton Grand Vacations",
    location: "Orlando, FL",
    bedrooms: 1, bathrooms: 1, sleeps: 4,
    description: "Charming 1BR villa near Disney with resort-style pool and lazy river. Perfect for a family getaway.",
    amenities: ["Pool", "Lazy River", "Kids Club", "Full Kitchen", "BBQ Area"],
  },
  // Owner 2 — Maria Chen (Marriott)
  {
    owner_email: "owner2@rent-a-vacation.com",
    brand: "marriott_vacation_club",
    resort_name: "Marriott's Grande Vista",
    location: "Orlando, FL",
    bedrooms: 2, bathrooms: 2, sleeps: 8,
    description: "Spacious 2BR villa in the heart of Orlando. Minutes from theme parks with championship golf on-site.",
    amenities: ["Pool", "Golf Course", "Tennis Courts", "Full Kitchen", "Fitness Center"],
  },
  {
    owner_email: "owner2@rent-a-vacation.com",
    brand: "marriott_vacation_club",
    resort_name: "Marriott's Ko Olina Beach Club",
    location: "Kapolei, HI",
    bedrooms: 2, bathrooms: 2, sleeps: 8,
    description: "Oceanfront 2BR villa on Oahu's stunning Ko Olina coast. Private beach lagoon access and tropical gardens.",
    amenities: ["Beach Access", "Pool", "Snorkeling", "Full Kitchen", "BBQ Area", "Spa"],
  },
  // Owner 3 — James Thompson (Disney)
  {
    owner_email: "owner3@rent-a-vacation.com",
    brand: "disney_vacation_club",
    resort_name: "Disney's Animal Kingdom Villas",
    location: "Orlando, FL",
    bedrooms: 1, bathrooms: 1, sleeps: 5,
    description: "Savanna-view 1BR villa at Animal Kingdom Lodge. Watch African wildlife from your private balcony.",
    amenities: ["Theme Park Access", "Pool", "Savanna View", "Full Kitchen", "Kids Activities"],
  },
  {
    owner_email: "owner3@rent-a-vacation.com",
    brand: "disney_vacation_club",
    resort_name: "Disney's Beach Club Villas",
    location: "Orlando, FL",
    bedrooms: 2, bathrooms: 2, sleeps: 8,
    description: "2BR villa at EPCOT-area Beach Club. Walk to EPCOT and Hollywood Studios. Stormalong Bay pool access.",
    amenities: ["Theme Park Access", "Sand-Bottom Pool", "Beach", "Full Kitchen", "Spa"],
  },
  // Owner 4 — Priya Patel (Wyndham)
  {
    owner_email: "owner4@rent-a-vacation.com",
    brand: "wyndham_destinations",
    resort_name: "Wyndham Bonnet Creek Resort",
    location: "Orlando, FL",
    bedrooms: 2, bathrooms: 2, sleeps: 8,
    description: "2BR deluxe at Bonnet Creek surrounded by Disney property. 5 pools, lazy river, and mini golf.",
    amenities: ["Pool", "Lazy River", "Mini Golf", "Full Kitchen", "Fitness Center", "Playground"],
  },
  {
    owner_email: "owner4@rent-a-vacation.com",
    brand: "wyndham_destinations",
    resort_name: "Wyndham Ocean Walk",
    location: "Daytona Beach, FL",
    bedrooms: 1, bathrooms: 1, sleeps: 4,
    description: "Oceanfront 1BR at Daytona's Ocean Walk. Rooftop pool, steps from the beach and boardwalk.",
    amenities: ["Beach Access", "Rooftop Pool", "Full Kitchen", "Game Room", "Fitness Center"],
  },
  // Owner 5 — Robert Kim (Bluegreen)
  {
    owner_email: "owner5@rent-a-vacation.com",
    brand: "bluegreen_vacations",
    resort_name: "Bluegreen's Solterra Resort",
    location: "Orlando, FL",
    bedrooms: 2, bathrooms: 2, sleeps: 6,
    description: "2BR townhouse-style villa near Disney. Private splash pool and resort water park.",
    amenities: ["Private Pool", "Water Park", "Full Kitchen", "Washer/Dryer", "Playground"],
  },
  {
    owner_email: "owner5@rent-a-vacation.com",
    brand: "bluegreen_vacations",
    resort_name: "Bluegreen's Myrtle Beach Resort",
    location: "Myrtle Beach, SC",
    bedrooms: 2, bathrooms: 2, sleeps: 8,
    description: "Oceanfront 2BR at Myrtle Beach. Indoor and outdoor pools, oceanfront dining, and beach access.",
    amenities: ["Beach Access", "Indoor Pool", "Outdoor Pool", "Full Kitchen", "Restaurant"],
  },
];

// ============================================================
// RENTER NAMES (Layer 3) — 50 realistic names
// ============================================================

const RENTER_NAMES: string[] = [
  "Sophia Martinez", "Liam Johnson", "Olivia Williams", "Noah Brown", "Emma Davis",
  "Jackson Miller", "Ava Wilson", "Aiden Moore", "Isabella Taylor", "Lucas Anderson",
  "Mia Thomas", "Caden Jackson", "Harper White", "Mason Harris", "Evelyn Martin",
  "Elijah Thompson", "Abigail Garcia", "Logan Robinson", "Emily Clark", "Alexander Lewis",
  "Avery Walker", "Ethan Hall", "Scarlett Allen", "Jacob Young", "Madison King",
  "Michael Wright", "Aria Lopez", "Daniel Hill", "Chloe Scott", "Henry Green",
  "Layla Adams", "Sebastian Baker", "Penelope Nelson", "Mateo Carter", "Riley Mitchell",
  "Owen Perez", "Zoey Roberts", "Caleb Turner", "Nora Phillips", "Jack Campbell",
  "Lily Parker", "Ryan Evans", "Grace Edwards", "Leo Collins", "Hannah Stewart",
  "Nathan Sanchez", "Addison Morris", "Isaac Rogers", "Eleanor Reed", "Jayden Cook",
];

// ============================================================
// HELPER: Create admin client
// ============================================================

function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ============================================================
// HELPER: Random utilities
// ============================================================

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// ============================================================
// ACTION: getStatus
// ============================================================

async function getStatus(log: string[]): Promise<Record<string, number>> {
  const admin = createAdminClient();
  const tables = [
    "profiles", "user_roles", "properties", "listings", "bookings",
    "booking_confirmations", "cancellation_requests", "listing_bids",
    "travel_requests", "travel_proposals", "notifications",
    "owner_verifications", "owner_agreements", "user_memberships",
    "voice_search_usage", "favorites", "platform_guarantee_fund",
    "checkin_confirmations",
  ];

  const counts: Record<string, number> = {};
  for (const table of tables) {
    const { count, error } = await admin
      .from(table)
      .select("id", { count: "exact", head: true });
    counts[table] = error ? -1 : (count ?? 0);
  }

  // Foundation user count
  const { count: foundationCount } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_seed_foundation", true);
  counts["foundation_users"] = foundationCount ?? 0;

  // Last seed timestamp
  const { data: seedSetting } = await admin
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "last_seed_timestamp")
    .maybeSingle();
  if (seedSetting) {
    counts["_last_seed_timestamp"] = seedSetting.setting_value?.timestamp ?? 0;
  }

  log.push(`Status: ${JSON.stringify(counts)}`);
  return counts;
}

// ============================================================
// ACTION: deleteNonFoundation
// ============================================================

async function deleteNonFoundation(log: string[]): Promise<void> {
  const admin = createAdminClient();

  // Get foundation user IDs
  const { data: foundationProfiles } = await admin
    .from("profiles")
    .select("id")
    .eq("is_seed_foundation", true);
  const foundationIds = (foundationProfiles ?? []).map((p: { id: string }) => p.id);

  log.push(`Foundation users to keep: ${foundationIds.length}`);

  // Get ALL non-foundation user IDs for targeted deletes
  const { data: allProfiles } = await admin
    .from("profiles")
    .select("id")
    .eq("is_seed_foundation", false);
  const nonFoundationIds = (allProfiles ?? []).map((p: { id: string }) => p.id);

  log.push(`Non-foundation users to remove: ${nonFoundationIds.length}`);

  // 1. checkin_confirmations (all)
  const { error: e1 } = await admin.from("checkin_confirmations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  log.push(`Deleted checkin_confirmations: ${e1 ? `ERROR: ${e1.message}` : "OK"}`);

  // 2. cancellation_requests (all)
  const { error: e2 } = await admin.from("cancellation_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  log.push(`Deleted cancellation_requests: ${e2 ? `ERROR: ${e2.message}` : "OK"}`);

  // 3. platform_guarantee_fund (all)
  const { error: e3 } = await admin.from("platform_guarantee_fund").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  log.push(`Deleted platform_guarantee_fund: ${e3 ? `ERROR: ${e3.message}` : "OK"}`);

  // 4. booking_confirmations (all)
  const { error: e4 } = await admin.from("booking_confirmations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  log.push(`Deleted booking_confirmations: ${e4 ? `ERROR: ${e4.message}` : "OK"}`);

  // 5. bookings (all)
  const { error: e5 } = await admin.from("bookings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  log.push(`Deleted bookings: ${e5 ? `ERROR: ${e5.message}` : "OK"}`);

  // 6. listing_bids (all)
  const { error: e6 } = await admin.from("listing_bids").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  log.push(`Deleted listing_bids: ${e6 ? `ERROR: ${e6.message}` : "OK"}`);

  // 7. travel_proposals (all)
  const { error: e7 } = await admin.from("travel_proposals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  log.push(`Deleted travel_proposals: ${e7 ? `ERROR: ${e7.message}` : "OK"}`);

  // 8. travel_requests (all)
  const { error: e8 } = await admin.from("travel_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  log.push(`Deleted travel_requests: ${e8 ? `ERROR: ${e8.message}` : "OK"}`);

  // 9. notifications (all)
  const { error: e9 } = await admin.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  log.push(`Deleted notifications: ${e9 ? `ERROR: ${e9.message}` : "OK"}`);

  // 10. listings (all)
  const { error: e10 } = await admin.from("listings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  log.push(`Deleted listings: ${e10 ? `ERROR: ${e10.message}` : "OK"}`);

  // 11. owner_verifications (non-foundation only)
  if (foundationIds.length > 0) {
    const { error: e11 } = await admin.from("owner_verifications").delete().not("owner_id", "in", `(${foundationIds.join(",")})`);
    log.push(`Deleted non-foundation owner_verifications: ${e11 ? `ERROR: ${e11.message}` : "OK"}`);
  }

  // 12. owner_agreements (non-foundation only)
  if (foundationIds.length > 0) {
    const { error: e12 } = await admin.from("owner_agreements").delete().not("owner_id", "in", `(${foundationIds.join(",")})`);
    log.push(`Deleted non-foundation owner_agreements: ${e12 ? `ERROR: ${e12.message}` : "OK"}`);
  }

  // 13. properties (all)
  const { error: e13 } = await admin.from("properties").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  log.push(`Deleted properties: ${e13 ? `ERROR: ${e13.message}` : "OK"}`);

  // 14. voice_search_usage (non-foundation) — NO CASCADE on auth.users FK
  if (nonFoundationIds.length > 0) {
    for (let i = 0; i < nonFoundationIds.length; i += 50) {
      const batch = nonFoundationIds.slice(i, i + 50);
      await admin.from("voice_search_usage").delete().in("user_id", batch);
    }
  }
  log.push("Deleted non-foundation voice_search_usage: OK");

  // 15. favorites (non-foundation)
  if (nonFoundationIds.length > 0) {
    for (let i = 0; i < nonFoundationIds.length; i += 50) {
      const batch = nonFoundationIds.slice(i, i + 50);
      await admin.from("favorites").delete().in("user_id", batch);
    }
  }
  log.push("Deleted non-foundation favorites: OK");

  // 16. user_memberships (non-foundation)
  if (nonFoundationIds.length > 0) {
    for (let i = 0; i < nonFoundationIds.length; i += 50) {
      const batch = nonFoundationIds.slice(i, i + 50);
      await admin.from("user_memberships").delete().in("user_id", batch);
    }
  }
  log.push("Deleted non-foundation user_memberships: OK");

  // 17. user_roles (non-foundation)
  if (nonFoundationIds.length > 0) {
    for (let i = 0; i < nonFoundationIds.length; i += 50) {
      const batch = nonFoundationIds.slice(i, i + 50);
      await admin.from("user_roles").delete().in("user_id", batch);
    }
  }
  log.push("Deleted non-foundation user_roles: OK");

  // 18. role_upgrade_requests (non-foundation)
  if (nonFoundationIds.length > 0) {
    for (let i = 0; i < nonFoundationIds.length; i += 50) {
      const batch = nonFoundationIds.slice(i, i + 50);
      await admin.from("role_upgrade_requests").delete().in("user_id", batch);
    }
  }
  log.push("Deleted non-foundation role_upgrade_requests: OK");

  // 19. system_settings — NULL out updated_by for non-foundation users
  if (nonFoundationIds.length > 0) {
    for (let i = 0; i < nonFoundationIds.length; i += 50) {
      const batch = nonFoundationIds.slice(i, i + 50);
      await admin.from("system_settings").update({ updated_by: null }).in("updated_by", batch);
    }
  }
  log.push("Nulled non-foundation system_settings.updated_by: OK");

  // 20. profiles (non-foundation)
  if (nonFoundationIds.length > 0) {
    for (let i = 0; i < nonFoundationIds.length; i += 50) {
      const batch = nonFoundationIds.slice(i, i + 50);
      await admin.from("profiles").delete().in("id", batch);
    }
  }
  log.push("Deleted non-foundation profiles: OK");

  // 21. auth.users — delete non-foundation via admin API
  if (nonFoundationIds.length > 0) {
    let deleted = 0;
    for (const uid of nonFoundationIds) {
      const { error } = await admin.auth.admin.deleteUser(uid);
      if (!error) deleted++;
    }
    log.push(`Deleted ${deleted}/${nonFoundationIds.length} auth.users`);
  } else {
    log.push("No non-foundation auth.users to delete");
  }
}

// ============================================================
// ACTION: ensureFoundation (Layer 1)
// ============================================================

async function ensureFoundation(log: string[]): Promise<Map<string, string>> {
  const admin = createAdminClient();
  const emailToId = new Map<string, string>();

  for (const fu of FOUNDATION_USERS) {
    // Check if already exists
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, email")
      .eq("email", fu.email)
      .eq("is_seed_foundation", true)
      .maybeSingle();

    if (existingProfile) {
      emailToId.set(fu.email, existingProfile.id);
      log.push(`Foundation user exists: ${fu.email} (${existingProfile.id})`);
      continue;
    }

    // Check if auth user exists (maybe without foundation flag)
    const { data: { users: existingUsers } } = await admin.auth.admin.listUsers({ perPage: 1 });
    // Search by email more reliably
    const { data: profileByEmail } = await admin
      .from("profiles")
      .select("id")
      .eq("email", fu.email)
      .maybeSingle();

    if (profileByEmail) {
      // User exists but not flagged as foundation — flag them
      await admin
        .from("profiles")
        .update({
          is_seed_foundation: true,
          full_name: fu.full_name,
          approval_status: "approved",
        })
        .eq("id", profileByEmail.id);
      emailToId.set(fu.email, profileByEmail.id);
      log.push(`Flagged existing user as foundation: ${fu.email}`);
      continue;
    }

    // Create new auth user — handle_new_user() trigger fires automatically
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: fu.email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: fu.full_name,
        account_type: fu.account_type,
      },
    });

    if (createError) {
      log.push(`ERROR creating ${fu.email}: ${createError.message}`);
      continue;
    }

    const userId = newUser.user.id;
    emailToId.set(fu.email, userId);

    // Wait briefly for trigger to fire
    await new Promise(r => setTimeout(r, 300));

    // Update profile: approved + foundation flag
    await admin
      .from("profiles")
      .update({
        approval_status: "approved",
        is_seed_foundation: true,
      })
      .eq("id", userId);

    // For property owners: update verification + create agreement
    if (fu.account_type === "owner") {
      await admin
        .from("owner_verifications")
        .update({
          trust_level: "verified",
          verification_status: "approved",
        })
        .eq("owner_id", userId);

      await admin.from("owner_agreements").insert({
        owner_id: userId,
        status: "active",
        commission_rate: 15,
        markup_allowed: true,
        max_markup_percent: 25,
        terms_accepted_at: new Date().toISOString(),
        effective_date: new Date().toISOString().split("T")[0],
      });
    }

    // For RAV team: add extra role
    if (fu.extra_role) {
      await admin.from("user_roles").insert({
        user_id: userId,
        role: fu.extra_role,
      });
    }

    log.push(`Created foundation user: ${fu.email} → ${userId}`);
  }

  return emailToId;
}

// ============================================================
// ACTION: createInventory (Layer 2)
// ============================================================

async function createInventory(
  emailToId: Map<string, string>,
  log: string[],
): Promise<{ propertyIds: string[]; listingIds: string[] }> {
  const admin = createAdminClient();
  const propertyIds: string[] = [];
  const listingIds: string[] = [];

  // Create 10 properties
  for (const p of PROPERTIES) {
    const ownerId = emailToId.get(p.owner_email);
    if (!ownerId) {
      log.push(`Skipping property for ${p.owner_email}: owner not found`);
      continue;
    }

    // Try to find matching resort
    const { data: resort } = await admin
      .from("resorts")
      .select("id")
      .ilike("resort_name", `%${p.resort_name.split("'s ").pop()?.split(" by ").shift() ?? p.resort_name}%`)
      .maybeSingle();

    const { data: property, error: propError } = await admin
      .from("properties")
      .insert({
        owner_id: ownerId,
        brand: p.brand,
        resort_name: p.resort_name,
        location: p.location,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        sleeps: p.sleeps,
        description: p.description,
        amenities: p.amenities,
        images: [],
        resort_id: resort?.id ?? null,
      })
      .select("id")
      .single();

    if (propError) {
      log.push(`ERROR creating property ${p.resort_name}: ${propError.message}`);
      continue;
    }

    propertyIds.push(property.id);
  }

  log.push(`Created ${propertyIds.length} properties`);

  // Create 30 listings across all properties
  const cancellationPolicies = ["flexible", "moderate", "strict", "super_strict"];
  const ownerEmails = [
    "owner1@rent-a-vacation.com", "owner2@rent-a-vacation.com",
    "owner3@rent-a-vacation.com", "owner4@rent-a-vacation.com",
    "owner5@rent-a-vacation.com",
  ];

  let listingIndex = 0;
  for (let i = 0; i < 30; i++) {
    const propIndex = i % propertyIds.length;
    const propertyId = propertyIds[propIndex];
    const ownerEmail = ownerEmails[Math.floor(propIndex / 2)];
    const ownerId = emailToId.get(ownerEmail);
    if (!ownerId) continue;

    const checkInDays = randomInt(30, 180);
    const stayLength = randomInt(3, 10);
    const ownerPrice = randomInt(700, 3000);
    const ravMarkup = Math.round(ownerPrice * 0.15);
    const finalPrice = ownerPrice + ravMarkup;

    let status: string;
    let openForBidding = false;
    let biddingEndsAt: string | null = null;
    let approvedBy: string | null = null;
    let approvedAt: string | null = null;

    // Get an admin ID for approvals
    const adminId = emailToId.get("dev-admin@rent-a-vacation.com") ?? null;

    if (i < 15) {
      // 15 fixed-price active
      status = "active";
      approvedBy = adminId;
      approvedAt = daysAgo(randomInt(1, 30));
    } else if (i < 25) {
      // 10 bidding
      status = "active";
      openForBidding = true;
      biddingEndsAt = daysFromNow(randomInt(7, 14));
      approvedBy = adminId;
      approvedAt = daysAgo(randomInt(1, 14));
    } else {
      // 5 draft
      status = "draft";
    }

    const { data: listing, error: listError } = await admin
      .from("listings")
      .insert({
        property_id: propertyId,
        owner_id: ownerId,
        status,
        check_in_date: daysFromNow(checkInDays).split("T")[0],
        check_out_date: daysFromNow(checkInDays + stayLength).split("T")[0],
        owner_price: ownerPrice,
        rav_markup: ravMarkup,
        final_price: finalPrice,
        cancellation_policy: randomChoice(cancellationPolicies),
        approved_by: approvedBy,
        approved_at: approvedAt,
        notes: status === "draft" ? "Draft listing — pending owner completion" : null,
        ...(openForBidding ? {
          open_for_bidding: true,
          bidding_ends_at: biddingEndsAt,
          min_bid_amount: Math.round(finalPrice * 0.7),
          allow_counter_offers: true,
        } : {}),
      })
      .select("id")
      .single();

    if (listError) {
      log.push(`ERROR creating listing #${i}: ${listError.message}`);
      continue;
    }

    listingIds.push(listing.id);
    listingIndex++;
  }

  log.push(`Created ${listingIds.length} listings (15 active, 10 bidding, 5 draft)`);
  return { propertyIds, listingIds };
}

// ============================================================
// ACTION: createTransactions (Layer 3)
// ============================================================

async function createTransactions(
  emailToId: Map<string, string>,
  listingIds: string[],
  propertyIds: string[],
  log: string[],
): Promise<void> {
  const admin = createAdminClient();

  // ── Create 50 renters ──
  const renterIds: string[] = [];
  const renterSignupDays: number[] = [];

  // Distribute: 8 (90-60 ago), 16 (60-30 ago), 26 (30-0 ago)
  const distributions = [
    { count: 8, minDays: 60, maxDays: 90 },
    { count: 16, minDays: 30, maxDays: 60 },
    { count: 26, minDays: 0, maxDays: 30 },
  ];

  let renterIndex = 0;
  for (const dist of distributions) {
    for (let i = 0; i < dist.count; i++) {
      const idx = renterIndex;
      const email = `renter${String(idx + 1).padStart(3, "0")}@rent-a-vacation.com`;
      const name = RENTER_NAMES[idx] ?? `Test Renter ${idx + 1}`;
      const signupDaysAgo = randomInt(dist.minDays, dist.maxDays);

      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password: SEED_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: name, account_type: "traveler" },
      });

      if (createError) {
        log.push(`ERROR creating renter ${email}: ${createError.message}`);
        renterIndex++;
        continue;
      }

      const userId = newUser.user.id;
      renterIds.push(userId);
      renterSignupDays.push(signupDaysAgo);

      // Wait for trigger
      await new Promise(r => setTimeout(r, 150));

      // Update profile: approved + backdated created_at
      await admin
        .from("profiles")
        .update({
          approval_status: "approved",
          created_at: daysAgo(signupDaysAgo),
        })
        .eq("id", userId);

      renterIndex++;
    }
  }

  log.push(`Created ${renterIds.length} renters`);

  // ── Active listing IDs (first 25 — non-draft) for bookings ──
  const activeListingIds = listingIds.slice(0, 25);
  if (activeListingIds.length === 0) {
    log.push("No active listings for bookings — skipping transactions");
    return;
  }

  // Fetch listing details for booking amounts
  const { data: listingsData } = await admin
    .from("listings")
    .select("id, owner_id, final_price, owner_price, rav_markup, property_id")
    .in("id", activeListingIds);
  const listingsMap = new Map((listingsData ?? []).map((l: Record<string, unknown>) => [l.id as string, l]));

  // ── 90 completed bookings ──
  const bookingDistributions = [
    { count: 15, minDays: 60, maxDays: 90 },
    { count: 30, minDays: 30, maxDays: 60 },
    { count: 45, minDays: 0, maxDays: 30 },
  ];

  const completedBookingIds: string[] = [];
  let bookingIdx = 0;

  for (const dist of bookingDistributions) {
    for (let i = 0; i < dist.count; i++) {
      const renterId = renterIds[bookingIdx % renterIds.length];
      const listingId = activeListingIds[bookingIdx % activeListingIds.length];
      const listing = listingsMap.get(listingId);
      if (!listing) { bookingIdx++; continue; }

      const totalAmount = randomInt(900, 3200);
      const ravCommission = Math.round(totalAmount * 0.15);
      const ownerPayout = totalAmount - ravCommission;
      const createdDaysAgo = randomInt(dist.minDays, dist.maxDays);
      const paymentId = `pi_test_seed_${randomHex(8)}`;

      const { data: booking, error: bookErr } = await admin
        .from("bookings")
        .insert({
          listing_id: listingId,
          renter_id: renterId,
          status: "completed",
          total_amount: totalAmount,
          rav_commission: ravCommission,
          owner_payout: ownerPayout,
          guest_count: randomInt(1, 6),
          payment_intent_id: paymentId,
          paid_at: daysAgo(createdDaysAgo),
          payout_status: "paid",
          payout_date: daysAgo(Math.max(createdDaysAgo - 7, 0)),
          created_at: daysAgo(createdDaysAgo),
        })
        .select("id")
        .single();

      if (bookErr) {
        log.push(`ERROR creating completed booking #${bookingIdx}: ${bookErr.message}`);
        bookingIdx++;
        continue;
      }

      completedBookingIds.push(booking.id);

      // booking_confirmation for completed bookings
      await admin.from("booking_confirmations").insert({
        booking_id: booking.id,
        listing_id: listingId,
        owner_id: listing.owner_id as string,
        resort_confirmation_number: `RST${String(randomInt(100000, 999999))}`,
        confirmation_deadline: daysAgo(Math.max(createdDaysAgo - 2, 0)),
        confirmation_submitted_at: daysAgo(Math.max(createdDaysAgo - 1, 0)),
        verified_by_rav: true,
        escrow_status: "released",
        escrow_amount: totalAmount,
        escrow_released_at: daysAgo(Math.max(createdDaysAgo - 3, 0)),
        owner_confirmation_status: "owner_confirmed",
        owner_confirmed_at: daysAgo(Math.max(createdDaysAgo - 1, 0)),
        owner_confirmation_deadline: daysAgo(Math.max(createdDaysAgo - 2, 0)),
      });

      // Platform guarantee fund contribution
      await admin.from("platform_guarantee_fund").insert({
        booking_id: booking.id,
        contribution_amount: Math.round(totalAmount * 0.02),
        contribution_percentage: 2,
      });

      bookingIdx++;
    }
  }

  log.push(`Created ${completedBookingIds.length} completed bookings with confirmations`);

  // ── 10 pending bookings ──
  const pendingBookingIds: string[] = [];
  for (let i = 0; i < 10; i++) {
    const renterId = renterIds[randomInt(0, renterIds.length - 1)];
    const listingId = activeListingIds[i % activeListingIds.length];
    const listing = listingsMap.get(listingId);
    if (!listing) continue;

    const totalAmount = randomInt(900, 3200);
    const ravCommission = Math.round(totalAmount * 0.15);
    const ownerPayout = totalAmount - ravCommission;

    const { data: booking } = await admin
      .from("bookings")
      .insert({
        listing_id: listingId,
        renter_id: renterId,
        status: "pending",
        total_amount: totalAmount,
        rav_commission: ravCommission,
        owner_payout: ownerPayout,
        guest_count: randomInt(1, 4),
      })
      .select("id")
      .single();

    if (booking) pendingBookingIds.push(booking.id);
  }
  log.push(`Created ${pendingBookingIds.length} pending bookings`);

  // ── 5 confirmed in escrow ──
  for (let i = 0; i < 5; i++) {
    const renterId = renterIds[randomInt(0, renterIds.length - 1)];
    const listingId = activeListingIds[(i + 10) % activeListingIds.length];
    const listing = listingsMap.get(listingId);
    if (!listing) continue;

    const totalAmount = randomInt(1200, 2800);
    const ravCommission = Math.round(totalAmount * 0.15);
    const ownerPayout = totalAmount - ravCommission;

    const { data: booking } = await admin
      .from("bookings")
      .insert({
        listing_id: listingId,
        renter_id: renterId,
        status: "confirmed",
        total_amount: totalAmount,
        rav_commission: ravCommission,
        owner_payout: ownerPayout,
        guest_count: randomInt(2, 6),
        payment_intent_id: `pi_test_seed_${randomHex(8)}`,
        paid_at: daysAgo(randomInt(1, 5)),
      })
      .select("id")
      .single();

    if (booking) {
      await admin.from("booking_confirmations").insert({
        booking_id: booking.id,
        listing_id: listingId,
        owner_id: listing.owner_id as string,
        confirmation_deadline: daysFromNow(2),
        escrow_status: "pending_confirmation",
        escrow_amount: totalAmount,
        owner_confirmation_status: "pending_owner",
        owner_confirmation_deadline: daysFromNow(1),
      });
    }
  }
  log.push("Created 5 confirmed-in-escrow bookings");

  // ── 5 cancellation requests ──
  const cancellationStatuses = ["pending", "pending", "approved", "denied", "completed"];
  for (let i = 0; i < Math.min(5, completedBookingIds.length); i++) {
    const bookingId = completedBookingIds[completedBookingIds.length - 1 - i];
    const renterId = renterIds[randomInt(0, renterIds.length - 1)];
    const refundAmount = randomInt(500, 2000);

    await admin.from("cancellation_requests").insert({
      booking_id: bookingId,
      requester_id: renterId,
      status: cancellationStatuses[i],
      reason: randomChoice([
        "Change of travel plans",
        "Medical emergency",
        "Found better deal elsewhere",
        "Weather concerns at destination",
        "Work schedule conflict",
      ]),
      requested_refund_amount: refundAmount,
      policy_refund_amount: Math.round(refundAmount * 0.5),
      days_until_checkin: randomInt(5, 30),
      ...(cancellationStatuses[i] === "approved" ? {
        final_refund_amount: Math.round(refundAmount * 0.5),
        responded_at: daysAgo(randomInt(1, 5)),
      } : {}),
      ...(cancellationStatuses[i] === "denied" ? {
        owner_response: "Unable to cancel at this time due to resort policy.",
        responded_at: daysAgo(randomInt(1, 5)),
      } : {}),
    });
  }
  log.push("Created 5 cancellation requests");

  // ── 20 listing bids on bidding listings ──
  const biddingListingIds = listingIds.slice(15, 25); // indices 15-24 are bidding
  const bidStatuses = ["pending", "pending", "pending", "accepted", "rejected"];
  let bidsCreated = 0;

  for (let i = 0; i < 20; i++) {
    const listingId = biddingListingIds[i % biddingListingIds.length];
    const listing = listingsMap.get(listingId);
    if (!listing) continue;

    const renterId = renterIds[randomInt(0, renterIds.length - 1)];
    const finalPrice = (listing.final_price as number) ?? 1500;
    const bidAmount = Math.round(finalPrice * (0.6 + Math.random() * 0.5));

    const { error } = await admin.from("listing_bids").insert({
      listing_id: listingId,
      bidder_id: renterId,
      status: randomChoice(bidStatuses),
      bid_amount: bidAmount,
      message: randomChoice([
        "Would love to stay here for our family vacation!",
        "We're celebrating our anniversary. Any flexibility on price?",
        "Interested in booking for a group trip.",
        "Perfect dates for our spring break getaway!",
        null,
      ]),
      guest_count: randomInt(1, 6),
    });

    if (!error) bidsCreated++;
  }
  log.push(`Created ${bidsCreated} listing bids`);

  // ── 10 travel requests ──
  const destinations = [
    "Orlando, FL", "Las Vegas, NV", "Kapolei, HI", "Myrtle Beach, SC",
    "Daytona Beach, FL", "Orlando, FL", "Las Vegas, NV", "Kapolei, HI",
    "Orlando, FL", "Myrtle Beach, SC",
  ];
  const travelRequestIds: string[] = [];

  for (let i = 0; i < 10; i++) {
    const renterId = renterIds[randomInt(0, renterIds.length - 1)];
    const checkInDays = randomInt(30, 120);

    const { data: request } = await admin
      .from("travel_requests")
      .insert({
        traveler_id: renterId,
        status: i < 8 ? "open" : randomChoice(["closed", "fulfilled"]),
        destination_location: destinations[i],
        check_in_date: daysFromNow(checkInDays).split("T")[0],
        check_out_date: daysFromNow(checkInDays + randomInt(3, 10)).split("T")[0],
        dates_flexible: Math.random() > 0.5,
        flexibility_days: randomInt(1, 5),
        guest_count: randomInt(1, 6),
        bedrooms_needed: randomInt(1, 3),
        budget_preference: randomChoice(["range", "ceiling", "undisclosed"]),
        budget_min: randomInt(500, 1000),
        budget_max: randomInt(1500, 3000),
        proposals_deadline: daysFromNow(randomInt(7, 21)),
      })
      .select("id")
      .single();

    if (request) travelRequestIds.push(request.id);
  }
  log.push(`Created ${travelRequestIds.length} travel requests`);

  // ── 8 travel proposals ──
  let proposalsCreated = 0;
  for (let i = 0; i < Math.min(8, travelRequestIds.length); i++) {
    const requestId = travelRequestIds[i];
    const propIdx = i % propertyIds.length;
    const propertyId = propertyIds[propIdx];
    const ownerEmail = ["owner1@rent-a-vacation.com", "owner2@rent-a-vacation.com",
      "owner3@rent-a-vacation.com", "owner4@rent-a-vacation.com",
      "owner5@rent-a-vacation.com"][Math.floor(propIdx / 2)];
    const ownerId = emailToId.get(ownerEmail);
    if (!ownerId) continue;

    const checkInDays = randomInt(30, 90);
    const { error } = await admin.from("travel_proposals").insert({
      request_id: requestId,
      property_id: propertyId,
      owner_id: ownerId,
      status: randomChoice(["pending", "pending", "accepted", "rejected"]),
      proposed_price: randomInt(800, 2500),
      message: randomChoice([
        "Our property would be perfect for your trip!",
        "We have availability for your dates with a special rate.",
        "Beautiful unit with all the amenities you're looking for.",
        null,
      ]),
      proposed_check_in: daysFromNow(checkInDays).split("T")[0],
      proposed_check_out: daysFromNow(checkInDays + randomInt(3, 7)).split("T")[0],
      valid_until: daysFromNow(randomInt(7, 14)),
    });

    if (!error) proposalsCreated++;
  }
  log.push(`Created ${proposalsCreated} travel proposals`);

  // ── Update last_seed_timestamp ──
  await admin.from("system_settings").upsert({
    setting_key: "last_seed_timestamp",
    setting_value: { timestamp: new Date().toISOString() },
    description: "Last time seed data was generated",
  }, { onConflict: "setting_key" });

  log.push("Seed timestamp updated");
}

// ============================================================
// MAIN HANDLER
// ============================================================

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Production guard
  if (Deno.env.get("IS_DEV_ENVIRONMENT") !== "true") {
    return new Response(
      JSON.stringify({ error: "Seed manager is disabled in production" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const { action } = await req.json();
    const log: string[] = [];

    if (action === "status") {
      const counts = await getStatus(log);
      return new Response(
        JSON.stringify({ success: true, counts, log }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "reseed") {
      log.push("=== Starting reseed ===");
      const startTime = Date.now();

      // Step 1: Ensure foundation users
      log.push("--- Layer 1: Foundation users ---");
      const emailToId = await ensureFoundation(log);

      // Step 2: Delete non-foundation data
      log.push("--- Deleting non-foundation data ---");
      await deleteNonFoundation(log);

      // Step 3: Create inventory
      log.push("--- Layer 2: Inventory ---");
      const { propertyIds, listingIds } = await createInventory(emailToId, log);

      // Step 4: Create transactions
      log.push("--- Layer 3: Transactions ---");
      await createTransactions(emailToId, listingIds, propertyIds, log);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      log.push(`=== Reseed complete in ${elapsed}s ===`);

      // Get final status
      const counts = await getStatus(log);

      return new Response(
        JSON.stringify({ success: true, elapsed_seconds: parseFloat(elapsed), counts, log }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}. Use "status" or "reseed".` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
