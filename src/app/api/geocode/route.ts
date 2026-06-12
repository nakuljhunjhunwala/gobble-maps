// Gobble Maps consumer — Nominatim geocoding proxy.
// Keeps the required User-Agent header server-side and bounds searches to
// the Greater Mumbai + Thane + Navi Mumbai viewbox. Cached for a day
// (force-cache + revalidate 86400).

import { NextResponse } from "next/server";

interface NominatimResult {
  display_name?: string;
  lat?: string;
  lon?: string;
}

export type GeocodeResponse =
  | { name: string; lat: number; lng: number }
  | { error: string };

export async function GET(request: Request): Promise<NextResponse<GeocodeResponse>> {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  // viewbox format = left,top,right,bottom (lng,lat,lng,lat).
  url.searchParams.set("viewbox", "72.75,19.35,73.20,18.85");
  url.searchParams.set("bounded", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "3");

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "GobbleMaps/1.0 (admin contact: dev@unicoconnect.com)",
      },
      cache: "force-cache",
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Geocoding unavailable" }, { status: 502 });
    }
    const results = (await res.json()) as NominatimResult[];
    const top = results[0];
    if (!top || top.lat === undefined || top.lon === undefined) {
      return NextResponse.json({ error: "No match" }, { status: 404 });
    }
    return NextResponse.json({
      name: top.display_name?.split(",")[0]?.trim() || q,
      lat: Number(top.lat),
      lng: Number(top.lon),
    });
  } catch {
    return NextResponse.json({ error: "Geocoding unavailable" }, { status: 502 });
  }
}
