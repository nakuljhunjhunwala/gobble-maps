// Shared, pure coordinate extraction for Google-Maps-style links and raw
// lat/lng text. Used by the admin place editor (client) and the
// resolve-location route (server) — single source, no duplication.

export interface LatLng {
  lat: number;
  lng: number;
}

function valid(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    // Reject (0,0) — almost always a parse artifact, never a real place here.
    !(lat === 0 && lng === 0)
  );
}

/**
 * Pull a lat/lng out of free text: a full Google Maps URL, a Maps query
 * param, or a plain "lat, lng" pair. Returns null when nothing parses.
 * Patterns (first match wins):
 *   @lat,lng                     — /maps/place/.../@19.07,72.87,15z
 *   !3dlat!4dlng                 — embed / data= URLs
 *   q= / query= / ll= / sll= / center= / daddr= / destination= = lat,lng
 *   plain "lat, lng"
 */
export function extractCoords(text: string): LatLng | null {
  if (!text) return null;

  const at = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) {
    const lat = Number(at[1]);
    const lng = Number(at[2]);
    if (valid(lat, lng)) return { lat, lng };
  }

  const bang = text.match(/!3d(-?\d+(?:\.\d+)?).*?!4d(-?\d+(?:\.\d+)?)/);
  if (bang) {
    const lat = Number(bang[1]);
    const lng = Number(bang[2]);
    if (valid(lat, lng)) return { lat, lng };
  }

  // q=/query=/ll=/sll=/center=/daddr=/destination=/loc: = lat,lng
  const param = text.match(
    /(?:[?&](?:q|query|ll|sll|center|daddr|destination)=|loc:)(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i
  );
  if (param) {
    const lat = Number(param[1]);
    const lng = Number(param[2]);
    if (valid(lat, lng)) return { lat, lng };
  }

  const plain = text.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (plain) {
    const lat = Number(plain[1]);
    const lng = Number(plain[2]);
    if (valid(lat, lng)) return { lat, lng };
  }

  return null;
}

/** Strip a leading Open Location Code (plus code) token, e.g.
 *  "8G9M+MRR Hotel Park, Doha" → "Hotel Park, Doha". Geocoders choke on the
 *  raw plus code but resolve the readable name fine. */
function stripPlusCode(name: string): string {
  return name
    .replace(/^\s*[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{0,3}\s*,?\s*/i, "")
    .trim();
}

/** Best-effort place name from a Maps URL (/maps/place/<name> or q=<name>). */
export function extractPlaceName(text: string): string | null {
  const place = text.match(/\/maps\/place\/([^/@]+)/);
  if (place) {
    const name = stripPlusCode(decodeURIComponent(place[1].replace(/\+/g, " ")).trim());
    return name || null;
  }
  const q = text.match(/[?&]q=([^&]+)/);
  if (q) {
    const raw = decodeURIComponent(q[1].replace(/\+/g, " ")).trim();
    // Skip when q was actually coordinates (handled by extractCoords).
    if (raw && !/^-?\d+(\.\d+)?,/.test(raw)) {
      return stripPlusCode(raw) || raw;
    }
  }
  return null;
}
