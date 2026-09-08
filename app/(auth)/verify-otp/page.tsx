"use client";

import * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { ShieldCheck, ArrowRight, RefreshCw, HelpCircle } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Inner component that uses search parameters.
 * Wrapped in Suspense to satisfy Next.js static rendering boundary requirements.
 */
function VerifyOtpFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [targetEmail, setTargetEmail] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  // Safely ingest user context from URL parameters on initialization
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setTargetEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  // 1. Precise 5-digit regex schema checking structure via Yup
  const OtpSchema = Yup.object().shape({
    token: Yup.string()
      .matches(/^[0-9]{5}$/, "Verification codes must contain exactly 5 numeric digits.")
      .required("Please input the 5-digit verification security pin."),
  });

  // 2. Submit transaction handler validating token lifecycle integrity
  const handleVerifyOtp = async (
    values: { token: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    setServerError(null);
    try {
      // Validate OTP token submission back against Supabase authentication engine 
      const { data, error } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: values.token,
        type: "magiclink", // Standard passwordless configuration setting
      });

      if (error) throw error;

      // Upon matching verification validation, direct session to workspace tracking
      if (data.session) {
        router.push("/dashboard/reception/notifications");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setServerError(err.message || "Invalid or expired authorization code. Check status.");
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
      
      {serverError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-xs font-medium text-red-700 leading-normal">
          ❌ {serverError}
        </div>
      )}

      <div className="mb-5 text-xs text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-lg leading-normal">
        📨 Security token generated and dispatched to: <strong className="text-slate-900 break-all">{targetEmail || "your email address"}</strong>
      </div>

      {/* Formik OTP Input Engine Layout */}
      <Formik
        initialValues={{ token: "" }}
        validationSchema={OtpSchema}
        onSubmit={handleVerifyOtp}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form className="space-y-5">
            <div>
              <label htmlFor="token" className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-2">
                5-Digit Security PIN
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                </div>
                <Field
                  type="text"
                  name="token"
                  id="token"
                  maxLength={5}
                  className={`block w-full pl-10 pr-3 py-2.5 text-center text-lg font-black tracking-[0.5em] bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                    errors.token && touched.token
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500 text-red-900"
                      : "border-slate-200 focus:border-slate-900 focus:ring-slate-900 text-slate-900"
                  }`}
                  placeholder="00000"
                />
              </div>
              <ErrorMessage
                name="token"
                component="div"
                className="mt-1.5 text-xs text-red-600 font-normal text-center"
              />
            </div>

            <div className="rounded-lg bg-amber-50/50 border border-amber-100 p-3 text-[11px] text-amber-800 leading-normal flex items-start gap-2">
              <HelpCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>If you do not see the authorization message within 60 seconds, make sure to audit your spam folders before re-requesting a code block.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !targetEmail}
              className="w-full flex justify-center items-center gap-1.5 py-2.5 px-4 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Validating Code...
                </>
              ) : (
                <>
                  Verify and Authenticate
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}

/**
 * Marakale Security Code Verification Gate
 * Houses Formik submission engines within clean code layout architectures.
 */
export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-black text-slate-900 uppercase tracking-tight">
          Verify Security Key
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 mb-6">
          Input your 5-digit verification identifier below to confirm identity metrics.
        </p>
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={
          <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10 flex justify-center items-center h-48">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        }>
          <VerifyOtpFormContent />
        </Suspense>
      </div>
    </div>
  );
}
