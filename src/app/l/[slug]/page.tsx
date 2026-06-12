// Gobble Maps consumer — public shareable list (FR-9). Standalone route
// OUTSIDE the (app) group: it renders the shell column WITHOUT the bottom tab
// bar and requires no login. Private/missing lists 404 (verified in the query,
// never trusting the slug alone).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@/app/app.css";
import { PublicList } from "@/components/app/public-list";
import { getPublicList } from "./queries";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const list = await getPublicList(slug);
  if (!list) return { title: "Gobble Maps" };
  return { title: `${list.name} — Gobble Maps` };
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
