// Gobble Maps consumer — pure, client-safe time helpers.
// Ports gobbleIsOpen / gobbleHomeSection from design/gobble/data.js,
// adapted from the prototype's decimal open/close to the DB hours jsonb
// shape: {"mon":{"open":"12:30","close":"23:30"},"tue":null,...}.

import type { DayKey, HoursJson, MealSlot } from "@/lib/types";

/** date.getDay() (0=Sun … 6=Sat) → hours jsonb day key. */
const DAY_KEY_BY_GETDAY: DayKey[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

/** Intl short weekday → date.getDay() index (0=Sun … 6=Sat). */
const GETDAY_BY_WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

// Gobble is Mumbai-only (PRD): always read wall-clock parts in IST so server
// (often UTC) and client compute identical values from the same instant —
// fixing first-paint correctness and the React hydration mismatch.
const IST_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Kolkata",
  hour12: false,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface IstParts {
  /** 0=Sun … 6=Sat, matching date.getDay(). */
  day: number;
  hour: number;
  minute: number;
}

/** IST wall-clock parts of `date` (timezone-stable across server/client). */
function istParts(date: Date): IstParts {
  const parts = IST_FORMAT.formatToParts(date);
  let weekday = "Sun";
  let hour = 0;
  let minute = 0;
  for (const p of parts) {
    if (p.type === "weekday") weekday = p.value;
    else if (p.type === "hour") hour = Number(p.value);
    else if (p.type === "minute") minute = Number(p.value);
  }
  // Intl can emit "24" for midnight under hour12:false; normalise to 0.
  if (hour === 24) hour = 0;
  return { day: GETDAY_BY_WEEKDAY[weekday] ?? 0, hour, minute };
}

/** "HH:MM" → 24h decimal (e.g. "12:30" → 12.5). */
function toDecimal(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

/**
 * Open-now check ported from gobbleIsOpen. Hours null (or null for the
 * day) = closed. close <= open means the closing time spills past
 * midnight into the next day (e.g. 20:00–03:00).
 */
export function isOpenNow(
  hours: HoursJson | null,
  date: Date = new Date()
): boolean {
  if (!hours) return false;
  const parts = istParts(date);
  const today = hours[DAY_KEY_BY_GETDAY[parts.day]];
  if (!today) return false;

  const h = parts.hour + parts.minute / 60;
  const open = toDecimal(today.open);
  const close = toDecimal(today.close);

  // open === close is not a real 24h venue in the seed/editor; treat as closed
  // (otherwise the past-midnight branch below becomes an always-open tautology).
  if (open === close) return false;
  if (close < open) return h >= open || h < close; // past-midnight close
  return h >= open && h < close;
}

/** Prototype GOpenDot copy: 'Open now' / 'Closed'. */
export function openLabel(
  hours: HoursJson | null,
  date: Date = new Date()
): "Open now" | "Closed" {
  return isOpenNow(hours, date) ? "Open now" : "Closed";
}

export interface HomeSection {
  key: MealSlot | "explore";
  title: string;
  sub: string;
}

/**
 * FR-1 / gobbleHomeSection port. Weekend = Fri–Sun per PRD.
 * Mon–Thu: breakfast 7:00–10:59 / lunch 11:00–14:59 / dinner 19:00+.
 * Fri–Sun: brunch 10:00–14:59 / party 21:00+. Else 'Explore Mumbai'.
 */
export function homeSections(date: Date = new Date()): HomeSection {
  const parts = istParts(date);
  const day = parts.day; // 0 Sun … 6 Sat
  const weekend = day === 5 || day === 6 || day === 0; // Fri–Sun per PRD
  const hour = parts.hour + parts.minute / 60;

  if (!weekend) {
    if (hour >= 7 && hour < 11)
      return {
        key: "breakfast",
        title: "Breakfast, sorted",
        sub: "Open right now for the first meal",
      };
    if (hour >= 11 && hour < 15)
      return {
        key: "lunch",
        title: "Lunch break",
        sub: "Where to go in the next hour",
      };
    if (hour >= 19)
      return {
        key: "dinner",
        title: "Dinner tonight",
        sub: "Curated tables for this evening",
      };
  } else {
    if (hour >= 10 && hour < 15)
      return {
        key: "brunch",
        title: "Weekend brunch",
        sub: "Slow mornings, long tables",
      };
    if (hour >= 21)
      return {
        key: "party",
        title: "Tonight, out out",
        sub: "Dinner & party picks for the weekend",
      };
  }
  return {
    key: "explore",
    title: "Explore Mumbai",
    sub: "Every place, personally vetted",
  };
}

/** Prototype time label, e.g. "Tuesday, 8:00 PM" (shown next to section sub). */
export function timeLabel(date: Date = new Date()): string {
  return (
    date.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
    }) +
    ", " +
    date.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
    })
  );
}
