"use client";
// Gobble Maps — "Behind Gobble Maps" credits. A quiet, muted credit line
// (CreatorsCredit) that opens a native bottom sheet (CreatorsSheet) with both
// creators and one-tap Instagram / website links. Built on the app's own
// GSheet idiom and design tokens so it blends in completely.

import { useState, type CSSProperties } from "react";
import { Icon, type IconName } from "@/components/icons";
import { GSheet } from "./sheet";
import { CREATORS, CURATOR, MAKER, type Creator } from "@/lib/creators";

const PILL_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 13px",
  borderRadius: 999,
  border: "1px solid var(--gb-line2)",
  background: "#fff",
  fontSize: 12.5,
  fontWeight: 700,
  color: "var(--gb-ink)",
  textDecoration: "none",
};

function LinkPill({
  href,
  icon,
  label,
}: {
  href: string;
  icon: IconName;
  label: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={PILL_STYLE}>
      <Icon name={icon} size={14} color="var(--gb-sky-deep)" />
      {label}
      <Icon name="arrowUR" size={11} color="var(--gb-mut)" strokeWidth={2.2} />
    </a>
  );
}

function CreatorCard({ c }: { c: Creator }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span
        className="gb-avatar"
        style={{ width: 46, height: 46, fontSize: 18, borderRadius: 15, flexShrink: 0 }}
      >
        {c.initial}
      </span>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--gb-ink)",
            }}
          >
            {c.name}
          </span>
          <span className="gb-flabel">{c.role}</span>
        </div>
        <p className="gb-sub">{c.blurb}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <LinkPill href={c.instagramUrl} icon="instagram" label="Instagram" />
          {c.websiteUrl && (
            <LinkPill href={c.websiteUrl} icon="globe" label={c.website ?? "Website"} />
          )}
        </div>
      </div>
    </div>
  );
}

export function CreatorsSheet({ onClose }: { onClose: () => void }) {
  return (
    <GSheet onClose={onClose} maxH="86dvh">
      <div
        style={{
          padding: "2px 20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          // Scroll within the sheet when the viewport is short, so every
          // creator's links stay reachable.
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h3 className="gb-h2" style={{ fontSize: 19 }}>
            Behind Gobble Maps
          </h3>
          <p className="gb-sub">Two people, one food map of Mumbai.</p>
        </div>
        {CREATORS.map((c) => (
          <CreatorCard key={c.name} c={c} />
        ))}
      </div>
    </GSheet>
  );
}

/**
 * The quiet, tappable credit line. Muted by default; names lift to the brand
 * colour on hover. Tapping opens the CreatorsSheet.
 */
export function CreatorsCredit({ style }: { style?: CSSProperties }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="gb-credit"
        style={style}
        onClick={() => setOpen(true)}
      >
        Curated by <strong>{CURATOR.name}</strong> · Built by{" "}
        <strong>{MAKER.name}</strong>
      </button>
      {open && <CreatorsSheet onClose={() => setOpen(false)} />}
    </>
  );
}
