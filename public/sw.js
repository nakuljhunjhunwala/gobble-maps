/* Gobble Maps service worker (hand-rolled, plain JS — NOT TypeScript).
 *
 * Offline strategy (everything that CAN work offline does):
 *  - static:  /_next/static/* + icons + manifest -> cache-first (immutable,
 *             content-hashed). This is what keeps the app STYLED offline.
 *  - photos:  Supabase public images -> cache-first (incl. opaque responses).
 *  - tiles:   CARTO/OSM basemap tiles -> cache-first (incl. opaque).
 *  - data:    /api/places-light       -> stale-while-revalidate (pin layer).
 *  - rsc:     ?_rsc / RSC navigations  -> network-first, cache fallback.
 *  - pages:   navigations              -> network-first, cache the page, then
 *             fall back to the cached SAME url, then the cached "/" shell.
 *  - rest:    passthrough.
 *
 * Cross-origin photos/tiles come back as OPAQUE responses (status 0, ok=false);
 * we deliberately cache those too, otherwise images/maps never persist offline.
 *
 * NEVER caches: POST (or any non-GET), /api/geocode, Supabase REST/auth calls.
 *
 * Bump SW_VERSION on every release so all cache names change and the activate
 * handler purges the previous deploy's caches.
 */

const SW_VERSION = "v3";

const STATIC_CACHE = `gb-static-${SW_VERSION}`;
const PAGES_CACHE = `gb-pages-${SW_VERSION}`;
const SHELL_CACHE = `gb-shell-${SW_VERSION}`;
const TILES_CACHE = `gb-tiles-${SW_VERSION}`;
const PHOTOS_CACHE = `gb-photos-${SW_VERSION}`;
const DATA_CACHE = `gb-data-${SW_VERSION}`;

const CURRENT_CACHES = [
  STATIC_CACHE,
  PAGES_CACHE,
  SHELL_CACHE,
  TILES_CACHE,
  PHOTOS_CACHE,
  DATA_CACHE,
];

// Shell routes worth having available offline from a cold start.
const SHELL_PRECACHE = ["/", "/map", "/search", "/profile", "/api/places-light"];

const STATIC_MAX = 400;
const PAGES_MAX = 60;
const TILES_MAX = 250;
const PHOTOS_MAX = 200;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        // Per-entry so one failed request can't block activation.
        Promise.allSettled(SHELL_PRECACHE.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !CURRENT_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// A response is cacheable if it succeeded OR it's an opaque cross-origin
// response (status 0) — opaque covers no-cors images/tiles, which we DO want
// to keep for offline even though we can't inspect them.
function isCacheable(response) {
  return !!response && (response.ok || response.type === "opaque");
}

// LRU: after putting, trim the cache to `max` entries (keys() = insertion order).
async function putWithLimit(cacheName, request, response, max) {
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  const keys = await cache.keys();
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
  }
}

async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      putWithLimit(cacheName, request, response.clone(), max);
    }
    return response;
  } catch (err) {
    // Offline and not cached — nothing we can do for this asset.
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (isCacheable(response)) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

// Network-first: try the network, cache a good response, and on failure fall
// back to the cached same-url, then (for navigations) the cached "/" shell.
async function networkFirst(request, cacheName, { shellFallback = false } = {}) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      putWithLimit(cacheName, request, response.clone(), PAGES_MAX);
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (shellFallback) {
      const shell = await caches.open(SHELL_CACHE);
      const home = await shell.match("/");
      if (home) return home;
    }
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  const host = url.hostname;
  const path = url.pathname;
  const sameOrigin = url.origin === self.location.origin;

  // Never cache the geocode proxy.
  if (path.startsWith("/api/geocode")) return;

  // Supabase: cache public photos; passthrough REST/auth/realtime.
  if (host.endsWith("supabase.co")) {
    if (path.includes("/storage/v1/object/public/")) {
      event.respondWith(cacheFirst(request, PHOTOS_CACHE, PHOTOS_MAX));
    }
    return;
  }

  // Basemap raster tiles -> cache-first (now caches opaque too).
  if (host.endsWith("basemaps.cartocdn.com") || host.endsWith("tile.openstreetmap.org")) {
    event.respondWith(cacheFirst(request, TILES_CACHE, TILES_MAX));
    return;
  }

  if (!sameOrigin) return; // other cross-origin: passthrough

  // Immutable build assets + icons/manifest -> cache-first. Keeps CSS/JS/fonts
  // available offline so the app renders styled and interactive.
  if (
    path.startsWith("/_next/static/") ||
    path.startsWith("/icons/") ||
    path === "/manifest.webmanifest" ||
    path === "/favicon.ico"
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, STATIC_MAX));
    return;
  }

  // Offline pin layer.
  if (path === "/api/places-light") {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }

  // RSC payloads (client-side navigation data) -> network-first, cache fallback.
  if (url.search.includes("_rsc") || request.headers.get("RSC") === "1") {
    event.respondWith(networkFirst(request, PAGES_CACHE));
    return;
  }

  // Full page navigations -> network-first, cache, fall back to page then shell.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES_CACHE, { shellFallback: true }));
    return;
  }

  // Everything else (other same-origin GETs): passthrough.
});
