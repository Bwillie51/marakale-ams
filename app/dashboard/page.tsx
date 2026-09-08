"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { RefreshCw, ShieldAlert } from "lucide-react";

/**
 * Marakale Master Session Routing Switchboard Gateway
 * Location: app/dashboard/page.tsx
 * Intercepts authenticated user contexts and branches paths straight to explicit workstation folders.
 */
export default function MasterDashboardSwitchboardPage() {
  const router = useRouter();
  const [routingFeedback, setRoutingFeedback] = useState<string>("Initializing secure session audit...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const executeSessionInterception = async () => {
      try {
        // 1. Extract active user meta token payload from Supabase core auth layers
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!sessionData?.session?.user) {
          setRoutingFeedback("No active profile session located. Re-routing to login gateway...");
          router.push("/login");
          return;
        }

        const authenticatedUser = sessionData.session.user;

        // 2. Fetch authorized profile role record flags from structural database tables
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, is_active")
          .eq("id", authenticatedUser.id)
          .single();

        if (profileError || !profile) {
          throw new Error("Profile record missing or failed clearance verification routines.");
        }

        // 3. Evaluate active system authorization account seizures flags
        if (!profile.is_active) {
          setIsError(true);
          setRoutingFeedback("Access Denied: This operator account has been seized by the platform owner.");
          await supabase.auth.signOut();
          return;
        }

        // 4. Branch client-side routes straight into explicit nested workspace folders
        setRoutingFeedback(`Identity authenticated as ${profile.role}. Synchronizing workspace...`);
        
        // Corrected routing destination pathways pointing directly to the root reception landing dashboard
                // Corrected routing destination pathways splitting roles cleanly
        if (profile.role === "admin") {
          router.push("/dashboard/admin");
        } else if (profile.role === "owner" || profile.role === "receptionist") {
          router.push("/dashboard/reception");
        } else {
          router.push("/portal");
        }


      } catch (err: any) {
        console.error("Session switchboard intercept mapping error:", err);
        setIsError(true);
        setRoutingFeedback(err.message || "Failed to parse platform clearance records.");
      }
    };

    executeSessionInterception();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm w-full shadow-sm space-y-4">
        
        {isError ? (
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-red-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mx-auto text-white">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
        )}

        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
          {isError ? "Clearance Access Error" : "System Gatekeeper"}
        </h3>
        
        <p className="text-xs text-slate-500 font-normal leading-relaxed">
          {routingFeedback}
        </p>

        {isError && (
          <button
            onClick={() => router.push("/login")}
            className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            Return to Login Gate
          </button>
        )}

      </div>
    </div>
  );
}
