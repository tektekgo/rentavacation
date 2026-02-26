import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import { buildEmailHtml, detailRow } from "../_shared/email-template.ts";

const HOLD_PERIOD_DAYS = 5;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: Record<string, unknown>) => {
  const d = details ? ` — ${JSON.stringify(details)}` : "";
  console.log(`[ESCROW-RELEASE] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    log("Function started");

    // ── Auth: accept admin JWT or service-role (for scheduled calls) ──
    const authHeader = req.headers.get("Authorization");
    if (authHeader && !authHeader.includes("service_role")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !userData.user) throw new Error("Authentication failed");

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      const isAdmin = roles?.some(
        (r: { role: string }) => r.role === "rav_admin" || r.role === "rav_staff"
      );
      if (!isAdmin) throw new Error("Only RAV admins can trigger escrow release");
      log("Admin authenticated", { userId: userData.user.id });
    }

    // ── Find all verified escrows past the hold period ──
    // We need the associated listing's check_out_date to calculate eligibility.
    const { data: escrows, error: escrowErr } = await supabase
      .from("booking_confirmations")
      .select(`
        id, booking_id, escrow_amount, escrow_status, payout_held,
        booking:bookings(
          id, status, owner_payout, payout_status, listing_id,
          listing:listings(
            check_out_date,
            property:properties(resort_name),
            owner:profiles!listings_owner_id_fkey(
              id, full_name, email,
              stripe_account_id, stripe_payouts_enabled
            )
          )
        )
      `)
      .eq("escrow_status", "verified")
      .eq("payout_held", false);

    if (escrowErr) throw new Error(`Failed to fetch escrows: ${escrowErr.message}`);

    if (!escrows || escrows.length === 0) {
      log("No verified escrows found");
      return new Response(
        JSON.stringify({ released: 0, payouts_initiated: 0, skipped: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log("Found verified escrows", { count: escrows.length });

    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - HOLD_PERIOD_DAYS);

    let released = 0;
    let payoutsInitiated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Optional Stripe setup (only if any owner has Connect)
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" }) : null;
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    for (const escrow of escrows) {
      const booking = escrow.booking as Record<string, unknown> | null;
      if (!booking) {
        log("Skipping: no booking", { escrowId: escrow.id });
        skipped++;
        continue;
      }

      const listing = booking.listing as Record<string, unknown> | null;
      if (!listing) {
        log("Skipping: no listing", { escrowId: escrow.id });
        skipped++;
        continue;
      }

      const checkOutDate = new Date(listing.check_out_date as string);
      if (isNaN(checkOutDate.getTime())) {
        log("Skipping: invalid checkout date", { escrowId: escrow.id });
        skipped++;
        continue;
      }

      // Check if hold period has passed
      if (checkOutDate > cutoffDate) {
        log("Skipping: hold period not elapsed", {
          escrowId: escrow.id,
          checkOut: listing.check_out_date,
          daysRemaining: Math.ceil((checkOutDate.getTime() - cutoffDate.getTime()) / 86400000),
        });
        skipped++;
        continue;
      }

      // Booking must be confirmed or completed
      if (booking.status !== "confirmed" && booking.status !== "completed") {
        log("Skipping: booking not confirmed/completed", {
          escrowId: escrow.id,
          bookingStatus: booking.status,
        });
        skipped++;
        continue;
      }

      // Already paid out?
      if (booking.payout_status === "paid" || booking.payout_status === "processing") {
        log("Skipping: payout already in progress/paid", {
          escrowId: escrow.id,
          payoutStatus: booking.payout_status,
        });
        skipped++;
        continue;
      }

      // ── Release escrow ──
      const { error: releaseErr } = await supabase
        .from("booking_confirmations")
        .update({
          escrow_status: "released",
          escrow_released_at: now.toISOString(),
          auto_released: true,
        })
        .eq("id", escrow.id);

      if (releaseErr) {
        errors.push(`Failed to release escrow ${escrow.id}: ${releaseErr.message}`);
        continue;
      }

      released++;
      log("Escrow released", { escrowId: escrow.id, bookingId: booking.id });

      // ── Attempt Stripe payout if owner is connected ──
      const owner = (listing.owner as Record<string, unknown> | null);
      if (!owner) {
        log("No owner found for payout", { escrowId: escrow.id });
        continue;
      }

      const ownerPayoutAmount = booking.owner_payout as number;
      const ownerStripeAccount = owner.stripe_account_id as string | null;
      const ownerPayoutsEnabled = owner.stripe_payouts_enabled as boolean;

      if (!stripe || !ownerStripeAccount || !ownerPayoutsEnabled) {
        // Non-Stripe owner: mark booking for manual payout
        await supabase
          .from("bookings")
          .update({ payout_status: "pending", payout_notes: "Escrow auto-released. Manual payout required (no Stripe Connect)." })
          .eq("id", booking.id);
        log("Manual payout needed", { ownerId: owner.id, bookingId: booking.id });
        continue;
      }

      try {
        const payoutCents = Math.round(ownerPayoutAmount * 100);
        const property = listing.property as Record<string, unknown> | null;
        const resortName = (property?.resort_name as string) || "Vacation Rental";

        const transfer = await stripe.transfers.create({
          amount: payoutCents,
          currency: "usd",
          destination: ownerStripeAccount,
          description: `Auto-payout for booking ${(booking.id as string).slice(0, 8).toUpperCase()} — ${resortName}`,
          metadata: {
            booking_id: booking.id as string,
            listing_id: booking.listing_id as string,
            owner_id: owner.id as string,
            auto_release: "true",
          },
        });

        // Update booking with transfer info
        await supabase
          .from("bookings")
          .update({
            payout_status: "processing",
            stripe_transfer_id: transfer.id,
            payout_reference: transfer.id,
            payout_notes: "Automated escrow release + Stripe payout",
          })
          .eq("id", booking.id);

        payoutsInitiated++;
        log("Stripe payout created", { transferId: transfer.id, amount: ownerPayoutAmount });

        // Send email notification to owner
        try {
          const checkIn = new Date(listing.check_out_date as string);
          checkIn.setDate(checkIn.getDate() - 7); // approximate

          const html = buildEmailHtml({
            recipientName: (owner.full_name as string) || "Property Owner",
            heading: "Your Payout Is On Its Way!",
            body: `
              <p>Great news! Your escrow has been automatically released and a payout has been initiated.</p>
              <div style="background: #f7fafc; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
                ${detailRow("Property", resortName)}
                ${detailRow("Payout Amount", `$${ownerPayoutAmount.toLocaleString()}`)}
                ${detailRow("Transfer ID", transfer.id)}
              </div>
              <p>Funds typically arrive in your bank account within 2–3 business days.</p>
            `,
            cta: { label: "View My Earnings", url: "https://rent-a-vacation.com/owner-dashboard?tab=earnings" },
          });

          await resend.emails.send({
            from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
            to: [owner.email as string],
            subject: `Payout Initiated — $${ownerPayoutAmount.toLocaleString()} for ${resortName}`,
            html,
          });
        } catch (emailErr) {
          log("Warning: email send failed", { error: String(emailErr) });
        }
      } catch (stripeErr) {
        const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr);
        errors.push(`Stripe payout failed for booking ${booking.id}: ${msg}`);
        log("Stripe payout failed", { bookingId: booking.id, error: msg });

        // Mark as failed so admin can retry
        await supabase
          .from("bookings")
          .update({ payout_status: "failed", payout_notes: `Auto-payout failed: ${msg}` })
          .eq("id", booking.id);
      }
    }

    const result = {
      released,
      payouts_initiated: payoutsInitiated,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    };

    log("Completed", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
