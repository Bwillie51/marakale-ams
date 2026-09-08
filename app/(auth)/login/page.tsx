"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Mail, Lock, ArrowRight, RefreshCw, User, ShieldAlert, Sparkles, Building2 } from "lucide-react";

// Local image metadata asset configurations imported natively from your folder structure
import logoAsset from "../../(public)/logo.png";
import backgroundAsset from "../../(public)/Marakale.png";

/**
 * Marakale Dynamic Segmented Authentication Gate
 * Location: app/(auth)/login/page.tsx
 * Features an ultra-premium, deeply compelling dark glassmorphic design utilizing local brand media.
 */
export default function SystemLoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"guest" | "staff">("guest");
  const [serverError, setServerError] = useState<string | null>(null);

  // 1. Validation Schemes via Yup
  const GuestSchema = Yup.object().shape({
    email: Yup.string()
      .email("Please provide a valid email address.")
      .required("Guest email field is mandatory."),
  });

  const StaffSchema = Yup.object().shape({
    email: Yup.string()
      .email("Please provide a valid corporate email address.")
      .required("Staff email field is mandatory."),
    password: Yup.string()
      .min(6, "Passwords must be at least 6 characters.")
      .required("Password credential field is mandatory."),
  });

  // 2. Guest Passwordless OTP Submission Handler
  const handleGuestOtpRequest = async (
    values: { email: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    setServerError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: `${window.location.origin}/portal`,
        },
      });

      if (error) throw error;
      router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`);
    } catch (err: any) {
      setServerError(err.message || "Failed to issue guest token. Verify server configurations.");
      setSubmitting(false);
    }
  };

  // 3. Staff / Owner Secured Password Sign-In Handler
  const handleStaffPasswordSignIn = async (
    values: { email: string; password?: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    setServerError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password || "",
      });

      if (error) throw error;

      // Extract account role from profiles table to navigate cleanly
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", data.user?.id)
        .single();

      if (profile && !profile.is_active) {
        throw new Error("This operator account has been seized by the system owner.");
      }

      // Route users dynamically based on role metrics
      if (profile?.role === "owner") {
        router.push("/dashboard/owner");
      } else if (profile?.role === "admin") {
        router.push("/dashboard/admin/permissions");
      } else {
        router.push("/dashboard/reception");
      }
    } catch (err: any) {
      setServerError(err.message || "Authentication rejected. Double-check email and password.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden px-4 font-sans select-none">
      
      {/* BACKGROUND IMAGE EXTRACTION BACKDROP LAYER */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none opacity-10 blur-[2px] scale-105">
        <Image
          src={backgroundAsset}
          alt="Marakale Corporate Ambient Background"
          placeholder="blur"
          fill
          priority
          className="object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-950 z-10" />

      {/* AMBIENT LIGHT BLOBS FOR COMPELLING VISUAL DEPTH */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-500/10 rounded-full blur-[120px] pointer-events-none z-10" />

      <div className="relative z-20 w-full max-w-md space-y-6">
        
        {/* COMPACT LOGO HEADER CONTAINER */}
        <div className="text-center space-y-3">
          {/* Replaced Key Sign with your exact local logo.png asset natively optimized */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto shadow-2xl border-2 border-slate-700/50 relative bg-slate-900 group p-1 flex items-center justify-center">
            <Image 
              src={logoAsset} 
              alt="Marakale Logo Frame" 
              placeholder="blur"
              className="object-cover rounded-xl w-full h-full transform group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
              Marakale Serviced Apartments
            </h2>
            <p className="text-xs text-slate-400 font-medium tracking-wide mt-1 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Login Portal
            </p>
          </div>
        </div>

        {/* HIGH-STYLING GLASSMORPHIC CARD BODY PANEL */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* DYNAMIC SEGMENTED TABS CONTROLLER CONTAINER */}
          <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/60 mb-6">
            <button
              onClick={() => { setActiveTab("guest"); setServerError(null); }}
              className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 duration-200 ${
                activeTab === "guest" 
                  ? "bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md border border-slate-600/30" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <User className="w-3.5 h-3.5" /> Guest
            </button>
            <button
              onClick={() => { setActiveTab("staff"); setServerError(null); }}
              className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 duration-200 ${
                activeTab === "staff" 
                  ? "bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md border border-slate-600/30" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Staff
            </button>
          </div>

          {serverError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400 leading-relaxed animate-shake">
              ⚠️ {serverError}
            </div>
          )}

          {/* GUEST FLOW: PASSWORDLESS SECURE FORM */}
          {activeTab === "guest" && (
            <Formik initialValues={{ email: "" }} validationSchema={GuestSchema} onSubmit={handleGuestOtpRequest}>
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                      Email Address
                    </label>
                    <div className="relative rounded-xl shadow-inner">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-500" />
                      </div>
                      <Field name="email" type="email" id="email" className={`block w-full pl-11 pr-4 py-3 text-xs bg-slate-950/60 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all duration-200 ${errors.email && touched.email ? "border-red-500/50 focus:ring-red-500" : "border-slate-800 focus:border-slate-600 focus:ring-slate-600"}`} placeholder="your.name@example.com" />
                    </div>
                    <ErrorMessage name="email" component="div" className="mt-1.5 text-[11px] text-red-400 font-medium" />
                  </div>
                  
                  <div className="rounded-xl bg-slate-950/40 border border-slate-800/80 p-3.5 text-[11px] text-slate-400 leading-relaxed font-normal">
                    💡 Single-use secure token passkeys drop straight into your email inbox and stay valid for <strong className="text-slate-200 font-bold">5 minutes</strong>.
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-white hover:bg-slate-100 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg font-bold disabled:opacity-50">
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <>Request Secure Access <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </Form>
              )}
            </Formik>
          )}

                    {/* STAFF & OWNER FLOW: SECURED SECURE PASSWORD CONTROLS CONTAINER */}
          {activeTab === "staff" && (
            <Formik 
              initialValues={{ email: "", password: "" }} 
              validationSchema={StaffSchema} 
              onSubmit={handleStaffPasswordSignIn}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                      Email Address
                    </label>
                    <div className="relative rounded-xl shadow-inner">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-500" />
                      </div>
                      <Field name="email" type="email" id="email" className={`block w-full pl-11 pr-4 py-3 text-xs bg-slate-950/60 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all duration-200 ${errors.email && touched.email ? "border-red-500/50 focus:ring-red-500" : "border-slate-800 focus:border-slate-600"}`} placeholder="operator@marakale.com" />
                    </div>
                    <ErrorMessage name="email" component="div" className="mt-1.5 text-[11px] text-red-400 font-medium" />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                      Password
                    </label>
                    <div className="relative rounded-xl shadow-inner">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-500" />
                      </div>
                      <Field name="password" type="password" id="password" className={`block w-full pl-11 pr-4 py-3 text-xs bg-slate-950/60 border rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all duration-200 ${errors.password && touched.password ? "border-red-500/50 focus:ring-red-500" : "border-slate-800 focus:border-slate-600"}`} placeholder="••••••••" />
                    </div>
                    <ErrorMessage name="password" component="div" className="mt-1.5 text-[11px] text-red-400 font-medium" />
                  </div>

                  <div className="pt-2">
                    <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-white hover:bg-slate-100 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg disabled:opacity-50">
                      {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <>Login <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          )}

        </div>

        {/* DISK ACCESS SYSTEM HOME RETURN SHORTCUT LINK */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">
            <Building2 className="w-3.5 h-3.5" /> Return to main site
          </Link>
        </div>

      </div>
    </div>
  );
}

