import { get } from 'svelte/store';
import { location as locationStore, startDate as startDateStore, todayUTC } from './stores/calendar.js';
import { loadCookie, saveCookie, resolveLocation } from './utils/location.js';
import { geoIPLocate } from './utils/google-places.js';

const MAPS_KEY = import.meta.env.GOOGLE_MAPS_API_KEY;

// While true, store changes are driven by the URL (init / back-forward) and must
// not write back to the URL — prevents feedback loops and spurious history entries.
let applying = false;

function parseStart(params: URLSearchParams): Date | null {
  const s = params.get('start');
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseCoords(params: URLSearchParams): { lat: number; lon: number } | null {
  const lat = parseFloat(params.get('lat') ?? '');
  const lon = parseFloat(params.get('lon') ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

function buildSearch(): string {
  const loc = get(locationStore);
  const sd = get(startDateStore);
  const params = new URLSearchParams();
  params.set('lat', loc.lat.toFixed(4));
  params.set('lon', loc.lon.toFixed(4));
  params.set('start', sd.toISOString().slice(0, 10));
  return `?${params.toString()}`;
}

function writeURL(replace: boolean) {
  const url = buildSearch();
  if (replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
}

// Apply a resolved location to the store (and cookie) without writing the URL.
async function applyCoords(lat: number, lon: number) {
  const loc = await resolveLocation(lat, lon);
  applying = true;
  locationStore.set(loc);
  saveCookie(loc);
  applying = false;
}

export function initUrlSync() {
  const params = new URLSearchParams(window.location.search);
  const urlStart = parseStart(params);
  const urlCoords = parseCoords(params);

  applying = true;
  if (urlStart) startDateStore.set(urlStart);

  // Location priority: URL → cookie → GeoIP → store default.
  let pendingAsync = false;
  if (urlCoords) {
    pendingAsync = true;
    resolveLocation(urlCoords.lat, urlCoords.lon).then((loc) => {
      applying = true;
      locationStore.set(loc);
      saveCookie(loc);
      applying = false;
      writeURL(true);
    });
  } else {
    const cookie = loadCookie();
    if (cookie) {
      locationStore.set(cookie);
    } else if (MAPS_KEY) {
      pendingAsync = true;
      geoIPLocate(MAPS_KEY)
        .then((r) => (r ? applyCoords(r.lat, r.lon) : undefined))
        .catch(() => undefined)
        .finally(() => writeURL(true));
    }
  }
  applying = false;

  // Canonicalise the URL from whatever synchronous state we have (no history
  // entry). When an async location load is pending, defer to its completion so
  // we don't briefly clobber URL coords with the store default.
  if (!pendingAsync) writeURL(true);

  // Store → URL. Suppress the immediate subscription callbacks so they don't push.
  applying = true;
  const onChange = () => { if (!applying) writeURL(false); };
  locationStore.subscribe(onChange);
  startDateStore.subscribe(onChange);
  applying = false;

  // URL → store on back/forward. The browser has already changed the URL, so we
  // only update the stores (no URL write).
  window.addEventListener('popstate', () => {
    const p = new URLSearchParams(window.location.search);
    applying = true;
    const s = parseStart(p);
    if (s) startDateStore.set(s);
    const c = parseCoords(p);
    if (c) {
      // resolve async; applyCoords manages the applying flag around its set
      applying = false;
      applyCoords(c.lat, c.lon);
    } else {
      applying = false;
    }
  });
}
