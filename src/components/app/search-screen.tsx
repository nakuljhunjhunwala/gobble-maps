"use client";
// Gobble Maps consumer — Search screen, ported from GSearchScreen in
// design/gobble/screens-main.jsx. Replaces the prototype's in-memory
// GOBBLE_PLACES.filter() with the searchAction server action (debounced),
// which surfaces published matches plus permanently-closed matches flagged
// `permanentlyClosed: true`. Fires logEvent('search') for queries >= 3 chars.

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { GCardRow, toCardData } from "@/components/app/cards";
import { GOfflineBanner } from "@/components/app/atoms";
import { useUser } from "@/components/app/providers";
import { searchAction } from "@/app/(app)/search/actions";
import { logEvent } from "@/lib/consumer/analytics";
import type { ConsumerPlace } from "@/lib/consumer/types";

const SUGGESTIONS = [
  "Japanese",
  "Bandra West",
  "Romantic",
  "Dosa cart",
  "Brewery",
  "Work Friendly",
];

export function SearchScreen() {
  const { been } = useUser();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ConsumerPlace[]>([]);
  // Whether a search for the current query has resolved — avoids flashing the
  // "No places found." empty state before the debounced request returns.
  const [resolved, setResolved] = useState(false);
  const query = q.trim().toLowerCase();

  // Token guards against out-of-order async responses overwriting newer ones.
  const reqToken = useRef(0);

  useEffect(() => {
    const token = ++reqToken.current;
    if (!query) {
      // Defer the reset out of the effect body to avoid synchronous setState
      // cascading renders; the token guard still discards superseded runs.
      const handle = setTimeout(() => {
        if (reqToken.current === token) {
          setResults([]);
          setResolved(false);
        }
      }, 0);
      return () => clearTimeout(handle);
    }
    const handle = setTimeout(async () => {
      // Mark unresolved at run start (not synchronously in the effect body) so
      // the empty-state doesn't flash for the new query before results return.
      if (reqToken.current === token) setResolved(false);
      const found = await searchAction(query);
      if (reqToken.current === token) {
        setResults(found);
        setResolved(true);
        if (query.length >= 3) void logEvent("search", null, { q: query });
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const now = new Date();

  return (
    <div className="gb-screen" data-screen-label="Search">
      <GOfflineBanner />
      <div style={{ padding: "10px 18px 4px" }}>
        <h2 className="gb-h2" style={{ fontSize: 24 }}>
          Search
        </h2>
        <div className="gb-searchbar" style={{ marginTop: 10, cursor: "text" }}>
          <Icon name="search" size={16} color="var(--gb-mut)" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Place, cuisine, area or keyword…"
            style={{
              border: "none",
              outline: "none",
              background: "none",
              font: "inherit",
              color: "var(--gb-ink)",
              width: "100%",
            }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                padding: 2,
              }}
            >
              <Icon name="x" size={15} color="var(--gb-mut)" strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>

      {!query && (
        <div style={{ padding: "16px 18px" }}>
          <p className="gb-sub" style={{ marginBottom: 10 }}>
            Try searching for
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} className="gb-chip" onClick={() => setQ(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {query && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "14px 18px 24px",
          }}
        >
          {results.map((p) => (
            <GCardRow
              key={p.id}
              place={toCardData(p, now)}
              been={been.has(p.id)}
              closedNote={true}
            />
          ))}
          {resolved && results.length === 0 && (
            <div
              className="gb-empty"
              style={{ textAlign: "center", padding: "40px 20px" }}
            >
              <Icon
                name="search"
                size={28}
                color="var(--gb-line)"
                style={{ margin: "0 auto 10px" }}
              />
              No places found. Try a different search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
