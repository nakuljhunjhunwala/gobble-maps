"use client";

import type { PlaceType, PlaceWithRelations } from "@/lib/types";
import { Icon, type IconName } from "@/components/icons";
import { Modal } from "@/components/ui/modal";
import { publicPhotoUrl } from "@/components/admin/photo-uploader";

// Ported from prototype GOBBLE_TYPES (design/gobble/data.js).
export const PLACE_TYPES: Record<PlaceType, { label: string; icon: IconName }> =
  {
    restaurant: { label: "Restaurant", icon: "fork" },
    cafe: { label: "Café", icon: "coffee" },
    club: { label: "Club / Bar", icon: "cocktail" },
    bakery: { label: "Bakery / Dessert", icon: "cake" },
    street: { label: "Street Food Stall", icon: "cart" },
    brewery: { label: "Brewery", icon: "beer" },
  };

export interface PlacePreviewProps {
  place: PlaceWithRelations;
  onClose: () => void;
}

// Port of prototype APreview — "Preview as user" modal.
export function PlacePreview({ place, onClose }: PlacePreviewProps) {
  const cuisines = place.tags
    .filter((t) => t.category === "cuisine")
    .map((t) => t.label);

  const hasRatings =
    place.visited &&
    place.food_rating !== null &&
    place.service_rating !== null &&
    place.ambience_rating !== null;
  const avg =
    place.avg_rating ??
    (hasRatings
      ? Math.round(
          (((place.food_rating as number) +
            (place.service_rating as number) +
            (place.ambience_rating as number)) /
            3) *
            10
        ) / 10
      : null);

  return (
    <Modal title={`Preview — how users see “${place.name}”`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {place.photos.length > 0 ? (
            place.photos.map((photo) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={photo.id}
                src={publicPhotoUrl(photo.storage_path)}
                alt={place.name}
                style={{
                  width: 110,
                  height: 80,
                  borderRadius: 10,
                  flexShrink: 0,
                  objectFit: "cover",
                }}
              />
            ))
          ) : (
            <span
              className="ad-detail-ic"
              style={{ width: 110, height: 80, borderRadius: 10, flexShrink: 0 }}
            >
              <Icon
                name={PLACE_TYPES[place.type].icon}
                size={26}
                color="var(--gb-deep)"
              />
            </span>
          )}
        </div>
        <div
          style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}
        >
          <span className="gb-badge gb-badge-type">
            {PLACE_TYPES[place.type].label}
          </span>
          {place.visited ? (
            <span className="gb-badge gb-badge-visited">
              <Icon name="check" size={11} strokeWidth={2.6} /> Personally visited
            </span>
          ) : (
            <span className="gb-badge gb-badge-unvisited">
              <Icon name="info" size={11} strokeWidth={2} /> Not yet visited by
              curator
            </span>
          )}
        </div>
        <div>
          <h3 className="ad-h3" style={{ fontSize: 20 }}>
            {place.name || "Unnamed place"}
          </h3>
          <p className="ad-sub">
            {cuisines.join(", ") || "No cuisine tags"} ·{" "}
            {place.area?.label ?? "—"} · {"★".repeat(place.budget)}
          </p>
        </div>
        {hasRatings && (
          <p style={{ fontSize: 13 }}>
            Food <strong>{place.food_rating}</strong> · Service{" "}
            <strong>{place.service_rating}</strong> · Ambience{" "}
            <strong>{place.ambience_rating}</strong> · Avg <strong>{avg}/5</strong>
          </p>
        )}
        {place.visited && place.curator_note && (
          <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--gb-ink)" }}>
            “{place.curator_note}”
          </p>
        )}
        <p className="ad-sub">{place.address}</p>
      </div>
    </Modal>
  );
}
