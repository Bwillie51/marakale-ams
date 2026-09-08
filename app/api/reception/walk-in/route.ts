import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Next.js Server-Side API Endpoint: Secure Walk-In & Pre-Booking Registration Processing
 * Location: app/api/reception/walk-in/route.ts
 * Robust, arrays-compatible version engineered to bypass RLS policies cleanly via service role overrides.
 */
export async function POST(request: Request) {
  try {
    const { 
      guestName, 
      guestEmail, 
      checkInDate, 
      checkOutDate, 
      checkoutTime, 
      roomId, // Can arrive as a singular string ID or an array of string IDs!
      computedDays, 
      baseAmount, 
      discountAmount, 
      gstAmount, 
      netAmount 
    } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    const adminBypassClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${serviceRoleKey}` } }
    });

    // 1. Write the primary master reservation row down directly to schemas with Active clearance
    const { data: reservation, error: resError } = await adminBypassClient
      .from("reservations")
      .insert({
        guest_name: guestName,
        guest_email: guestEmail,
        check_in: `${checkInDate}T14:00:00Z`,
        check_out: `${checkOutDate}T${checkoutTime}:00Z`,
        status: "Active", 
        total_days: computedDays,
        base_amount: baseAmount,
        discount_amount: discountAmount,
        gst_amount: gstAmount,
        net_amount: netAmount
      })
      .select()
      .single();

    if (resError) throw resError;

    // Normalize room IDs into an array configuration framework for loop iteration
    const targetRoomIds = Array.isArray(roomId) ? roomId : [roomId];

    // 2. Loop room collection to link junctions tables and transition room status settings concurrently
    for (const singleRoomId of targetRoomIds) {
      // Map allocation links
      await adminBypassClient
        .from("reservation_rooms")
        .insert({ reservation_id: reservation.id, room_id: singleRoomId });

      // Update room asset layout row status to Occupied live
      await adminBypassClient
        .from("rooms")
        .update({ status: "Occupied" })
        .eq("id", singleRoomId);
    }

    return NextResponse.json({ success: true, reservationId: reservation.id });

  } catch (err: any) {
    console.error("Server walk-in processing compilation failure:", err);
    return NextResponse.json({ error: err.message || "Internal database processing failure." }, { status: 400 });
  }
}
