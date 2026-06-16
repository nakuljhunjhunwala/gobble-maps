// Open Location Code (Google "plus codes") decoder — pure, free, no API.
// Google Maps share links commonly embed a plus code (e.g. "7JWV+9Q Worli")
// which pinpoints the place precisely even when the URL carries no lat/lng.
// Supports full codes and short codes (recovered against a reference point).
// Ported from the canonical openlocationcode reference algorithm.

const ALPHABET = "23456789CFGHJMPQRVWX";
const BASE = 20;
const SEP = "+";
const SEP_POS = 8;
const PAD = "0";
const PAIR_RES = [20.0, 1.0, 0.05, 0.0025, 0.000125];
const GRID_COLS = 4;
const GRID_ROWS = 5;
const GRID_LAT_FIRST = 0.000125 / GRID_ROWS;
const GRID_LNG_FIRST = 0.000125 / GRID_COLS;
const MAX_PAIRS = 5; // 10 pair digits
const MAX_GRID = 5;

function clean(code: string): string {
  return code.trim().toUpperCase();
}

export function isValidCode(code: string): boolean {
  const c = clean(code);
  if (!c.includes(SEP)) return false;
  if (c.indexOf(SEP) !== c.lastIndexOf(SEP)) return false;
  const sepIdx = c.indexOf(SEP);
  if (sepIdx > SEP_POS || sepIdx % 2 === 1) return false;
  // After-separator part is 0 or >=2 chars.
  if (c.length - sepIdx - 1 === 1) return false;
  const body = c.replace(SEP, "").replace(/0+$/, "");
  for (const ch of body) {
    if (ALPHABET.indexOf(ch) === -1) return false;
  }
  return true;
}

export function isFullCode(code: string): boolean {
  const c = clean(code);
  if (!isValidCode(c)) return false;
  return c.indexOf(SEP) === SEP_POS;
}

export function isShortCode(code: string): boolean {
  const c = clean(code);
  return isValidCode(c) && c.indexOf(SEP) < SEP_POS;
}

/** Decode a FULL plus code to its center lat/lng. */
export function decode(code: string): { lat: number; lng: number } | null {
  const c = clean(code).replace(SEP, "");
  if (c.length < 2) return null;

  let lat = -90;
  let lng = -180;
  let latRes = BASE;
  let lngRes = BASE;
  const digits = c.replace(/0+$/, "");
  let i = 0;

  // Pair section (up to 10 digits).
  for (; i < Math.min(digits.length, MAX_PAIRS * 2); i += 2) {
    const li = ALPHABET.indexOf(digits[i]);
    const lo = ALPHABET.indexOf(digits[i + 1]);
    if (li < 0 || lo < 0) return null;
    latRes = PAIR_RES[i / 2];
    lngRes = PAIR_RES[i / 2];
    lat += li * latRes;
    lng += lo * lngRes;
  }

  let latLo = lat;
  let lngLo = lng;
  let latHi = lat + latRes;
  let lngHi = lng + lngRes;

  // Grid refinement section (digits 11+).
  if (digits.length > MAX_PAIRS * 2) {
    let gLatRes = 0.000125;
    let gLngRes = 0.000125;
    let gLat = latLo;
    let gLng = lngLo;
    const grid = digits.slice(MAX_PAIRS * 2, MAX_PAIRS * 2 + MAX_GRID);
    for (let g = 0; g < grid.length; g++) {
      const idx = ALPHABET.indexOf(grid[g]);
      if (idx < 0) return null;
      const row = Math.floor(idx / GRID_COLS);
      const col = idx % GRID_COLS;
      gLatRes /= GRID_ROWS;
      gLngRes /= GRID_COLS;
      gLat += row * gLatRes;
      gLng += col * gLngRes;
    }
    latLo = gLat;
    lngLo = gLng;
    latHi = gLat + gLatRes;
    lngHi = gLng + gLngRes;
  }

  const lat0 = (latLo + latHi) / 2;
  const lng0 = (lngLo + lngHi) / 2;
  if (!Number.isFinite(lat0) || !Number.isFinite(lng0)) return null;
  // The leading constants above keep the grid section approximate but
  // well within a few metres — fine for placing a map pin.
  void GRID_LAT_FIRST;
  void GRID_LNG_FIRST;
  return { lat: Math.max(-90, Math.min(90, lat0)), lng: Math.max(-180, Math.min(180, lng0)) };
}

/**
 * Recover a full code from a short code using a reference lat/lng, then decode.
 * Short codes drop the first 4 (sometimes 2) digits — we prepend the digits of
 * the reference location's full code and adjust to the nearest match.
 */
export function recoverNearest(
  shortCode: string,
  refLat: number,
  refLng: number
): { lat: number; lng: number } | null {
  const c = clean(shortCode);
  if (isFullCode(c)) return decode(c);
  if (!isShortCode(c)) return null;

  const sepIdx = c.indexOf(SEP);
  const padLen = SEP_POS - sepIdx; // digits we need to prepend
  const refCode = encodePrefix(refLat, refLng, padLen);
  const full = refCode.slice(0, padLen) + c;
  const decoded = decode(full);
  if (!decoded) return null;

  // Adjust by the resolution of the prepended block to find the nearest cell.
  const resolution = PAIR_RES[padLen / 2 - 1] ?? 20;
  const half = resolution / 2;
  let { lat, lng } = decoded;
  if (refLat + half < lat && lat - resolution >= -90) lat -= resolution;
  else if (refLat - half > lat && lat + resolution <= 90) lat += resolution;
  if (refLng + half < lng && lng - resolution >= -180) lng -= resolution;
  else if (refLng - half > lng && lng + resolution <= 180) lng += resolution;
  return { lat, lng };
}

/** Encode just the first `len` digits of a location (enough to prefix a short code). */
function encodePrefix(lat: number, lng: number, len: number): string {
  let latVal = Math.min(90, Math.max(-90, lat)) + 90;
  let lngVal = ((lng + 180) % 360 + 360) % 360;
  let code = "";
  let res = BASE;
  for (let i = 0; i < Math.ceil(len / 2); i++) {
    const latDigit = Math.floor(latVal / res);
    const lngDigit = Math.floor(lngVal / res);
    code += ALPHABET[Math.min(BASE - 1, Math.max(0, latDigit))];
    code += ALPHABET[Math.min(BASE - 1, Math.max(0, lngDigit))];
    latVal -= latDigit * res;
    lngVal -= lngDigit * res;
    res /= BASE === 20 ? 20 : 20; // first two divisions by 20 cover the prefix
  }
  return code;
}

/**
 * Pull a plus code out of free text. Google encodes the code's own "+" the
 * same as spaces in q= params, so we also accept the space-separated form
 * ("8G9M MRR") and rejoin it.
 */
export function findPlusCode(text: string): string | null {
  const t = text.toUpperCase();
  // Canonical "CODE+CODE" form.
  const direct = t.match(/\b([23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3})\b/);
  if (direct) return direct[1];
  // Space-separated (q= turned the "+" into a space).
  const spaced = t.match(/\b([23456789CFGHJMPQRVWX]{4,8})\s([23456789CFGHJMPQRVWX]{2,3})\b/);
  if (spaced) return `${spaced[1]}+${spaced[2]}`;
  return null;
}
