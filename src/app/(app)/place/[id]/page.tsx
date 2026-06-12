// Gobble Maps consumer — Place detail route. Server component: fetches the
// place, 404s when missing, renders the permanently-closed message when
// applicable, else the client PlaceDetail screen.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlace } from "@/lib/consumer/queries";
import { GOBBLE_TYPES } from "@/lib/consumer/place-types";
import { PlaceDetail } from "@/components/app/place-detail";
import { placeJsonLd } from "@/lib/seo/json-ld";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Meta descriptions cap out around 160 chars in search snippets. */
function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const place = await getPlace(id);
  if (!place) {
    return {
      title: "Place not found",
      robots: { index: false, follow: false },
    };
  }

  if (place.permanentlyClosed) {
    // Thin page (just the closed notice) — keep it out of the index.
    return {
      title: place.name,
      description: `${place.name} is permanently closed.`,
      robots: { index: false },
    };
  }

  const description = truncate(
    place.note ??
      (place.cuisines.length > 0
        ? `${place.cuisines.join(", ")} · ${place.area ?? "Mumbai"}`
        : `${GOBBLE_TYPES[place.type].label} in ${place.area ?? "Mumbai"}`)
  );

  return {
    // Root template appends "— Gobble Maps".
    title: place.name,
    description,
    alternates: { canonical: `/place/${id}` },
    openGraph: {
      url: `/place/${id}`,
      title: place.name,
      description,
    },
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: placeJsonLd(place) }}
      />
      <PlaceDetail place={place} />
    </>
  );
}
