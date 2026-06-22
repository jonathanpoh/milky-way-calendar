import tzlookup from 'tz-lookup';
import type { Location } from '../../core/types.js';

const COOKIE_NAME = 'mwcal_location';

export function saveCookie(loc: Location) {
  const value = encodeURIComponent(JSON.stringify({
    lat: loc.lat, lon: loc.lon, name: loc.name, timezone: loc.timezone,
  }));
  document.cookie = `${COOKIE_NAME}=${value}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
}

export function loadCookie(): Location | null {
  const match = document.cookie.split('; ').find(r => r.startsWith(COOKIE_NAME + '='));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
    if (!parsed || typeof parsed !== 'object') return null;
    if (
      typeof parsed.lat !== 'number' || !Number.isFinite(parsed.lat) ||
      typeof parsed.lon !== 'number' || !Number.isFinite(parsed.lon) ||
      parsed.lat < -90 || parsed.lat > 90 ||
      parsed.lon < -180 || parsed.lon > 180
    ) return null;
    if (parsed.timezone != null && typeof parsed.timezone !== 'string') return null;
    return parsed;
  } catch { return null; }
}

// Resolve a lat/lon into a full Location: timezone via tz-lookup, and a display
// name via OpenStreetMap reverse geocoding (skipped when a name is already known).
// Pure — performs no store/cookie side effects.
export async function resolveLocation(lat: number, lon: number, knownName?: string): Promise<Location> {
  let timezone: string;
  try {
    timezone = tzlookup(lat, lon) ?? 'UTC';
  } catch {
    timezone = 'UTC';
  }
  let name = knownName ?? `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
  if (!knownName) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
        { headers: { 'Accept-Language': 'en' } },
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address ?? {};
        const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? '';
        const country = addr.country ?? '';
        name = [city, country].filter(Boolean).join(', ') || name;
      }
    } catch { /* keep coordinate fallback */ }
  }
  return { lat, lon, name, timezone };
}
