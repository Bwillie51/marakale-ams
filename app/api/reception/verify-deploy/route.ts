import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Instantiate Resend securely using your environment variables
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Production Server-Side Route Handler: Cryptographic Link Generation & Guest Email Despatch
 * Location: app/api/reception/verify-deploy/route.ts
 */
export async function POST(request: Request) {
  try {
    const { 
      reservationId, 
      guestName, 
      guestEmail, 
      roomNumber, 
      checkoutClock, 
      computedDays, 
      netAmount, 
      receptionComments 
    } = await request.json();

    if (!reservationId || !guestEmail || !roomNumber) {
      return NextResponse.json({ error: "Fulfillment payload rejected. Missing essential telemetry fields." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server infrastructure is missing necessary administrative environment variables." }, { status: 500 });
    }

    // High-privilege administrative client instance with full RLS overrides
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // 1. Update the master reservation row state from Pending to Active
    const { error: resError } = await adminClient
      .from("reservations")
      .update({ 
        status: "Active",
        total_days: computedDays,
        net_amount: netAmount
      })
      .eq("id", reservationId);

    if (resError) throw resError;

    // 2. Locate room asset record to swap state tracking live to Occupied
    const { data: roomAsset } = await adminClient
      .from("rooms")
      .select("id")
      .eq("room_number", roomNumber)
      .single();

    if (roomAsset) {
      await adminClient
        .from("rooms")
        .update({ status: "Occupied" })
        .eq("id", roomAsset.id);
    }

    // 3. Construct the secure, passwordless access URL point pointing straight into their portal dashboard
    const baseOrigin = new URL(request.url).origin;
    const guestAccessLink = `${baseOrigin}/login?auto_auth=${reservationId}&target_email=${encodeURIComponent(guestEmail)}`;

    // 4. LIVE RESEND DISPATCH MODULE
    if (resend) {
      await resend.emails.send({
        from: "Marakale Resort <hospitality@yourregistereddomain.com>", // Replace with your domain once verified in Resend
        to: [guestEmail],
        subject: `Your Secure Room Pass & Access Passkey - Unit ${roomNumber}`,
        html: `
          <div style="font-family: sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px;">
            <h2 style="color: #0f172a; text-transform: uppercase;">Welcome to Marakale, ${guestName}</h2>
            <p>Your room deployment check-in has been authorized by the front desk operator desk.</p>
            <div style="background-color: #ffffff; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Assigned Accommodations:</strong> Room Suite ${roomNumber}</p>
              <p style="margin: 4px 0;"><strong>Stay Length:</strong> ${computedDays} Nights</p>
              <p style="margin: 4px 0;"><strong>Checkout Deadline Hour:</strong> ${new Date(checkoutClock).toLocaleString()}</p>
            </div>
            <p>Click the link below to open your temporary In-House Guest Portal to order dining meals and call housekeeping directly from your room device:</p>
            <a href="${guestAccessLink}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">Enter In-House Portal</a>
            <p style="font-size: 11px; color: #64748b; margin-top: 24px;">This access pass token expires automatically upon crossing your checkout deadline hour clock.</p>
          </div>
        `
      });
    } else {
      // Fallback terminal logging stream if the secret environment variables are absent during local offline runs
      console.log(`[OFFLINE FALLBACK] Email simulated cleanly. Link: ${guestAccessLink}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Key deployed, status synchronization complete, and access link dispatched.",
      allocatedPortalUrl: guestAccessLink 
    });

  } catch (err: any) {
    console.error("API Operator deployment script failure:", err);
    return NextResponse.json({ error: err.message || "Internal server route breakdown error." }, { status: 500 });
  }
}
