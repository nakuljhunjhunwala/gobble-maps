import {
  getFilterOptionsWithUsage,
  getPlacesWithRelations,
} from "@/lib/admin/queries";
import { PlacesManager } from "@/components/admin/places-manager";

interface PlacesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function str(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function PlacesPage({ searchParams }: PlacesPageProps) {
  const params = await searchParams;

  const [places, filters] = await Promise.all([
    getPlacesWithRelations(),
    getFilterOptionsWithUsage(),
  ]);

  // ?edit=<placeId> — open the editor for that place on load.
  const initialEditId = typeof params.edit === "string" ? params.edit : null;

  // ?new=1&tbt=<id>&name=&address=&note= — deep link from To Be Tried: open
  // the editor prefilled with visited=true. tbt is the originating pipeline
  // row, retired once the place saves.
  const initialPrefill =
    params.new === "1"
      ? {
          tbtId: typeof params.tbt === "string" ? params.tbt : null,
          name: str(params.name),
          address: str(params.address),
          note: str(params.note),
        }
      : null;

  return (
    <PlacesManager
      places={places}
      filters={filters}
      initialEditId={initialEditId}
      initialPrefill={initialPrefill}
    />
  );
}
