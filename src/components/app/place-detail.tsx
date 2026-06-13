"use client";
// Gobble Maps consumer — Place detail screen, ported from GPlaceDetail in
// design/gobble/screens-detail.jsx. Prototype context/in-memory state is
// replaced with real data: ConsumerPlace props, useUser() for saved sets,
// useAuthUI() for soft login prompts, server actions for mutations, and a
// real maplibre preview (DetailMap, dynamically imported ssr:false).

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import {
  GBudget,
  GOpenDot,
  GScorePill,
  GVisitedBadge,
} from "./atoms";
import { Photo } from "./photo";
import { SaveSheet } from "./save-sheet";
import { ReportSheet } from "./report-sheet";
import { useUser, useAuthUI } from "./providers";
import { useToast } from "@/components/ui/toast";
import { GOBBLE_TYPES } from "@/lib/consumer/place-types";
import { CURATOR } from "@/lib/creators";
import { isOpenNow } from "@/lib/consumer/time";
import { hoursToText } from "@/lib/admin/format";
import { logEvent } from "@/lib/consumer/analytics";
import { toggleSaved } from "@/lib/consumer/user-actions";
import type { ConsumerPlace } from "@/lib/consumer/types";

const DetailMap = dynamic(() => import("./detail-map"), { ssr: false });

export interface PlaceDetailProps {
  place: ConsumerPlace;
}

export function PlaceDetail({ place }: PlaceDetailProps) {
  const router = useRouter();
  const { user, been: beenSet, wish: wishSet, refresh } = useUser();
  const { requireAuth } = useAuthUI();
  const { toast } = useToast();

  const avg = place.ratings?.avg ?? null;
  const been = beenSet.has(place.id);
  const wish = wishSet.has(place.id);
  const open = isOpenNow(place.hours);

  const galRef = useRef<HTMLDivElement>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [saveOpen, setSaveOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Fire place_view once on mount.
  useEffect(() => {
    void logEvent("place_view", place.id);
  }, [place.id]);

  const photoCount = Math.max(place.photoPaths.length, 1);

  const onGalScroll = () => {
    const el = galRef.current;
    if (!el) return;
    setPhotoIdx(Math.round(el.scrollLeft / el.clientWidth));
  };

  const onSave = async (kind: "been_there" | "wishlist") => {
    const res = await toggleSaved(place.id, kind);
    if (res.ok) await refresh();
  };

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = { title: `${place.name} — Gobble Maps`, url };
    void logEvent("place_share", place.id);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // User cancelled or share unavailable — fall through to clipboard.
    }
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied!");
    } catch {
      // Clipboard unavailable — nothing more we can do.
    }
  };

  const ratingRow = (label: string, val: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          width: 70,
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--gb-mut)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 5,
          borderRadius: 99,
          background: "var(--gb-sky-50)",
        }}
      >
        <div
          style={{
            width: (val / 5) * 100 + "%",
            height: "100%",
            borderRadius: 99,
            background: "var(--gb-sky-deep)",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: "var(--gb-ink)",
          width: 28,
          textAlign: "right",
        }}
      >
        {val}/5
      </span>
    </div>
  );

  const detailRow = (
    icon: IconName,
    content: ReactNode,
    href?: string
  ) => {
    const inner = (
      <>
        <span className="gb-detailrow-ic">
          <Icon name={icon} size={16} color="var(--gb-sky-deep)" />
        </span>
        <span style={{ flex: 1, textAlign: "left" }}>{content}</span>
        {href && (
          <Icon
            name="chevR"
            size={13}
            color="var(--gb-line2)"
            strokeWidth={2.4}
          />
        )}
      </>
    );
    if (href) {
      return (
        <a className="gb-detailrow" href={href} target="_blank" rel="noreferrer">
          {inner}
        </a>
      );
    }
    return (
      <div className="gb-detailrow" style={{ cursor: "default" }}>
        {inner}
      </div>
    );
  };

  const actionBtn = (
    icon: IconName,
    label: string,
    active: boolean,
    onTap: () => void,
    activeColor?: string
  ) => (
    <button
      className={"gb-action" + (active ? " gb-action-on" : "")}
      onClick={onTap}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        padding: "12px 6px",
        borderRadius: 13,
        border: "1px solid var(--gb-line2)",
        background: "#fff",
        color: "var(--gb-ink)",
        fontSize: 12.5,
        fontWeight: 700,
        fontFamily: "inherit",
        cursor: "pointer",
        ...(active && activeColor
          ? {
              color: activeColor,
              borderColor: activeColor,
              background: activeColor + "14",
            }
          : {}),
      }}
    >
      <Icon
        name={icon}
        size={18}
        strokeWidth={2}
        fill={active ? "currentColor" : "none"}
      />
      <span>{label}</span>
    </button>
  );

  const hoursLines = hoursToText(place.hours);

  return (
    <div className="gb-screen" style={{ background: "#fff" }}>
      {/* gallery */}
      <div style={{ position: "relative" }}>
        <div ref={galRef} onScroll={onGalScroll} className="gb-gallery">
          {Array.from({ length: photoCount }).map((_, i) => (
            <Photo
              key={i}
              path={place.photoPaths[i] ?? null}
              hue={place.hue}
              type={place.type}
              alt={place.name}
              style={{
                minWidth: "100%",
                height: 250,
                scrollSnapAlign: "start",
              }}
              iconSize={48}
            />
          ))}
        </div>
        <button
          className="gb-backbtn"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <Icon name="chevL" size={16} strokeWidth={2.4} />
          <span style={{ fontSize: 12.5, fontWeight: 700, paddingRight: 2 }}>
            Map
          </span>
        </button>
        <button
          className="gb-backbtn"
          style={{ left: "auto", right: 14 }}
          onClick={() => void onShare()}
          aria-label="Share"
        >
          <Icon name="share" size={16} strokeWidth={2} />
        </button>
        <span className="gb-gallery-count">
          {photoIdx + 1} / {photoCount}
        </span>
      </div>

      <div
        style={{
          padding: "16px 18px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span className="gb-badge gb-badge-type">
              {GOBBLE_TYPES[place.type].label}
            </span>
            <GVisitedBadge visited={place.visited} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <h1 className="gb-h1">{place.name}</h1>
            <GScorePill score={avg} />
          </div>
          <div className="gb-card-meta" style={{ fontSize: 13 }}>
            <span>{place.cuisines.join(", ")}</span>
            <span className="gb-dot"></span>
            <span>{place.area}</span>
            <span className="gb-dot"></span>
            <GBudget n={place.budget} size={11} />
          </div>
          <GOpenDot open={open} />
        </div>

        {/* actions */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
          }}
        >
          {actionBtn(
            "check",
            "Been There",
            been,
            () => requireAuth("save places", () => void onSave("been_there")),
            "#15803D"
          )}
          {actionBtn(
            "heart",
            "Can't Wait",
            wish,
            () => requireAuth("save places", () => void onSave("wishlist")),
            "#C2417A"
          )}
          {actionBtn("bookmark", "Save to List", false, () =>
            requireAuth("create lists", () => setSaveOpen(true))
          )}
        </div>

        {/* unvisited notice */}
        {!place.visited && (
          <div className="gb-infobox">
            <Icon name="info" size={16} strokeWidth={2} />
            <span>
              <strong>Not yet visited by curator</strong> — info sourced from
              public listings (Zomato / Google). No personal rating yet.
            </span>
          </div>
        )}

        {/* curator ratings */}
        {place.visited && place.ratings && (
          <section className="gb-panel">
            <p className="gb-flabel" style={{ marginBottom: 10 }}>
              Curator&apos;s ratings
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 9 }}
            >
              {ratingRow("Food", place.ratings.food)}
              {ratingRow("Service", place.ratings.service)}
              {ratingRow("Ambience", place.ratings.ambience)}
            </div>
          </section>
        )}

        {/* tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {place.vibes.map((v) => (
            <span key={v} className="gb-chip" style={{ cursor: "default" }}>
              {v}
            </span>
          ))}
          {place.pureVeg && (
            <span
              className="gb-chip"
              style={{
                cursor: "default",
                display: "inline-flex",
                gap: 5,
                alignItems: "center",
              }}
            >
              <Icon name="leaf" size={12} color="#15803D" /> Pure Veg
            </span>
          )}
          {place.liveMusic && (
            <span
              className="gb-chip"
              style={{
                cursor: "default",
                display: "inline-flex",
                gap: 5,
                alignItems: "center",
              }}
            >
              <Icon name="music" size={12} /> Live Music
            </span>
          )}
          {place.boardGames && (
            <span
              className="gb-chip"
              style={{
                cursor: "default",
                display: "inline-flex",
                gap: 5,
                alignItems: "center",
              }}
            >
              <Icon name="dice" size={12} /> Board Games
            </span>
          )}
        </div>

        {/* curator's section */}
        {place.visited && place.mustTry.length > 0 && (
          <section className="gb-panel gb-panel-sky">
            <p
              className="gb-flabel"
              style={{ marginBottom: 10, color: "var(--gb-sky-deep)" }}
            >
              From the curator
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--gb-mut)",
                    marginBottom: 6,
                  }}
                >
                  MUST-TRY DISHES
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                  }}
                >
                  {place.mustTry.map((d) => (
                    <span
                      key={d}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        fontSize: 13.5,
                        color: "var(--gb-ink)",
                        fontWeight: 600,
                      }}
                    >
                      <Icon name="fork" size={13} color="var(--gb-sky-deep)" />{" "}
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              {place.note && (
                <div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--gb-mut)",
                      marginBottom: 4,
                    }}
                  >
                    CURATOR&apos;S NOTE
                  </p>
                  <p
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      color: "var(--gb-ink)",
                    }}
                  >
                    “{place.note}”
                  </p>
                </div>
              )}
              {place.bestTime && (
                <div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--gb-mut)",
                      marginBottom: 4,
                    }}
                  >
                    BEST TIME TO VISIT
                  </p>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: "var(--gb-ink)",
                      fontWeight: 600,
                    }}
                  >
                    {place.bestTime}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* curator attribution — Tirth handpicked the visited places */}
        {place.visited && (
          <a
            href={CURATOR.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              alignSelf: "center",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--gb-mut)",
              textDecoration: "none",
            }}
          >
            <Icon name="instagram" size={13} color="var(--gb-sky-deep)" />
            Curated by {CURATOR.name}
            <Icon name="arrowUR" size={10} color="var(--gb-mut)" strokeWidth={2.2} />
          </a>
        )}

        {/* details */}
        <section className="gb-panel" style={{ padding: "4px 6px" }}>
          {hoursLines.length > 0 &&
            detailRow(
              "clock",
              <span>
                {hoursLines.map((line) => (
                  <span key={line} style={{ display: "block" }}>
                    {line}
                  </span>
                ))}
              </span>
            )}
          {place.phone &&
            detailRow("phone", place.phone, `tel:${place.phone}`)}
          {place.instagram &&
            detailRow(
              "instagram",
              "@" + place.instagram,
              `https://instagram.com/${place.instagram}`
            )}
          {place.address && detailRow("pinOutline", place.address)}
          {place.station &&
            detailRow("train", "Nearest station · " + place.station)}
        </section>

        {/* map preview */}
        {place.lat !== null && place.lng !== null && (
          <section
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid var(--gb-line)",
            }}
          >
            <DetailMap
              lat={place.lat}
              lng={place.lng}
              type={place.type}
              visited={place.visited}
              been={been}
            />
            <a
              className="gb-btn"
              style={{ width: "calc(100% - 24px)", margin: 12 }}
              href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="arrowUR" size={16} strokeWidth={2.4} /> Get Directions
            </a>
          </section>
        )}

        <button
          className="gb-link"
          style={{
            alignSelf: "center",
            display: "inline-flex",
            gap: 6,
            alignItems: "center",
            color: "var(--gb-mut)",
          }}
          onClick={() =>
            requireAuth("report issues", () => setReportOpen(true))
          }
        >
          <Icon name="flag" size={13} /> Report an issue with this place
        </button>
      </div>

      {saveOpen && user && (
        <SaveSheet placeId={place.id} onClose={() => setSaveOpen(false)} />
      )}
      {reportOpen && user && (
        <ReportSheet
          placeId={place.id}
          placeName={place.name}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}
