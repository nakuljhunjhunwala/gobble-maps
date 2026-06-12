import type { CSSProperties } from "react";

// Server-safe presentational skeleton atoms for the admin panel.
// All shimmer comes from the shared `gb-skel` primitive in globals.css —
// no new keyframes. Compose with inline width/height/borderRadius so the
// placeholders occupy the same space as the real components (no layout shift).

export interface AdSkelLineProps {
  width?: number | string;
  height?: number | string;
  /** Override the default text radius (6px). */
  radius?: number | string;
  style?: CSSProperties;
}

// A single shimmer line, defaulting to the `gb-skel-text` height/radius.
export function AdSkelLine({ width = "100%", height, radius, style }: AdSkelLineProps) {
  return (
    <span
      className="gb-skel gb-skel-text"
      style={{
        display: "block",
        width,
        ...(height !== undefined ? { height } : null),
        ...(radius !== undefined ? { borderRadius: radius } : null),
        ...style,
      }}
    />
  );
}

// Mirrors src/components/admin/stat-card.tsx: label line + big value line +
// hint line inside an ad-card.ad-stat.
export function AdSkelStatCard() {
  return (
    <div className="ad-card ad-stat">
      <AdSkelLine width={72} height={11} />
      <AdSkelLine width={64} height={26} radius={8} style={{ margin: "4px 0 2px" }} />
      <AdSkelLine width={48} height={10} />
    </div>
  );
}

export interface AdSkelRowProps {
  /** Render the leading thumb as a circle (e.g. user avatar) instead of a square. */
  circle?: boolean;
  /** Size of the leading thumb square/circle (px). */
  thumbSize?: number;
  /** Border radius of a square thumb (ignored when `circle`). */
  thumbRadius?: number;
  /** Number of trailing badge placeholder blocks. */
  badges?: number;
  /** Number of trailing action square placeholders. */
  actions?: number;
  style?: CSSProperties;
}

// Mirrors src/components/admin/data-row.tsx: leading thumb + two text lines +
// trailing badge blocks + action squares, in an ad-row shell.
export function AdSkelRow({
  circle = false,
  thumbSize = 46,
  thumbRadius = 11,
  badges = 2,
  actions = 2,
  style,
}: AdSkelRowProps) {
  return (
    <div className="ad-row" style={style}>
      <span
        className={circle ? "gb-skel gb-skel-circle" : "gb-skel"}
        style={{
          width: thumbSize,
          height: thumbSize,
          borderRadius: circle ? 9999 : thumbRadius,
          flexShrink: 0,
        }}
      />
      <div className="ad-row-main">
        <AdSkelLine width="42%" height={13} style={{ marginBottom: 6 }} />
        <AdSkelLine width="64%" height={11} />
      </div>
      {badges > 0 && (
        <div className="ad-row-badges">
          {Array.from({ length: badges }).map((_, i) => (
            <span
              key={i}
              className="gb-skel"
              style={{ width: 58, height: 19, borderRadius: 999 }}
            />
          ))}
        </div>
      )}
      {actions > 0 && (
        <div className="ad-row-actions">
          {Array.from({ length: actions }).map((_, i) => (
            <span
              key={i}
              className="gb-skel"
              style={{ width: 28, height: 28, borderRadius: 9 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export interface AdSkelCardProps {
  /** Inner content height (px) — used to occupy the same space as charts/lists. */
  height?: number;
  /** Render the inner shimmer fill (default true). Set false to compose children. */
  fill?: boolean;
  /** Optional card title placeholder line above the fill. */
  title?: boolean;
  children?: React.ReactNode;
  style?: CSSProperties;
}

// Generic ad-card with a shimmer fill block sized via `height`.
export function AdSkelCard({
  height = 180,
  fill = true,
  title = false,
  children,
  style,
}: AdSkelCardProps) {
  return (
    <div className="ad-card" style={style}>
      {title && <AdSkelLine width={140} height={12} style={{ marginBottom: 12 }} />}
      {children}
      {fill && (
        <span
          className="gb-skel"
          style={{ display: "block", width: "100%", height, borderRadius: 10 }}
        />
      )}
    </div>
  );
}
