"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { 
  ShieldAlert, 
  Lock, 
  RefreshCw, 
  Bell, 
  BedDouble, 
  Utensils, 
  Wrench, 
  FileSpreadsheet 
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ReceptionistPermissions {
  manageOnlineBookings: boolean;
  manageOfflineBookings: boolean;
  handlePayLater: boolean;
  handleDiscounts: boolean;
  handleMealOrders: boolean;
  handleRoomService: boolean;
  generateFinancialReports: boolean;
  hasRoomReservationRights: boolean;
}

/**
 * Marakale Reception Security Guard Wrapper Layout
 * Location: app/dashboard/reception/layout.tsx
 * Enforces true real-time feature blockades dictated by the Admin Switchboard.
 */
export default function ReceptionSecurityEnforcerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<ReceptionistPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffName, setStaffName] = useState("");

  useEffect(() => {
    const fetchMyLiveSrsFlags = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) return;

        // Query the live user permissions profile matrix row
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name, permissions")
          .eq("id", sessionData.session.user.id)
          .single();

        if (profile) {
          setStaffName(profile.full_name);
          setPermissions({
            manageOnlineBookings: profile.permissions?.manageOnlineBookings ?? true,
            manageOfflineBookings: profile.permissions?.manageOfflineBookings ?? true,
            handlePayLater: profile.permissions?.handlePayLater ?? true,
            handleDiscounts: profile.permissions?.handleDiscounts ?? true,
            handleMealOrders: profile.permissions?.handleMealOrders ?? true,
            handleRoomService: profile.permissions?.handleRoomService ?? true,
            generateFinancialReports: profile.permissions?.generateFinancialReports ?? true,
            hasRoomReservationRights: profile.permissions?.hasRoomReservationRights ?? true,
          });
        }
      } catch (err) {
        console.error("Failed to map live reception gates rules:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyLiveSrsFlags();
  }, [pathname]); // Fires on directory changes to keep constraints fresh

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-900 mb-2" />
        <p className="text-xs font-bold uppercase text-slate-400 tracking-widest">Verifying Operator Clearance Scopes...</p>
      </div>
    );
  }

  // CRITICAL BLOCKADE CHECK: If the entire sub-feature is turned off, intercept page views instantly
  const isViewingNotificationsPage = pathname.includes("/reception/notifications");
  const isViewingBookingsPage = pathname.includes("/reception/bookings");

  if (isViewingNotificationsPage && permissions && !permissions.manageOnlineBookings) {
    return <AdminBlockadeScreen featureName="Manage Online Customer Bookings" staffName={staffName} />;
  }

  if (isViewingBookingsPage && permissions && !permissions.manageOfflineBookings) {
    return <AdminBlockadeScreen featureName="Manage Offline Counter Walk-Ins" staffName={staffName} />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-slate-50">
      
      {/* INTERNAL DYNAMIC SRS SHORTCUT SIDEBAR PANEL */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 space-y-4 flex-shrink-0">
        <div className="border-b border-slate-100 pb-2 px-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Operator Workspace</p>
          <p className="text-xs font-black text-slate-900 truncate mt-0.5">{staffName || "Front Desk Operator"}</p>
        </div>

        <nav className="space-y-1">
          {/* Link 1: Online Requests Stream */}
          {permissions?.manageOnlineBookings && (
            <Link 
              href="/dashboard/reception/notifications" 
              className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
                pathname.includes("/notifications") ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2"><Bell className="w-4 h-4" /> Online Requests</span>
            </Link>
          )}

          {/* Link 2: Walk-In Bookings Table */}
          {permissions?.manageOfflineBookings && (
            <Link 
              href="/dashboard/reception/bookings" 
              className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
                pathname.includes("/bookings") ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2"><BedDouble className="w-4 h-4" /> Walk-In Grid Matrix</span>
            </Link>
          )}
          
          {/* LOCKED SUB-BAR NOTIFICATION INDICATORS WHEN ARRAYS ARE SEIZED BY ADMIN */}
          {(!permissions?.manageOnlineBookings || !permissions?.manageOfflineBookings) && (
            <div className="pt-4 border-t border-slate-100">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block px-1 mb-1">Restricted Scopes</span>
              <div className="space-y-1 opacity-40 select-none">
                {!permissions?.manageOnlineBookings && <div className="flex items-center gap-2 p-2 text-xs font-medium text-slate-400"><Lock className="w-3.5 h-3.5" /> Online Requests</div>}
                {!permissions?.manageOfflineBookings && <div className="flex items-center gap-2 p-2 text-xs font-medium text-slate-400"><Lock className="w-3.5 h-3.5" /> Walk-In Matrix</div>}
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* RENDER ACTIVE CONSTRAINED VIEWS WORKSPACES */}
      <main className="flex-1 p-2 md:p-4">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            // Securely inject active permission matrix filters as props into nested subfolder pages!
            return React.cloneElement(child, { srsPermissions: permissions } as any);
          }
          return child;
        })}
      </main>

    </div>
  );
}

/**
 * Reusable full-screen blockade component to throw clean lock feedback screens
 */
function AdminBlockadeScreen({ featureName, staffName }: { featureName: string; staffName: string }) {
  return (
    <div className="min-h-[400px] bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4">
      <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-inner">
        <Lock className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Access Scope Revoked</h3>
        <p className="text-xs text-slate-500 font-normal max-w-sm mt-1.5 leading-relaxed">
          Hello <strong>{staffName}</strong>. Your permission to access <strong className="text-slate-900">"{featureName}"</strong> has been disabled by the system Administrator.
        </p>
      </div>
      <p className="text-[10px] text-slate-400 italic">Please coordinate directly with your supervisor to adjust your authorization matrix flags.</p>
    </div>
  );
}
