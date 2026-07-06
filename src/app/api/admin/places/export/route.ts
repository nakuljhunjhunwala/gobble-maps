// Admin-only CSV export of every place (with tags, area and photo URLs).
// Photos themselves are not exported — only their public URLs, for reference.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminRequest, getPlacesWithRelations } from "@/lib/admin/queries";
import { toCsv } from "@/lib/admin/csv";
import { PLACE_CSV_HEADERS, placeToCsvRow } from "@/lib/admin/place-csv";

export async function GET() {
  const supabase = await createClient();
  if (!(await isAdminRequest(supabase))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const places = await getPlacesWithRelations();
  const csv = toCsv(
    [...PLACE_CSV_HEADERS],
    places.map((p) => placeToCsvRow(p))
  );

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gobble-places-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
