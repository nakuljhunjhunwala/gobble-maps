// Gobble Maps consumer — shared skeleton primitives. Pure presentational and
// server-safe (no "use client"): composable shimmer placeholders built only
// from the shared `gb-skel` block (sweeping ::after shimmer defined in
// globals.css — do NOT add keyframes here). Each piece mirrors the layout of
// the real component it stands in for so loaders occupy the same space and
// the screen doesn't shift when data arrives.

import type { CSSProperties } from "react";

interface SkelLineProps {
  /** width (px or any CSS length); defaults to 100% */
  w?: number | string;
  /** height in px; defaults to the gb-skel-text height (11px) */
  h?: number;
  style?: CSSProperties;
}

/** A single shimmer text line. */
export function SkelLine({ w = "100%", h = 11, style }: SkelLineProps) {
  return (
    <span
      className="gb-skel gb-skel-text"
      style={{ display: "block", width: w, height: h, ...style }}
    />
  );
}

interface SkelCircleProps {
  /** diameter in px */
  size: number;
  style?: CSSProperties;
}

/** A circular shimmer placeholder (avatars, brand marks, round buttons). */
export function SkelCircle({ size, style }: SkelCircleProps) {
  return (
    <span
      className="gb-skel gb-skel-circle"
      style={{
        display: "block",
        width: size,
        height: size,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

interface SkelBlockProps {
  w?: number | string;
  h?: number | string;
  radius?: number | string;
  style?: CSSProperties;
}

/** A rectangular shimmer block (photos, map previews, buttons). */
export function SkelBlock({ w = "100%", h = 60, radius = 12, style }: SkelBlockProps) {
  return (
    <span
      className="gb-skel"
      style={{
        display: "block",
        width: w,
        height: h,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

/**
 * Mirrors GCardRow (cards.tsx): a 78x78 photo, name + meta lines, and a
 * trailing score pill — laid out to match the real `.gb-card-row` so the list
 * doesn't reflow when the data loads.
 */
export function SkelCardRow() {
  return (
    <div className="gb-card-row" style={{ pointerEvents: "none" }}>
      <SkelBlock w={78} h={78} radius={12} style={{ flexShrink: 0 }} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 7,
          textAlign: "left",
        }}
      >
        <SkelLine w="62%" h={13} />
        <SkelLine w="80%" h={11} />
        <SkelLine w="44%" h={11} />
      </div>
      <SkelBlock w={40} h={22} radius={99} style={{ flexShrink: 0 }} />
    </div>
  );
}

/**
 * Mirrors GCardWide (cards.tsx): the Home meal-rail card — ~150px wide, a
 * 118px photo with top-rounded corners, then name + meta lines.
 */
export function SkelCardWide() {
  return (
    <div
      className="gb-card-wide"
      style={{ pointerEvents: "none", width: 168, flexShrink: 0 }}
    >
      <SkelBlock w="100%" h={118} radius="14px 14px 0 0" />
      <div
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        <SkelLine w="70%" h={13} />
        <SkelLine w="90%" h={11} />
        <SkelLine w="40%" h={11} />
      </div>
    </div>
  );
}
