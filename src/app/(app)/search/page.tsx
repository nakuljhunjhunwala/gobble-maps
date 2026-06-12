// Gobble Maps consumer — Search route ('/search').
// Server component shell. The searchable dataset (published + permanently
// closed places) is fetched per-query via the searchAction server action so
// RLS-hidden closed places can be surfaced and flagged; nothing needs to be
// fetched up front here.

import type { Metadata } from "next";
import { SearchScreen } from "@/components/app/search-screen";

const DESCRIPTION =
  "Search Mumbai's curated places by name, area, cuisine or vibe on Gobble Maps.";

export const metadata: Metadata = {
  title: "Search places",
  description: DESCRIPTION,
  alternates: { canonical: "/search" },
  openGraph: {
    url: "/search",
    title: "Search places",
    description: DESCRIPTION,
    images: "/opengraph-image",
  },
};

export default function SearchPage() {
  return <SearchScreen />;
}
