// Admin-only location resolver for the place editor.
//  ?url=<google maps link>   → expand short links (maps.app.goo.gl, goo.gl/maps)
//                              by following redirects, extract lat/lng, or
//                              geocode the place name found in the URL.
//  ?reverse=1&lat=&lng=      → reverse-geocode to a readable address + area.
// SSRF-safe: only Google hosts are fetched; redirects are followed manually
// and every hop is re-checked.
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/admin/queries";
import { extractCoords, extractPlaceName } from "@/lib/maps-coords";
import { findPlusCode, isFullCode, decode, recoverNearest } from "@/lib/plus-codes";

const MUMBAI_VIEWBOX = "72.75,19.35,73.20,18.85"; // left,top,right,bottom
const UA = "GobbleMaps/1.0 (admin contact: dev@unicoconnect.com)";

/** Hosts we are willing to fetch for link expansion. */
function isGoogleHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "goo.gl" ||
    h === "g.co" ||
    h === "maps.app.goo.gl" ||
    h === "google.com" ||
    h.endsWith(".google.com")
  );
}

async function forwardGeocode(
  q: string
): Promise<{ lat: number; lng: number; name?: string } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("viewbox", MUMBAI_VIEWBOX);
  url.searchParams.set("bounded", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "3");
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    cache: "force-cache",
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as {
    lat?: string;
    lon?: string;
    display_name?: string;
  }[];
  const top = rows[0];
  if (!top?.lat || !top?.lon) return null;
  return {
    lat: Number(top.lat),
    lng: Number(top.lon),
    name: top.display_name?.split(",")[0]?.trim(),
  };
}

async function resolveUrl(raw: string): Promise<NextResponse> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return NextResponse.json({ error: "Only http(s) links." }, { status: 400 });
  }
  if (!isGoogleHost(url.hostname)) {
    return NextResponse.json(
      { error: "Paste a Google Maps link, or type an address." },
      { status: 400 }
    );
  }

  // The full URL itself may already carry coordinates.
  const direct = extractCoords(raw);
  if (direct) return NextResponse.json(direct);

  // Follow redirects manually (short links → expanded URL with @lat,lng).
  let current = url;
  for (let hop = 0; hop < 6; hop++) {
    if (!isGoogleHost(current.hostname)) break;
    let res: Response;
    try {
      res = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(12000),
        headers: { "User-Agent": UA },
      });
    } catch {
      return NextResponse.json({ error: "Couldn't open that link." }, { status: 502 });
    }

    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      const next = new URL(location, current);
      const fromHop = extractCoords(next.toString());
      if (fromHop) return NextResponse.json(fromHop);
      current = next;
      continue;
    }

    // Final response — try the resolved URL, then the HTML body, then name.
    const fromFinal = extractCoords(current.toString());
    if (fromFinal) return NextResponse.json(fromFinal);

    if (res.ok && (res.headers.get("content-type") ?? "").includes("text/html")) {
      const body = await res.text();
      const fromBody = extractCoords(body);
      if (fromBody) return NextResponse.json(fromBody);
    }
    break;
  }

  const resolved = current.toString();
  const name = extractPlaceName(resolved) ?? extractPlaceName(raw);

  // Plus code (Google "plus codes") — precise and free, common in app shares.
  const plus = findPlusCode(resolved) ?? findPlusCode(raw);
  if (plus) {
    if (isFullCode(plus)) {
      const pt = decode(plus);
      if (pt) return NextResponse.json({ ...pt, name: name ?? undefined });
    } else if (name) {
      // Short code: recover against the locality's coordinates.
      const ref = await forwardGeocode(name);
      if (ref) {
        const pt = recoverNearest(plus, ref.lat, ref.lng);
        if (pt) return NextResponse.json({ ...pt, name });
      }
    }
  }

  // Last resort — geocode the place name itself.
  if (name) {
    const geo = await forwardGeocode(name);
    if (geo) return NextResponse.json(geo);
  }
  return NextResponse.json(
    { error: "Couldn't read a location from that link." },
    { status: 422 }
  );
}

async function reverse(latStr: string, lngStr: string): Promise<NextResponse> {
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Bad coordinates." }, { status: 400 });
  }
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("zoom", "16");
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      cache: "force-cache",
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ error: "Reverse failed." }, { status: 502 });
    const data = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    const a = data.address ?? {};
    const area =
      a.suburb || a.neighbourhood || a.quarter || a.city_district || a.town || null;
    return NextResponse.json({
      address: data.display_name?.split(",").slice(0, 3).join(",").trim() ?? null,
      area,
    });
  } catch {
    return NextResponse.json({ error: "Reverse failed." }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isAdminRequest(supabase))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  if (params.get("reverse") === "1") {
    return reverse(params.get("lat") ?? "", params.get("lng") ?? "");
  }
  const raw = params.get("url")?.trim();
  if (!raw) return NextResponse.json({ error: "Missing url." }, { status: 400 });
  return resolveUrl(raw);
}
