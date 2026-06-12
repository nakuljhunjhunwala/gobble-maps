// Gobble Maps — JSON-LD builders (schema.org structured data).
// Injected via <script type="application/ld+json"> + dangerouslySetInnerHTML
// per the Next.js JSON-LD guide; serialize() escapes `<` against XSS since
// names/notes are CMS-entered text.

import type { ConsumerPlace } from "@/lib/consumer/types";
import type { PlaceType } from "@/lib/types";
import { photoUrl } from "@/lib/admin/format";
import { SITE_NAME, SITE_SHORT_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

/** GOBBLE_TYPES keys → schema.org food-establishment types. */
const SCHEMA_TYPE: Record<PlaceType, string> = {
  restaurant: "Restaurant",
  cafe: "CafeOrCoffeeShop",
  club: "BarOrPub",
  bakery: "Bakery",
  street: "FoodEstablishment",
  brewery: "Brewery",
};

/** Admin stores either a bare handle ("@cafe" / "cafe") or a full URL. */
function normalizeInstagram(value: string | null): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://www.instagram.com/${value.replace(/^@/, "")}`;
}

/** Ensures the stored website has a protocol. */
function normalizeWebsite(value: string | null): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

type JsonLdValue =
  | string
  | number
  | boolean
  | JsonLdValue[]
  | { [key: string]: JsonLdValue | undefined };

/** Drops undefined values (recursively) and escapes `<` for safe inlining. */
export function serializeJsonLd(data: Record<string, JsonLdValue | undefined>): string {
  return JSON.stringify(data, (_key, value) =>
    value === undefined ? undefined : value
  ).replace(/</g, "\\u003c");
}

/** Site-wide WebSite entity (rendered once in the root layout). */
export function webSiteJsonLd(): string {
  // No SearchAction: /search keeps its query in client state, not in a
  // ?q= URL param, so there is no crawlable search deep-link to advertise.
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: SITE_SHORT_NAME,
    url: SITE_URL,
  });
}

/** FoodEstablishment entity for a published place detail page. */
export function placeJsonLd(place: ConsumerPlace): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[place.type],
    name: place.name,
    url: absoluteUrl(`/place/${place.id}`),
    description: place.note ?? undefined,
    servesCuisine: place.cuisines.length > 0 ? place.cuisines : undefined,
    telephone: place.phone ?? undefined,
    image:
      place.photoPaths.length > 0 ? place.photoPaths.map(photoUrl) : undefined,
    sameAs: (() => {
      const links = [
        normalizeInstagram(place.instagram),
        normalizeWebsite(place.website),
      ].filter((l): l is string => Boolean(l));
      return links.length > 0 ? links : undefined;
    })(),
    // budget is the curator's 1–5 price band.
    priceRange: place.budget ? "₹".repeat(place.budget) : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: place.address ?? undefined,
      addressLocality: place.area ? `${place.area}, Mumbai` : "Mumbai",
      addressRegion: "Maharashtra",
      addressCountry: "IN",
    },
    geo:
      place.lat !== null && place.lng !== null
        ? {
            "@type": "GeoCoordinates",
            latitude: place.lat,
            longitude: place.lng,
          }
        : undefined,
    // Single curator score → one Review (AggregateRating would claim
    // multiple raters and requires ratingCount).
    review: place.ratings
      ? {
          "@type": "Review",
          author: { "@type": "Organization", name: SITE_NAME },
          reviewRating: {
            "@type": "Rating",
            ratingValue: place.ratings.avg,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : undefined,
  });
}
