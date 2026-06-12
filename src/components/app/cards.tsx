// Gobble Maps consumer — place cards, ported from GCardWide / GCardRow in
// design/gobble/components.jsx. Cards link to /place/[id] via next/link
// instead of the prototype's openPlace(). Server-safe.
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import {
  GBudget,
  GOpenDot,
  GScorePill,
  GVisitedBadge,
} from "@/components/app/atoms";
import { GOBBLE_TYPES, Photo, type PlaceTypeKey } from "@/components/app/photo";
import { isOpenNow } from "@/lib/consumer/time";
import type { ConsumerPlace } from "@/lib/consumer/types";

/**
 * Structural shape the cards need — intentionally minimal so any
 * ConsumerPlace-shaped object satisfies it.
 */
export interface PlaceCardData {
  id: string;
  name: string;
  type: PlaceTypeKey;
  cuisines: string[];
  vibes: string[];
  area: string;
  budget: number;
  avgRating: number | null;
  visited: boolean;
  openNow: boolean;
  photoPath: string | null;
  hue: number;
  permanentlyClosed: boolean;
}

/**
 * Flattens a ConsumerPlace into the structural shape the cards consume.
 * `now` is the pinned current time used for the open/closed computation —
 * callers must pass their screen's pinned `now` so all cards agree.
 */
export function toCardData(place: ConsumerPlace, now: Date): PlaceCardData {
  return {
    id: place.id,
    name: place.name,
    type: place.type,
    cuisines: place.cuisines,
    vibes: place.vibes,
    area: place.area ?? "",
    budget: place.budget,
    avgRating: place.ratings?.avg ?? null,
    visited: place.visited,
    openNow: isOpenNow(place.hours, now),
    photoPath: place.photoPaths[0] ?? null,
    hue: place.hue,
    permanentlyClosed: place.permanentlyClosed,
  };
}

/** Horizontal rail card (Home meal rail). */
export function GCardWide({ place }: { place: PlaceCardData }) {
  return (
    <Link className="gb-card-wide" href={`/place/${place.id}`}>
      <Photo
        path={place.photoPath}
        hue={place.hue}
        type={place.type}
        alt={place.name}
        style={{ width: "100%", height: 118, borderRadius: "14px 14px 0 0" }}
      />
      <div
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 5,
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span className="gb-card-name">{place.name}</span>
          <GScorePill score={place.avgRating} small={true} />
        </div>
        <div className="gb-card-meta">
          <span>{place.cuisines[0]}</span>
          <span className="gb-dot"></span>
          <span>{place.area}</span>
          <span className="gb-dot"></span>
          <GBudget n={place.budget} size={10} />
        </div>
        <GOpenDot open={place.openNow} />
      </div>
    </Link>
  );
}

export interface GCardRowProps {
  place: PlaceCardData;
  /** place is in the signed-in user's been-there list (green check) */
  been?: boolean;
  trailing?: ReactNode;
  closedNote?: boolean;
}

/** Vertical list card. Permanently closed places are not clickable. */
export function GCardRow({
  place,
  been = false,
  trailing = null,
  closedNote = false,
}: GCardRowProps) {
  const closed = place.permanentlyClosed;
  const inner = (
    <>
      <Photo
        path={place.photoPath}
        hue={place.hue}
        type={place.type}
        alt={place.name}
        style={{ width: 78, height: 78, borderRadius: 12, flexShrink: 0 }}
        iconSize={26}
      />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            className="gb-card-name"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {place.name}
          </span>
          {been && (
            <Icon name="check" size={13} color="#15803D" strokeWidth={3} />
          )}
        </div>
        <div className="gb-card-meta">
          <span>{GOBBLE_TYPES[place.type].label}</span>
          <span className="gb-dot"></span>
          <span>{place.area}</span>
          <span className="gb-dot"></span>
          <GBudget n={place.budget} size={10} />
        </div>
        {closed && closedNote ? (
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#B4514B" }}>
            This place is permanently closed.
          </span>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <GVisitedBadge visited={place.visited} small={true} />
            <GOpenDot open={place.openNow} />
          </div>
        )}
      </div>
      {!closed && (trailing || <GScorePill score={place.avgRating} small={true} />)}
    </>
  );

  if (closed) {
    return (
      <div className="gb-card-row" style={{ opacity: 0.85, cursor: "default" }}>
        {inner}
      </div>
    );
  }
  return (
    <Link className="gb-card-row" href={`/place/${place.id}`}>
      {inner}
    </Link>
  );
}
