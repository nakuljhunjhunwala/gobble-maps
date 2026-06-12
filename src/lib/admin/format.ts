// Pure display helpers, safe to import from BOTH server and client
// components (no next/headers / supabase server dependencies).
import { DAY_KEYS, type HoursJson } from "@/lib/types";

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** '2026-01-12T...' → '12 Jan 2026' (prototype date style). */
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

/** 'Today' / 'Yesterday' / 'N days ago' / '1 week ago' / 'N weeks ago'. */
export function relativeLastActive(iso: string | null): string {
  if (!iso) return "Never";
  const then = new Date(iso);
  const now = new Date();
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.max(
    0,
    Math.round((startOf(now) - startOf(then)) / (24 * 60 * 60 * 1000))
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

/** Public URL for a place-photos storage path. */
export function photoUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/place-photos/${storagePath}`;
}

const DAY_LABELS: Record<(typeof DAY_KEYS)[number], string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

/** '23:30' → '11:30 PM' (handles past-midnight closes like '01:30'). */
function to12h(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr} ${suffix}`;
}

/**
 * Hours jsonb → compact display lines, grouping consecutive days with
 * identical ranges: ['Mon – Sun · 12:00 PM – 11:30 PM']. Closed days
 * are omitted (matching the prototype's hoursText).
 */
export function hoursToText(hours: HoursJson | null): string[] {
  if (!hours) return [];
  const groups: { start: number; end: number; range: string }[] = [];

  DAY_KEYS.forEach((day, i) => {
    const slot = hours[day];
    if (!slot) return;
    const range = `${to12h(slot.open)} – ${to12h(slot.close)}`;
    const last = groups[groups.length - 1];
    if (last && last.end === i - 1 && last.range === range) {
      last.end = i;
    } else {
      groups.push({ start: i, end: i, range });
    }
  });

  return groups.map((g) => {
    const label =
      g.start === g.end
        ? DAY_LABELS[DAY_KEYS[g.start]]
        : `${DAY_LABELS[DAY_KEYS[g.start]]} – ${DAY_LABELS[DAY_KEYS[g.end]]}`;
    return `${label} · ${g.range}`;
  });
}
