// Gobble Maps consumer — public list view (FR-9), read-only and shareable.
// No direct prototype screen exists; composed from the consumer atoms
// (GCardRow + brand mark) in the prototype's visual language. Server-safe:
// no hooks, no client state — rendered by /l/[slug]/page.tsx.

import Link from "next/link";
import { Icon } from "@/components/icons";
import { GCardRow, toCardData } from "@/components/app/cards";
import type { ConsumerPlace } from "@/lib/consumer/types";

export interface PublicListProps {
  name: string;
  /** owner username (without leading @) */
  username: string;
  places: ConsumerPlace[];
}

export function PublicList({ name, username, places }: PublicListProps) {
  const now = new Date();
  const count = places.length;

  return (
    <div className="gb-screen" style={{ paddingBottom: 24 }}>
      <header
        style={{
          padding: "12px 18px 2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link className="gb-brand" href="/" style={{ textDecoration: "none" }}>
          <span className="gb-brand-mark">
            <Icon name="pinOutline" size={17} color="#fff" strokeWidth={2.2} />
          </span>
          Gobble Maps
        </Link>
      </header>

      <div style={{ padding: "16px 18px 8px" }}>
        <h1 className="gb-h1">{name}</h1>
        <p className="gb-sub" style={{ marginTop: 4 }}>
          curated by @{username} · {count} {count === 1 ? "place" : "places"}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "8px 18px 0",
        }}
      >
        {count === 0 ? (
          <p className="gb-empty" style={{ padding: "8px 4px" }}>
            This list doesn&apos;t have any places yet.
          </p>
        ) : (
          places.map((p) => <GCardRow key={p.id} place={toCardData(p, now)} />)
        )}
      </div>

      <div style={{ padding: "22px 18px 0" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--gb-line)",
            borderRadius: 16,
            padding: "18px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            textAlign: "center",
          }}
        >
          <span className="gb-brand-mark">
            <Icon name="pinOutline" size={17} color="#fff" strokeWidth={2.2} />
          </span>
          <h2 className="gb-h2">Make your own food map</h2>
          <p className="gb-sub" style={{ maxWidth: 260 }}>
            Save places, track your visits, and build custom lists on Gobble Maps.
          </p>
          <Link className="gb-btn" href="/" style={{ marginTop: 2 }}>
            <Icon name="pinOutline" size={15} color="#fff" strokeWidth={2.2} />
            Open Gobble Maps
          </Link>
        </div>
      </div>
    </div>
  );
}
