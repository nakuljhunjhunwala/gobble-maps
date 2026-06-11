import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client. Bypasses RLS — server-only.
// NEVER import this module from a client component, never log the key.
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() is server-only and must never run in the browser."
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }
  if (!secretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY environment variable.");
  }

  return createSupabaseClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
