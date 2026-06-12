// Gobble Maps consumer — Home ('/'). Server component: fetches published
// places (anon, RLS-safe) and hands them to the client HomeScreen, which
// renders the time-based section, map preview and full list. app_open
// analytics is fired client-side (once per session) inside HomeScreen,
// because a server component cannot write the guard cookie in Next.

import { getPublishedPlaces } from "@/lib/consumer/queries";
import { HomeScreen } from "@/components/app/home-screen";

export default async function HomePage() {
  const places = await getPublishedPlaces();
  return <HomeScreen places={places} />;
}
