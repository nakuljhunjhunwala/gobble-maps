// Gobble Maps consumer — public shareable list (FR-9). Standalone route
// OUTSIDE the (app) group: it renders the shell column WITHOUT the bottom tab
// bar and requires no login. Private/missing lists 404 (verified in the query,
// never trusting the slug alone).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@/app/app.css";
import { PublicList } from "@/components/app/public-list";
import { SITE_NAME } from "@/lib/site";
import { getPublicList } from "./queries";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const list = await getPublicList(slug);
  if (!list) {
    return {
      title: "List not found",
      robots: { index: false, follow: false },
    };
  }

  const description = `${list.places.length} place${
    list.places.length === 1 ? "" : "s"
  } in Mumbai curated by @${list.username} on ${SITE_NAME}.`;

  return {
    // Root template appends "— Gobble Maps".
    title: list.name,
    description,
    alternates: { canonical: `/l/${slug}` },
    openGraph: {
      url: `/l/${slug}`,
      title: list.name,
      description,
    },
  };
}

export default async function PublicListPage({ params }: PageProps) {
  const { slug } = await params;
  const list = await getPublicList(slug);
  if (!list) notFound();

  return (
    <div className="g-shell">
      <PublicList
        name={list.name}
        username={list.username}
        places={list.places}
      />
    </div>
  );
}
