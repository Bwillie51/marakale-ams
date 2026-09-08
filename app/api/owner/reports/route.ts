import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Next.js Server API Endpoint: Executive PDF Financial Document Compilation
 * Location: app/api/owner/reports/route.ts
 */
export async function POST(request: Request) {
  try {
    const { reportType, targetDate } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing environmental security credentials keys." }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    let compiledData = [];

    // Query targeted relational frameworks depending on clicked metric context parameters
    if (reportType === "lodging" || reportType === "total") {
      const { data } = await supabaseAdmin.from("reservations").select("*").order("check_in", { ascending: false });
      if (data) compiledData = data;
    } else if (reportType === "meals") {
      const { data } = await supabaseAdmin.from("meal_orders").select("*").order("created_at", { ascending: false });
      if (data) compiledData = data;
    } else if (reportType === "services") {
      const { data } = await supabaseAdmin.from("service_requests").select("*").order("created_at", { ascending: false });
      if (data) compiledData = data;
    }

    // Return the payload data block out cleanly to the file generator triggers
    return NextResponse.json({ 
      success: true, 
      reportType,
      generatedAt: new Date().toISOString(),
      records: compiledData 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server document execution failure." }, { status: 500 });
  }
}
