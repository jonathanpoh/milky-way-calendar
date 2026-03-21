export interface PlaceSuggestion {
  placePrediction: {
    place: string;
    text: { text: string };
    structuredFormat: {
      mainText: { text: string };
      secondaryText?: { text: string };
    };
  };
}

/** Returns {lat, lon} from Google Geolocation API, or null on failure. */
export async function geoIPLocate(key: string): Promise<{ lat: number; lon: number } | null> {
  const res = await fetch(
    `https://www.googleapis.com/geolocation/v1/geolocate?key=${key}`,
    { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } },
  );
  if (!res.ok) return null;
  const data = await res.json();
  const lat: number = data.location?.lat;
  const lon: number = data.location?.lng;
  if (lat == null || lon == null) return null;
  return { lat, lon };
}

/** Returns autocomplete suggestions from Google Places API. */
export async function fetchPlaceSuggestions(key: string, query: string): Promise<PlaceSuggestion[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
    body: JSON.stringify({
      input: query,
      includedPrimaryTypes: ['locality', 'administrative_area_level_3'],
      languageCode: 'en',
    }),
  });
  const data = await res.json();
  return data.suggestions ?? [];
}

/** Fetches coordinates for a place ID from Google Places API. */
export async function fetchPlaceDetail(key: string, placeId: string): Promise<{ lat: number; lon: number }> {
  const res = await fetch(
    `https://places.googleapis.com/v1/${placeId}?fields=location,displayName`,
    { headers: { 'X-Goog-Api-Key': key } },
  );
  const data = await res.json();
  const lat = data.location?.latitude;
  const lon = data.location?.longitude;
  if (lat == null || lon == null) throw new Error('No location in response');
  return { lat, lon };
}
