import { createClient } from "@supabase/supabase-js";

// Enforce standard environmental parameter safety layers
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Marakale System Alert: Missing Supabase Environment Variables. Check your root local config configuration settings."
  );
}

/**
 * Marakale Centralized Singleton Supabase Client Connection
 * Reused across global app contexts, custom hooks, and dynamic operational views.
 */
export const supabase = createClient(
  supabaseUrl || "https://supabase.co",
  supabaseAnonKey || "placeholder"
);
