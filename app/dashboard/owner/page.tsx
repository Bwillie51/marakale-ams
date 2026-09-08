"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  ShieldX, 
  UserCheck, 
  ShieldPlus, 
  RefreshCw, 
  History, 
  ArrowRight,
  FileText,
  BedDouble,
  Utensils,
  Wrench
} from "lucide-react";
import { useRouter } from "next/navigation";

interface OverviewMetrics {
  totalRevenue: number;
  lodgingRevenue: number;
  restaurantRevenue: number;
  activeStays: number;
}

interface MiniAuditRow {
  id: string;
  type: "Lodging" | "Meal" | "Service";
  title: string;
  timestamp: string;
  amountFeedback: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

/**
 * Marakale Streamlined Owner Executive Dashboard Suite
 * Location: app/dashboard/owner/page.tsx
 */
export default function StreamlinedOwnerDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<OverviewMetrics>({ totalRevenue: 0, lodgingRevenue: 0, restaurantRevenue: 0, activeStays: 0 });
  const [recentActions, setRecentActions] = useState<MiniAuditRow[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{ status: "success" | "error"; message: string } | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data: reservations } = await supabase.from("reservations").select("*").order("check_in", { ascending: false });
      const { data: meals } = await supabase.from("meal_orders").select("*").order("created_at", { ascending: false });
      const { data: services } = await supabase.from("service_requests").select("*").order("created_at", { ascending: false });
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });

      const lodgingTotal = reservations?.reduce((sum, r) => sum + Number(r.net_amount || 0), 0) || 0;
      const mealsTotal = meals?.filter(m => m.status === "Delivered").reduce((sum, m) => sum + Number(m.total_cost || 0), 0) || 0;
      const currentActive = reservations?.filter(r => r.status === "Active").length || 0;

      setMetrics({
        lodgingRevenue: lodgingTotal,
        restaurantRevenue: mealsTotal,
        totalRevenue: lodgingTotal + mealsTotal,
        activeStays: currentActive
      });

      if (profiles) setUsersList(profiles as UserProfile[]);

      const combinedTimeline: MiniAuditRow[] = [];
      
      reservations?.slice(0, 3).forEach(r => {
        combinedTimeline.push({
          id: r.id,
          type: "Lodging",
          title: `Booking: ${r.guest_name}`,
          timestamp: r.check_in,
          amountFeedback: `K${Number(r.net_amount).toFixed(2)}`
        });
      });

      meals?.slice(0, 2).forEach(m => {
        combinedTimeline.push({
          id: m.id,
          type: "Meal",
          title: `Order: ${m.order_details?.item || "Dining Tab"}`,
          timestamp: m.created_at,
          amountFeedback: `K${Number(m.total_cost).toFixed(2)}`
        });
      });

      services?.slice(0, 2).forEach(s => {
        combinedTimeline.push({
          id: s.id,
          type: "Service",
          title: `Maintenance: ${s.issue_description}`,
          timestamp: s.created_at,
          amountFeedback: s.status
        });
      });

      const sortedFive = combinedTimeline
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      setRecentActions(sortedFive);

    } catch (err) {
      console.error("Dashboard compilation loop exception:", err);
    } final: {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const AddUserSchema = Yup.object().shape({
    fullName: Yup.string().required("Full operator name parameters are mandatory."),
    email: Yup.string().email("Invalid email layout context.").required("Target registration email is required."),
    password: Yup.string().min(6, "Passwords must be at least 6 characters.").required("Temporary entry password is required."),
    role: Yup.string().required("Please allocate an access tier level."),
  });

  const handleInviteOperator = async (
    values: { fullName: string; email: string; password?: string; role: string },
    { resetForm, setSubmitting }: { resetForm: () => void; setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    setSubmissionFeedback(null);
    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          password: values.password || "marakale123",
          role: values.role
        })
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to execute server-side account generation workflows.");
      }

      setSubmissionFeedback({
        status: "success",
        message: `Successfully created account and mapped profile parameters for ${values.fullName}! Access clearance generated.`
      });
      
      resetForm();
      loadDashboardData();
    } catch (err: any) {
      console.error("Failed to append structural staff record:", err);
      setSubmissionFeedback({
        status: "error",
        message: err.message || "Database constraint error processing user registry keys."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAccountState = async (userId: string, currentStatus: boolean) => {
    try {
      await supabase.from("profiles").update({ is_active: !currentStatus }).eq("id", userId);
      setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 antialiased text-slate-800">
      
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Owner Control Suite</h1>
          <p className="text-xs text-slate-500 font-normal">Click any aggregate metric card to launch its standalone tracking folder directory.</p>
        </div>
        <button onClick={loadDashboardData} className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 shadow-sm"><RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => router.push("/dashboard/owner/lodging")} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-2 cursor-pointer hover:border-slate-900 hover:shadow-md transition-all group">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider group-hover:text-slate-900 transition-colors">Total Combined Revenue</span>
            <FileText className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
          </div>
          <p className="text-2xl font-black text-slate-900">K{metrics.totalRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-slate-900 pt-1">⚡ Click to Print Full PDF Report</p>
        </div>

        <Link href="/dashboard/owner/lodging" className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-2 hover:border-slate-900 hover:shadow-md transition-all group block">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-slate-900">Lodging Receipts</span>
            <BedDouble className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
          </div>
          <p className="text-xl font-black text-slate-700">K{metrics.lodgingRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-slate-900 pt-1">📂 View Lodging Folder →</p>
        </Link>

        <Link href="/dashboard/owner/meals" className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-2 hover:border-slate-900 hover:shadow-md transition-all group block">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-slate-900">Restaurant Food Orders</span>
            <Utensils className="w-4 h-4 text-emerald-600 group-hover:text-slate-900" />
          </div>
          <p className="text-xl font-black text-emerald-700">K{metrics.restaurantRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider group-hover:text-slate-900 pt-1">📂 View Meals Folder →</p>
        </Link>

                <Link 
          href="/dashboard/owner/services" 
          className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-2 hover:border-slate-900 hover:shadow-md transition-all group block"
        >
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-slate-900">Live Active Stays</span>
            <Wrench className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
          </div>
          <p className="text-xl font-black text-slate-900">{metrics.activeStays} Units</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-slate-900 pt-1">📂 View Service Folder →</p>
        </Link>
      </div>

      {/* CLIPPED HISTORICAL TIMELINE STREAM: EXACTLY UNIQUE 5 RECENT ACTIONS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-700" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Recent Operational Actions (Latest 5)</h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                <th className="p-3">Log Category Type</th>
                <th className="p-3">Action Description Context</th>
                <th className="p-3">Timestamped Clock</th>
                <th className="p-3 text-right">Accounting Value State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 text-xs font-medium">
              {recentActions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-slate-400 italic">No historical actions logged in the registry system.</td>
                </tr>
              ) : (
                recentActions.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/40">
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                        row.type === "Lodging" ? "bg-blue-50 border-blue-100 text-blue-700" : 
                        row.type === "Meal" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : 
                        "bg-amber-50 border-amber-100 text-amber-700"
                      }`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{row.title}</td>
                    <td className="p-3 text-slate-400">{new Date(row.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-right font-black text-slate-900">{row.amountFeedback}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* VIEW MORE DRAWER NAVIGATION SUB-TAB LINK BUTTONS */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-3 justify-center text-xs">
          <button 
            type="button"
            onClick={() => router.push("/dashboard/owner/lodging")} 
            className="inline-flex items-center gap-1 font-black text-slate-900 uppercase hover:text-slate-600 transition-colors"
          >
            View More Lodging Logs <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <span className="text-slate-200">|</span>
          <button 
            type="button"
            onClick={() => router.push("/dashboard/owner/meals")} 
            className="inline-flex items-center gap-1 font-black text-slate-900 uppercase hover:text-slate-600 transition-colors"
          >
            View More Food Bills <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <span className="text-slate-200">|</span>
          <button 
            type="button"
            onClick={() => router.push("/dashboard/owner/services")} 
            className="inline-flex items-center gap-1 font-black text-slate-900 uppercase hover:text-slate-600 transition-colors"
          >
            View More Maintenance Streams <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. BASEMENT MEMBERSHIP GOVERNANCE LAYER PANEL CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Hand: Interactive Staff Operator Creation Box (Formik Controlled) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2 flex items-center gap-1.5 text-slate-900 font-bold">
            <ShieldPlus className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs uppercase tracking-wider">Authorize New System User</h2>
          </div>
          {submissionFeedback && (
            <div className={`p-3 rounded-lg text-xs font-medium leading-normal border ${
              submissionFeedback.status === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"
            }`}>
              {submissionFeedback.status === "success" ? "✅" : "❌"} {submissionFeedback.message}
            </div>
          )}
          <Formik initialValues={{ fullName: "", email: "", password: "", role: "" }} validationSchema={AddUserSchema} onSubmit={handleInviteOperator}>
            {({ errors, touched, isSubmitting }) => (
              <Form className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Full Operator Name</label>
                  <Field name="fullName" type="text" className="w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" placeholder="John Walker" />
                  <ErrorMessage name="fullName" component="div" className="text-[10px] text-red-600 mt-1 font-semibold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Email Coordinates</label>
                  <Field name="email" type="email" className="w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" placeholder="walker@marakale.com" />
                  <ErrorMessage name="email" component="div" className="text-[10px] text-red-600 mt-1 font-semibold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Temporary Entry Password</label>
                  <Field name="password" type="password" className="w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" placeholder="••••••••" />
                  <ErrorMessage name="password" component="div" className="text-[10px] text-red-600 mt-1 font-semibold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Access Clearance Classification</label>
                  <Field as="select" name="role" className="w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900">
                    <option value="">-- Choose Access Tier --</option>
                    <option value="admin">Platform Administrator</option>
                    <option value="receptionist">Front-Desk Receptionist</option>
                  </Field>
                  <ErrorMessage name="role" component="div" className="text-[10px] text-red-600 mt-1 font-semibold" />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Generate Access Link</span>
                </button>
              </Form>
            )}
          </Formik>
        </div>

                {/* Right Hand: Active User Directory & Emergency Seizure Panel (Takes 2/3 Width) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider">Global User Clearance Records</h2>
            <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">{usersList.length} Accounts Registered</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="p-3">User Profile Name</th>
                  <th className="p-3">Access Tier</th>
                  <th className="p-3">System State</th>
                  <th className="p-3 text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center p-6 text-slate-400 italic">No operators or staff registered in the directory.</td>
                  </tr>
                ) : (
                  usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-medium text-slate-900">
                        <div>{user.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-normal break-all">{user.email}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${
                          user.role === "owner" ? "bg-red-50 border-red-200 text-red-700" : user.role === "admin" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-slate-100 border-slate-200 text-slate-700"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 font-semibold ${user.is_active ? "text-emerald-600" : "text-red-500"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-600 animate-ping" : "bg-red-500"}`} />
                          {user.is_active ? "Active" : "Seized"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {user.role !== "owner" ? (
                          <button 
                            type="button" 
                            onClick={() => handleToggleAccountState(user.id, user.is_active)} 
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold uppercase text-[10px] transition-all border shadow-sm ${
                              user.is_active ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            {user.is_active ? "Seize Account" : "Restore Clearance"}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Protected Core</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
