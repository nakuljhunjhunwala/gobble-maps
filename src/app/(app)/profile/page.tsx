// Gobble Maps consumer — Profile route ('/profile').
// Server component: fetches published places (used to render saved/list cards
// by id); user state is resolved client-side via useUser() in ProfileScreen.

import type { Metadata } from "next";
import { getPublishedPlaces } from "@/lib/consumer/queries";
import { ProfileScreen } from "@/components/app/profile-screen";

// Personal screen — keep out of search results.
export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const places = await getPublishedPlaces();
  return <ProfileScreen places={places} />;
}
