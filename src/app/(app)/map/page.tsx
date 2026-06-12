// Gobble Maps consumer — /map route (server component).
// Fetches published places (anon-safe) and hands them to the client map screen.

import { getPublishedPlaces } from "@/lib/consumer/queries";
import { MapScreen } from "@/components/app/map-screen";

export default async function MapPage() {
  const places = await getPublishedPlaces();
  return <MapScreen places={places} />;
}
