// Gobble Maps consumer — offline pin layer (FR-16).
// Returns a lightweight list of published places (id, name, lat, lng, type,
// visited) so the service worker can cache it and offline users still see
// place-name pins on the map. Anon server client; RLS exposes published rows.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface PlaceLight {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  type: string;
  visited: boolean;
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select("id,name,lat,lng,type,visited")
    .eq("status", "published");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const places = (data ?? []) as PlaceLight[];

  return NextResponse.json(places, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
