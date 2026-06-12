"use client";
// Gobble Maps consumer — shared atoms, ported from design/gobble/components.jsx
// (GBudget, GScorePill, GVisitedBadge, GOpenDot, GSectionTitle) and
// design/gobble/screens-main.jsx (GOfflineBanner). The file is a client module
// because GOfflineBanner needs online/offline listeners; the other atoms are
// pure presentational and safe to render anywhere.
import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

/** Budget as 1–5 stars (₹ scale), filled in accent blue. */
export function GBudget({ n, size = 11 }: { n: number; size?: number }) {
  return (
    <span
      style={{ display: "inline-flex", gap: 1, alignItems: "center" }}
      title={`Budget ${n}/5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          strokeWidth={1.6}
          fill={i <= n ? "var(--gb-sky-deep)" : "none"}
          color={i <= n ? "var(--gb-sky-deep)" : "var(--gb-line)"}
        />
      ))}
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
  return visited ? (
    <span className={"gb-badge gb-badge-visited" + (small ? " gb-badge-sm" : "")}>
      <Icon name="check" size={small ? 10 : 12} strokeWidth={2.6} />{" "}
      {small ? "Visited" : "Personally visited"}
    </span>
  ) : (
    <span
      className={"gb-badge gb-badge-unvisited" + (small ? " gb-badge-sm" : "")}
    >
      <Icon name="info" size={small ? 10 : 12} strokeWidth={2} />{" "}
      {small ? "Not yet visited" : "Not yet visited by curator"}
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
