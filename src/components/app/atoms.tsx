"use client";
// Gobble Maps consumer — shared atoms, ported from design/gobble/components.jsx
// (GBudget, GScorePill, GVisitedBadge, GOpenDot, GSectionTitle) and
// design/gobble/screens-main.jsx (GOfflineBanner). The file is a client module
// because GOfflineBanner needs online/offline listeners; the other atoms are
// pure presentational and safe to render anywhere.
import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

/**
 * Budget as ₹ symbols (price tier, 1–5). Rendered as text — NOT stars — so it
 * is never confused with the star rating.
 */
export function GBudget({ n, size = 11 }: { n: number; size?: number }) {
  const tier = Math.max(1, Math.min(5, Math.round(n)));
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: size + 2,
        fontWeight: 800,
        letterSpacing: 0.5,
        lineHeight: 1,
        color: "var(--gb-sky-deep)",
      }}
      title={`Budget ${tier}/5`}
      aria-label={`Budget ${tier} of 5`}
    >
      <span>{"₹".repeat(tier)}</span>
      <span style={{ color: "var(--gb-line)" }}>{"₹".repeat(5 - tier)}</span>
    </span>
  );
}

export function GScorePill({
  score,
  small = false,
}: {
  score: number | null;
  small?: boolean;
}) {
  if (score == null) return null;
  return (
    <span
      className="gb-score"
      style={small ? { fontSize: 11, padding: "2px 7px" } : undefined}
    >
      <Icon
        name="star"
        size={small ? 10 : 12}
        fill="#fff"
        color="#fff"
        strokeWidth={1.8}
      />{" "}
      {score}
    </span>
  );
}

export function GVisitedBadge({
  visited,
  small = false,
}: {
  visited: boolean;
  small?: boolean;
}) {
  // Only the positive badge is shown; unvisited places display nothing
  // (no "not yet visited" caution).
  if (!visited) return null;
  return (
    <span className={"gb-badge gb-badge-visited" + (small ? " gb-badge-sm" : "")}>
      <Icon name="check" size={small ? 10 : 12} strokeWidth={2.6} />{" "}
      {small ? "Visited" : "Personally visited"}
    </span>
  );
}

/** Open/closed dot + label. Pass the precomputed open-now flag. */
export function GOpenDot({ open }: { open: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11.5,
        fontWeight: 700,
        color: open ? "#15803D" : "#B4514B",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 99,
          background: "currentColor",
        }}
      ></span>
      {open ? "Open now" : "Closed"}
    </span>
  );
}

export function GSectionTitle({
  title,
  sub,
  action = null,
}: {
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        padding: "0 18px",
        gap: 12,
      }}
    >
      <div>
        <h2 className="gb-h2">{title}</h2>
        {sub && <p className="gb-sub">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Offline banner (FR-16) ───────────────────────────────────
function subscribeOnline(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function GOfflineBanner() {
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );
  if (online) return null;
  return (
    <div className="gb-offline">
      <Icon name="offline" size={14} strokeWidth={2} />{" "}
      {"You're offline. Some content may not load."}
    </div>
  );
}
