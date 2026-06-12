// Gobble Maps — single source of truth for brand + site metadata.
// Imported by layout metadata, OG images, robots, sitemap, manifest, JSON-LD.
// Note: the domain spells "gooble" while the brand spells "Gobble" — the
// domain is intentional, do not "fix" either spelling.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://gooblemaps.nakuljhunjhunwala.in"
).replace(/\/+$/, "");

export const SITE_NAME = "Gobble Maps";
export const SITE_SHORT_NAME = "Gobble";
export const SITE_TAGLINE = "Curated food & nightlife in Mumbai";
export const SITE_DESCRIPTION =
  "Gobble Maps is a personally curated guide to Mumbai's best restaurants, cafés, bars, bakeries, street food and breweries — every place visited, rated and mapped.";

export const BRAND = {
  gradientFrom: "#3DA5DE",
  gradientTo: "#1D7FB8",
  bg: "#F4F8FB",
  ink: "#14313F",
} as const;

export const OG_SIZE = { width: 1200, height: 630 } as const;

/** Resolves a path against the canonical site origin. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
