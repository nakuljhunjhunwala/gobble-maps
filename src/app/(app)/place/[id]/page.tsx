// Gobble Maps consumer — Place detail route. Server component: fetches the
// place, 404s when missing, renders the permanently-closed message when
// applicable, else the client PlaceDetail screen.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlace } from "@/lib/consumer/queries";
import { GOBBLE_TYPES } from "@/lib/consumer/place-types";
import { PlaceDetail } from "@/components/app/place-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const place = await getPlace(id);
  if (!place) return { title: "Gobble Maps" };

  const description =
    place.note ??
    (place.cuisines.length > 0
      ? `${place.cuisines.join(", ")} · ${place.area ?? "Mumbai"}`
      : `${GOBBLE_TYPES[place.type].label} in ${place.area ?? "Mumbai"}`);

  return {
    title: `${place.name} — Gobble Maps`,
    description,
  };
}

export default async function PlacePage({ params }: PageProps) {
  const { id } = await params;
  const place = await getPlace(id);
  if (!place) notFound();

  if (place.permanentlyClosed) {
    return (
      <div
        className="gb-screen"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 8,
          padding: "0 32px",
        }}
      >
        <h1 className="gb-h1">{place.name}</h1>
        <p className="gb-sub">This place is permanently closed.</p>
      </div>
    );
  }

  return <PlaceDetail place={place} />;
}
