"use client";
// Gobble Maps consumer — Home screen, ported from GHomeScreen in
// design/gobble/screens-main.jsx. Real data: published places (server prop),
// shared filters/user/auth contexts, next/link navigation, and the
// time-based home section from homeSections(). Mini map preview is a static
// styled SVG (NOT maplibre) with up to 8 mini-pins positioned by lat/lng.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { GOfflineBanner, GSectionTitle } from "./atoms";
import { GCardRow, GCardWide, toCardData } from "./cards";
import { FilterSheet } from "./filter-sheet";
import { useAuthUI, useFilters, useUser } from "./providers";
import { filterPlaces } from "@/lib/consumer/filters";
import { homeSections, timeLabel } from "@/lib/consumer/time";
import { logEvent } from "@/lib/consumer/analytics";
import type { ConsumerPlace } from "@/lib/consumer/types";
import type { MealSlot } from "@/lib/types";

// Mumbai bounds used to linearly map lat/lng → mini-map box %.
const LNG_MIN = 72.79;
const LNG_MAX = 73.0;
const LAT_TOP = 19.3; // top of the box (highest latitude)
const LAT_BOTTOM = 18.89; // bottom of the box (lowest latitude)

function miniPos(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100;
  const y = ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * 100;
  return {
    x: Math.max(4, Math.min(96, x)),
    y: Math.max(6, Math.min(94, y)),
  };
}

/** Stylised Mumbai map canvas (ported from GMapCanvas, static preview). */
function MiniMapCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#BFDCEE",
        height: 170,
        borderRadius: 15,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <path
          d="M22,-2 L70,-2 L72,6 C73,14 71,22 67,30 C64,38 62,46 61,54 C60,64 58,76 55,88 C54,93 52,98 50,102 L43,102 C43,96 44,90 43,84 C42,76 43,70 41,64 C39,58 36,62 34,56 C32,50 36,46 34,42 C32,38 27,40 27,34 C27,28 31,26 30,20 C29,14 24,10 22,4 Z"
          fill="#EBF0E4"
        />
        <path
          d="M84,-2 L102,-2 L102,102 L78,102 C80,92 80,80 82,68 C84,56 82,44 84,32 C86,20 84,8 84,-2 Z"
          fill="#EBF0E4"
        />
        <ellipse cx="56" cy="16" rx="9" ry="8" fill="#D9E8CB" />
        <ellipse cx="50" cy="44" rx="4.5" ry="6" fill="#D9E8CB" />
        <ellipse cx="90" cy="50" rx="5" ry="9" fill="#D9E8CB" />
        <path
          d="M31,0 C36,12 38,20 39,30 C41,42 46,50 46,60 C46,72 45,82 44,98"
          fill="none"
          stroke="#fff"
          strokeWidth="1.1"
        />
        <path
          d="M50,0 C52,10 54,22 53,34 C52,44 49,54 48,64"
          fill="none"
          stroke="#fff"
          strokeWidth="0.8"
        />
        <path
          d="M39,30 C46,32 52,36 58,37 C66,38 74,36 84,34"
          fill="none"
          stroke="#fff"
          strokeWidth="0.8"
        />
        <path
          d="M46,60 C52,60 58,62 64,61"
          fill="none"
          stroke="#fff"
          strokeWidth="0.7"
        />
        <path
          d="M30,41 C28,48 31,54 35,60"
          fill="none"
          stroke="#fff"
          strokeWidth="0.9"
          strokeDasharray="2 1.2"
          opacity="0.9"
        />
        <path
          d="M10,30 q3,-1.5 6,0 M8,55 q3,-1.5 6,0 M14,78 q3,-1.5 6,0 M70,80 q3,-1.5 6,0 M72,55 q3,-1.5 6,0"
          stroke="#A9CFE8"
          strokeWidth="0.7"
          fill="none"
          strokeLinecap="round"
        />
        {(
          [
            ["ANDHERI", 44, 12],
            ["POWAI", 64, 20],
            ["JUHU", 26, 24],
            ["BANDRA", 27, 35.5],
            ["BKC", 52, 41],
            ["MATUNGA", 56, 52],
            ["WORLI", 31, 64],
            ["LOWER PAREL", 50, 64],
            ["FORT", 53, 83],
            ["COLABA", 50, 95],
            ["ARABIAN SEA", 12, 45],
          ] as [string, number, number][]
        ).map(([t, x, y]) => (
          <text
            key={t}
            x={x}
            y={y}
            fontSize="2.5"
            fontWeight="700"
            letterSpacing="0.5"
            fill={t === "ARABIAN SEA" ? "#7FAECC" : "#9DAFA4"}
            fontFamily="'Albert Sans', sans-serif"
            fontStyle={t === "ARABIAN SEA" ? "italic" : "normal"}
          >
            {t}
          </text>
        ))}
      </svg>
      {children}
    </div>
  );
}

export function HomeScreen({ places }: { places: ConsumerPlace[] }) {
  const { user, been } = useUser();
  const { filters, activeCount, clear } = useFilters();
  const { openAuth } = useAuthUI();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // app_open analytics — once per session (the layout can't write the cookie
  // from a server component, so we guard with sessionStorage here).
  useEffect(() => {
    try {
      if (sessionStorage.getItem("gb_ao")) return;
      sessionStorage.setItem("gb_ao", "1");
    } catch {
      // sessionStorage unavailable — still log once per mount.
    }
    void logEvent("app_open");
  }, []);

  const now = useMemo(() => new Date(), []);
  const section = useMemo(() => homeSections(now), [now]);
  const label = useMemo(() => timeLabel(now), [now]);

  const visible = useMemo(
    () => filterPlaces(places, filters, now),
    [places, filters, now]
  );

  const mealPicks = useMemo(() => {
    if (section.key === "explore") return visible.slice(0, 5);
    const meal = section.key as MealSlot;
    return [...visible]
      .filter((p) => p.meals.includes(meal))
      .sort((a, b) => Number(b.visited) - Number(a.visited));
  }, [visible, section]);

  const miniPins = useMemo(
    () => visible.filter((p) => p.lat != null && p.lng != null).slice(0, 8),
    [visible]
  );

  return (
    <div className="gb-screen" data-screen-label="Home">
      <GOfflineBanner />
      {/* header */}
      <header
        style={{
          padding: "8px 18px 2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div className="gb-brand">
            <span className="gb-brand-mark">
              <Icon name="pinOutline" size={17} color="#fff" strokeWidth={2.2} />
            </span>
            Gobble Maps
          </div>
          <p className="gb-sub" style={{ marginTop: 3 }}>
            Mumbai · every place personally vetted
          </p>
        </div>
        {user ? (
          <Link className="gb-avatar" href="/profile">
            {user.username[0].toUpperCase()}
          </Link>
        ) : (
          <button className="gb-btn gb-btn-sm" onClick={() => openAuth()}>
            Log in
          </button>
        )}
      </header>

      {/* search + filter row */}
      <div style={{ display: "flex", gap: 8, padding: "12px 18px 4px" }}>
        <Link className="gb-searchbar" href="/search">
          <Icon name="search" size={16} color="var(--gb-mut)" /> Search places,
          cuisines, areas…
        </Link>
        <button
          className="gb-iconbtn"
          onClick={() => setFiltersOpen(true)}
          style={{ position: "relative" }}
        >
          <Icon name="sliders" size={18} color="var(--gb-ink)" />
          {activeCount > 0 && (
            <span className="gb-filter-count">{activeCount}</span>
          )}
        </button>
      </div>

      {/* time & day section (FR-1) */}
      <div style={{ marginTop: 14 }}>
        <GSectionTitle
          title={section.title}
          sub={
            <>
              {section.sub + " · "}
              {/* `label` derives from new Date() on both server and client;
                  a minute-boundary race can differ, so suppress that warning. */}
              <span suppressHydrationWarning>{label}</span>
            </>
          }
        />
        <div className="gb-rail">
          {mealPicks.length === 0 && (
            <p className="gb-empty" style={{ padding: "8px 4px" }}>
              Nothing matches your filters here.
            </p>
          )}
          {mealPicks.map((p) => (
            <GCardWide key={p.id} place={toCardData(p, now)} />
          ))}
        </div>
      </div>

      {/* map preview */}
      <div style={{ marginTop: 6 }}>
        <GSectionTitle
          title="On the map"
          sub={visible.length + " places around Mumbai"}
          action={
            <Link className="gb-link" href="/map">
              Open map
            </Link>
          }
        />
        <Link
          href="/map"
          style={{
            display: "block",
            width: "calc(100% - 36px)",
            margin: "10px 18px 0",
            padding: 0,
            border: "1px solid var(--gb-line)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <MiniMapCanvas>
            {miniPins.map((p) => {
              const pos = miniPos(p.lat as number, p.lng as number);
              return (
                <span
                  key={p.id}
                  className="gb-minipin"
                  style={{
                    left: pos.x + "%",
                    top: pos.y + "%",
                    background: p.visited ? "var(--gb-sky-deep)" : "#9FB3C4",
                  }}
                ></span>
              );
            })}
          </MiniMapCanvas>
        </Link>
      </div>

      {/* vertical list */}
      <div style={{ marginTop: 18, paddingBottom: 24 }}>
        <GSectionTitle title="All places" sub="The full curated list" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "10px 18px 0",
          }}
        >
          {visible.map((p) => (
            <GCardRow
              key={p.id}
              place={toCardData(p, now)}
              been={been.has(p.id)}
            />
          ))}
          {visible.length === 0 && (
            <p className="gb-empty">
              No places match your filters.{" "}
              <button className="gb-link" onClick={clear}>
                Clear all
              </button>
            </p>
          )}
        </div>
      </div>

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        places={places}
      />
    </div>
  );
}
