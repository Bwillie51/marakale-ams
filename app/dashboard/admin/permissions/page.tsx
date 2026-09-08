"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Formik, Form } from "formik";
import { 
  ShieldCheck, 
  Users, 
  ToggleLeft, 
  ToggleRight, 
  Sliders, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  BedDouble, 
  Utensils, 
  Wrench, 
  FileSpreadsheet, 
  PlusSquare, 
  DollarSign,
  Percent,
  Globe
} from "lucide-react";

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

interface ReceptionistProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  permissions: ReceptionistPermissions;
}

/**
 * Marakale Admin Task Governance Terminal
 * Location: app/dashboard/admin/permissions/page.tsx
 * Fully verified layout matching Page 5 of the SRS with top-level hooks.
 */
export default function AdminPermissionsGovernancePage() {
  const [receptionists, setReceptionists] = useState<ReceptionistProfile[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<ReceptionistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Formik state reset trigger key bound natively at top level to clear memory overlap bugs
  const [formResetTriggerKey, setFormResetTriggerKey] = useState(0);

  const loadReceptionistRoster = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "receptionist")
        .order("full_name", { ascending: true });

      if (error) throw error;
      
      const formattedProfiles = (data || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        role: p.role,
        is_active: p.is_active,
        permissions: {
          manageOnlineBookings: p.permissions?.manageOnlineBookings ?? true,
          manageOfflineBookings: p.permissions?.manageOfflineBookings ?? true,
          handlePayLater: p.permissions?.handlePayLater ?? true,
          handleDiscounts: p.permissions?.handleDiscounts ?? true,
          handleMealOrders: p.permissions?.handleMealOrders ?? true,
          handleRoomService: p.permissions?.handleRoomService ?? true,
          generateFinancialReports: p.permissions?.generateFinancialReports ?? true,
          hasRoomReservationRights: p.permissions?.hasRoomReservationRights ?? true,
        }
      }));

      setReceptionists(formattedProfiles);
      
      if (formattedProfiles.length > 0 && !selectedStaff) {
        setSelectedStaff(formattedProfiles[0]);
      }
    } catch (err: any) {
      console.error("Staff database load error:", err);
      setErrorMessage(err.message || "Failed to synchronize operational security rosters.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReceptionistRoster();
  }, []);

  // CORRECTED: Top-level hook execution to alter form render key on user swap safely
  useEffect(() => {
    if (selectedStaff) {
      setFormResetTriggerKey((prev) => prev + 1);
    }
  }, [selectedStaff?.id]);

  const handleSaveSrsPermissions = async (values: ReceptionistPermissions, { setSubmitting }: any) => {
    if (!selectedStaff) return;
    setSuccessBanner(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ permissions: values })
        .eq("id", selectedStaff.id);

      if (error) throw error;

      const updatedProfile: ReceptionistProfile = {
        ...selectedStaff,
        permissions: values
      };

      setReceptionists((prev) => prev.map((p) => p.id === selectedStaff.id ? updatedProfile : p));
      setSelectedStaff(updatedProfile);
      setSuccessBanner(`SRS Governance flags locked successfully for ${selectedStaff.full_name}!`);
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err: any) {
      console.error("Error updating feature flags:", err);
      setErrorMessage(err.message || "Database network timeout saving settings.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl w-full mx-auto space-y-6 antialiased text-slate-800">
      
      {/* Title Header Section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-slate-900" /> Feature Governance Switchboard
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            SRS Administrator Portal: Enable or disable granular terminal features, workflow permissions, and operational scopes for front-desk users.
          </p>
        </div>

        <button
          onClick={loadReceptionistRoster}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Sync Roster
        </button>
      </div>

      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-medium flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Dual-Pane Layout Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* LEFT ASPECT VIEW: ROSTER STREAM LIST */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 tracking-wider pl-1">
            <Users className="w-4 h-4 text-slate-400" />
            <span>Reception Dashboard Users ({receptionists.length})</span>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
            {receptionists.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-2xl bg-white text-center text-slate-400">
                <AlertCircle className="w-5 h-5 mx-auto text-slate-300 mb-1" />
                <p className="text-xs font-bold text-slate-700 uppercase">No Staff Located</p>
                <p className="text-[10px] font-normal mt-0.5 text-slate-400">Create receptionist profiles within the owner dashboard.</p>
              </div>
            ) : (
              receptionists.map((staff) => {
                const isSelected = selectedStaff?.id === staff.id;
                return (
                  <div
                    key={staff.id}
                    onClick={() => { setSelectedStaff(staff); setSuccessBanner(null); }}
                    className={`p-4 border rounded-xl shadow-sm text-left transition-all duration-150 cursor-pointer ${
                      isSelected 
                        ? "bg-slate-900 border-slate-900 text-white shadow-md transform translate-x-1" 
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className={`text-xs font-black uppercase tracking-wide ${isSelected ? "text-white" : "text-slate-900"}`}>{staff.full_name}</h4>
                        <p className={`text-[11px] font-normal break-all mt-0.5 ${isSelected ? "text-slate-400" : "text-slate-400"}`}>{staff.email}</p>
                      </div>
                      <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded tracking-widest border ${
                        isSelected ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}>
                        {staff.role}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

                {/* RIGHT ASPECT VIEW: GRANULAR SYSTEM TOGGLES CONTROL SWITCHBOARD */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 tracking-wider pl-1 mb-3">
            <Sliders className="w-4 h-4 text-slate-400" />
            <span>SRS Feature Control Board</span>
          </div>

          {selectedStaff ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-slate-900 text-white tracking-widest">
                  Active Security Target
                </span>
                <h3 className="text-base font-black text-slate-900 mt-2">{selectedStaff.full_name}</h3>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">Toggle live features access flags across the receptionist's device profile session.</p>
              </div>

              {/* Binding the Formik form token to an explicit dynamic state key string completely resolves hook loops bugs */}
              <Formik
                key={formResetTriggerKey}
                enableReinitialize
                initialValues={selectedStaff.permissions}
                onSubmit={handleSaveSrsPermissions}
              >
                {({ values, isSubmitting, setFieldValue }) => (
                  <Form className="space-y-4">
                    
                    {/* FLAG 1: ONLINE BOOKINGS HOLD HANDLING */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                      <div className="space-y-0.5 max-w-sm pr-4">
                        <h4 className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-400" /> Manage Online Customer Bookings
                        </h4>
                        <p className="text-[11px] text-slate-500 font-normal leading-normal">
                          Allows this reception user to open incoming web reservation feeds, view notification alert badges, and confirm pending counter arrivals.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFieldValue("manageOnlineBookings", !values.manageOnlineBookings)}
                        className="text-slate-700 hover:opacity-90 transition-opacity focus:outline-none flex-shrink-0"
                      >
                        {values.manageOnlineBookings ? <ToggleRight className="w-10 h-10 text-slate-900" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
                      </button>
                    </div>

                    {/* FLAG 2: OFFLINE COUNTER WALK-INS CREATION */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                      <div className="space-y-0.5 max-w-sm pr-4">
                        <h4 className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                          <PlusSquare className="w-3.5 h-3.5 text-slate-400" /> Manage Offline Counter Walk-Ins
                        </h4>
                        <p className="text-[11px] text-slate-500 font-normal leading-normal">
                          Authorizes this user to launch the manual registration form modal to collect paper coordinates and register walk-in guests directly.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFieldValue("manageOfflineBookings", !values.manageOfflineBookings)}
                        className="text-slate-700 hover:opacity-90 transition-opacity focus:outline-none flex-shrink-0"
                      >
                        {values.manageOfflineBookings ? <ToggleRight className="w-10 h-10 text-slate-900" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
                      </button>
                    </div>

                    {/* FLAG 3: PAY LATER DEFERRALS WORKFLOWS */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                      <div className="space-y-0.5 max-w-sm pr-4">
                        <h4 className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Process "Pay Later" Customers
                        </h4>
                        <p className="text-[11px] text-slate-500 font-normal leading-normal">
                          Enables the reception profile to bypass instant credit collection fields during check-in, deferring final bills to dynamic checkout departure hours.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFieldValue("handlePayLater", !values.handlePayLater)}
                        className="text-slate-700 hover:opacity-90 transition-opacity focus:outline-none flex-shrink-0"
                      >
                        {values.handlePayLater ? <ToggleRight className="w-10 h-10 text-slate-900" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
                      </button>
                    </div>

                    {/* FLAG 4: MANUAL OR AUTOMATIC ENTRY OVERRIDES DISCOUNTING */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                      <div className="space-y-0.5 max-w-sm pr-4">
                        <h4 className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                          <Percent className="w-3.5 h-3.5 text-slate-400" /> Apply Counter Discounts
                        </h4>
                        <p className="text-[11px] text-slate-500 font-normal leading-normal">
                          Permits inputting customized discount modifiers at checkout. Automated length-of-stay discount rules will apply based on owner configurations.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFieldValue("handleDiscounts", !values.handleDiscounts)}
                        className="text-slate-700 hover:opacity-90 transition-opacity focus:outline-none flex-shrink-0"
                      >
                        {values.handleDiscounts ? <ToggleRight className="w-10 h-10 text-slate-900" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
                      </button>
                    </div>

                    {/* FLAG 5: IN-ROOM FOOD ORDERING STREAM FULLFILLMENT */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                      <div className="space-y-0.5 max-w-sm pr-4">
                        <h4 className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-slate-400" /> Fulfill Restaurant Meal Orders
                        </h4>
                        <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                          Enables intercepting and clearing incoming guest gastronomy orders, tracking tabs, and resolving culinary balances.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFieldValue("handleMealOrders", !values.handleMealOrders)}
                        className="text-slate-700 hover:opacity-90 transition-opacity focus:outline-none flex-shrink-0"
                      >
                        {values.handleMealOrders ? <ToggleRight className="w-10 h-10 text-slate-900" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
                      </button>
                    </div>

                    {/* FLAG 6: HOUSEKEEPING AND ROOM SERVICE TASK CLEARANCE */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                      <div className="space-y-0.5 max-w-sm pr-4">
                        <h4 className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-slate-400" /> Fulfill In-Room Service Requests
                        </h4>
                        <p className="text-[11px] text-slate-500 font-normal leading-normal">
                          Allows coordinated resolution tracking for client maintenance tickets, housekeeping requests, and engineering logs.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFieldValue("handleRoomService", !values.handleRoomService)}
                        className="text-slate-700 hover:opacity-90 transition-opacity focus:outline-none flex-shrink-0"
                      >
                        {values.handleRoomService ? <ToggleRight className="w-10 h-10 text-slate-900" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
                      </button>
                    </div>

                    {/* FLAG 7: REPORTING GENERATION EXPORT TRIGGERS */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                      <div className="space-y-0.5 max-w-sm pr-4">
                        <h4 className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" /> Generate Financial Reports
                        </h4>
                        <p className="text-[11px] text-slate-500 font-normal leading-normal">
                          Grants authorization access to compile total transaction metrics and print itemized hard copies inside counter views.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFieldValue("generateFinancialReports", !values.generateFinancialReports)}
                        className="text-slate-700 hover:opacity-90 transition-opacity focus:outline-none flex-shrink-0"
                      >
                        {values.generateFinancialReports ? <ToggleRight className="w-10 h-10 text-slate-900" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
                      </button>
                    </div>

                    {/* FLAG 8: GENERAL ROOM RE-ALLOCATION MANUAL TRIGGERS */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                      <div className="space-y-0.5 max-w-sm pr-4">
                        <h4 className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
                          <BedDouble className="w-3.5 h-3.5 text-slate-400" /> Room Overrides & Reservation Rights
                        </h4>
                        <p className="text-[11px] text-slate-500 font-normal leading-normal">
                          Authorizes modifying underlying grid asset allocation cards and toggling statuses to Under Maintenance manually.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFieldValue("hasRoomReservationRights", !values.hasRoomReservationRights)}
                        className="text-slate-700 hover:opacity-90 transition-opacity focus:outline-none flex-shrink-0"
                      >
                        {values.hasRoomReservationRights ? <ToggleRight className="w-10 h-10 text-slate-900" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
                      </button>
                    </div>

                    {/* Action Button Footer Bar */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end bg-white">
                      <button
                        type="submit"
                        disabled={isSubmitting || !selectedStaff.is_active}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all duration-150"
                      >
                        {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        Lock Operator Access Configs
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>

          </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl p-8 bg-white shadow-sm min-h-[420px] flex flex-col items-center justify-center text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mb-3 text-slate-300">🔍</div>
              <p className="text-xs font-black text-slate-700 uppercase tracking-wide">Select an Operator Context</p>
              <p className="text-[11px] text-slate-400 max-w-xs text-center mt-1 leading-normal font-normal">
                Click on an active front-desk profile from the left list to review their configuration settings matrix.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
