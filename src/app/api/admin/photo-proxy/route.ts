// Admin-only image proxy: lets the place editor add photos by URL without
// hitting browser CORS limits. The client then compresses and uploads the
// bytes to Supabase Storage like any picked file.
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin/queries";

const MAX_BYTES = 12 * 1024 * 1024;

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) {
    return true;
  }
  // Private / loopback / link-local IPv4 literals and IPv6 shorthand.
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) {
    return true;
  }
  return false;
}

export async function GET(request: NextRequest) {
  // Admin gate — same allowlist the panel uses (non-redirecting helper).
  const supabase = await createClient();
  if (!(await isAdminRequest(supabase))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const raw = request.nextUrl.searchParams.get("url")?.trim();
  if (!raw) {
    return NextResponse.json({ error: "Missing url." }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return NextResponse.json({ error: "Only http(s) URLs are allowed." }, { status: 400 });
  }
  if (isBlockedHost(url.hostname)) {
    return NextResponse.json({ error: "That host is not allowed." }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      // Do NOT auto-follow redirects: a public host that 302-redirects to a
      // private/loopback/metadata IP would bypass the host block. Reject 3xx.
      redirect: "manual",
      headers: { "User-Agent": "GobbleMaps/1.0 (photo import)" },
    });
    if (res.status >= 300 && res.status < 400) {
      return NextResponse.json(
        { error: "That URL redirects — point to the direct image." },
        { status: 422 }
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: `Fetch failed (${res.status}).` },
        { status: 422 }
      );
    }
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) {
      return NextResponse.json(
        { error: "That URL is not an image." },
        { status: 422 }
      );
    }
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES) {
      return NextResponse.json({ error: "Image is too large (12 MB max)." }, { status: 422 });
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "Image is too large (12 MB max)." }, { status: 422 });
    }
    return new NextResponse(buf, {
      headers: { "Content-Type": type, "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't fetch that image — check the URL." },
      { status: 422 }
    );
  }
}
