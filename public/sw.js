/* Gobble Maps service worker (hand-rolled, plain JS — NOT TypeScript).
 *
 * Caching strategy:
 *  - shell:  precache "/" + "/api/places-light" on install (offline pin layer).
 *  - tiles:  OSM raster tiles      -> cache-first, LRU cap ~200.
 *  - photos: Supabase public photos -> cache-first, LRU cap 150.
 *  - data:   /api/places-light      -> stale-while-revalidate.
 *  - pages:  navigations            -> network-first, fallback to cached "/".
 *  - rest:   passthrough.
 *
 * NEVER caches: POST (or any non-GET), /api/geocode, Supabase REST/auth calls.
 */

// Bump SW_VERSION on EVERY release so all cache names change — this is what
// lets the activate handler purge the previous deploy's caches (including the
// stale precached "/"). Forgetting to bump means "/" goes stale across deploys.
const SW_VERSION = "v1";

const SHELL_CACHE = `gb-shell-${SW_VERSION}`;
const TILES_CACHE = `gb-tiles-${SW_VERSION}`;
const PHOTOS_CACHE = `gb-photos-${SW_VERSION}`;
const DATA_CACHE = `gb-data-${SW_VERSION}`;

const CURRENT_CACHES = [SHELL_CACHE, TILES_CACHE, PHOTOS_CACHE, DATA_CACHE];

const SHELL_PRECACHE = ["/", "/api/places-light"];

const TILES_MAX = 200;
const PHOTOS_MAX = 150;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        // Cache each entry independently — a single failed request must not
        // reject the whole install (which would block the SW from activating).
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

// Simple LRU: after putting, if the cache exceeds `max` entries, delete the
// oldest (keys() returns insertion order).
async function putWithLimit(cacheName, request, response, max) {
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  const keys = await cache.keys();
  if (keys.length > max) {
    await cache.delete(keys[0]);
  }
}

async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    // Clone before the body is consumed by the caller.
    putWithLimit(cacheName, request, response.clone(), max);
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch (err) {
    const cache = await caches.open(SHELL_CACHE);
    const fallback = await cache.match("/");
    if (fallback) return fallback;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only ever touch GET requests — never cache POST/PUT/etc.
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }

  const host = url.hostname;
  const path = url.pathname;

  // Never cache the geocode proxy or Supabase REST/auth traffic.
  if (path.startsWith("/api/geocode")) return;
  if (host.endsWith("supabase.co")) {
    const isPublicPhoto = path.includes("/storage/v1/object/public/");
    if (!isPublicPhoto) {
      // REST (/rest/v1), auth (/auth/v1), realtime, etc. — passthrough.
      return;
    }
    // Public storage photos: cache-first.
    event.respondWith(cacheFirst(request, PHOTOS_CACHE, PHOTOS_MAX));
    return;
  }

  // OSM raster tiles: cache-first with LRU cap.
  if (host.endsWith("tile.openstreetmap.org")) {
    event.respondWith(cacheFirst(request, TILES_CACHE, TILES_MAX));
    return;
  }

  // Offline pin layer: stale-while-revalidate.
  if (path === "/api/places-light") {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }

  // Page navigations: network-first, fall back to cached "/".
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Everything else: passthrough (no respondWith).
});
