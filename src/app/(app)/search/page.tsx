// Gobble Maps consumer — Search route ('/search').
// Server component shell. The searchable dataset (published + permanently
// closed places) is fetched per-query via the searchAction server action so
// RLS-hidden closed places can be surfaced and flagged; nothing needs to be
// fetched up front here.

import { SearchScreen } from "@/components/app/search-screen";

export default function SearchPage() {
  return <SearchScreen />;
}
