// Gobble Maps consumer — /map route (server component).
// Fetches published places (anon-safe) and hands them to the client map screen.

import type { Metadata } from "next";
import { getPublishedPlaces } from "@/lib/consumer/queries";
import { MapScreen } from "@/components/app/map-screen";

const DESCRIPTION =
  "Every curated restaurant, café, bar, bakery and street-food stall in Mumbai on one interactive map.";

export const metadata: Metadata = {
  title: "Food map of Mumbai",
  description: DESCRIPTION,
  alternates: { canonical: "/map" },
  openGraph: {
    url: "/map",
    title: "Food map of Mumbai",
    description: DESCRIPTION,
    images: "/opengraph-image",
  },
};

export default async function MapPage() {
  const places = await getPublishedPlaces();
  return <MapScreen places={places} />;
}
