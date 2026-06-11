import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Health check: verifies env vars are loaded and the Supabase client
// can reach the project (auth endpoint works even with no tables).
export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getUser();

    // "Auth session missing" is expected when no one is logged in —
    // it still proves the client reached Supabase successfully.
    const reachable = !error || error.name === "AuthSessionMissingError";

    return NextResponse.json({
      status: reachable ? "ok" : "error",
      supabase: reachable ? "connected" : error?.message,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        supabase: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 }
    );
  }
}
