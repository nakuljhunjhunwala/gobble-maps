// Gobble Maps consumer — Home ('/'). Server component: fetches published
// places (anon, RLS-safe) and hands them to the client HomeScreen, which
// renders the time-based section, map preview and full list. app_open
// analytics is fired client-side (once per session) inside HomeScreen,
// because a server component cannot write the guard cookie in Next.

import type { Metadata } from "next";
import { getPublishedPlaces } from "@/lib/consumer/queries";
import { HomeScreen } from "@/components/app/home-screen";

// Title/description inherit the root defaults; only the canonical and
// og:url are page-specific (deliberately not set in the root layout).
// images must be re-declared: a page-level openGraph object replaces the
// root one wholesale, dropping the root file-convention og:image.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/", images: "/opengraph-image" },
};

export default async function HomePage() {
  const places = await getPublishedPlaces();
  return <HomeScreen places={places} />;
}
