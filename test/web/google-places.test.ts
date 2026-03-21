import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geoIPLocate, fetchPlaceSuggestions, fetchPlaceDetail } from '../../src/web/utils/google-places.js';

const TEST_KEY = 'test-api-key';

function mockFetch(response: unknown, ok = true) {
  const spy = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

beforeEach(() => { vi.unstubAllGlobals(); });
afterEach(() => { vi.unstubAllGlobals(); });

// ── geoIPLocate ──────────────────────────────────────────────────────────────

describe('geoIPLocate', () => {
  it('returns lat/lon on success', async () => {
    mockFetch({ location: { lat: 38.56, lng: -8.88 } });
    const result = await geoIPLocate(TEST_KEY);
    expect(result).toEqual({ lat: 38.56, lon: -8.88 });
  });

  it('calls correct endpoint with key', async () => {
    const fetchMock = mockFetch({ location: { lat: 0, lng: 0 } });
    await geoIPLocate(TEST_KEY);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${TEST_KEY}`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('returns null when response is not ok', async () => {
    mockFetch({}, false);
    const result = await geoIPLocate(TEST_KEY);
    expect(result).toBeNull();
  });

  it('returns null when location fields are missing', async () => {
    mockFetch({ location: {} });
    const result = await geoIPLocate(TEST_KEY);
    expect(result).toBeNull();
  });
});

// ── fetchPlaceSuggestions ────────────────────────────────────────────────────

describe('fetchPlaceSuggestions', () => {
  it('returns suggestions array on success', async () => {
    const suggestions = [
      { placePrediction: { place: 'places/abc', text: { text: 'Tokyo, Japan' }, structuredFormat: { mainText: { text: 'Tokyo' }, secondaryText: { text: 'Japan' } } } },
    ];
    mockFetch({ suggestions });
    const result = await fetchPlaceSuggestions(TEST_KEY, 'Tokyo');
    expect(result).toEqual(suggestions);
  });

  it('sends query and key correctly', async () => {
    const fetchMock = mockFetch({ suggestions: [] });
    await fetchPlaceSuggestions(TEST_KEY, 'Lisbon');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://places.googleapis.com/v1/places:autocomplete',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-Goog-Api-Key': TEST_KEY }),
      }),
    );
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.input).toBe('Lisbon');
    expect(body.includedPrimaryTypes).toContain('locality');
  });

  it('returns empty array when suggestions key is absent', async () => {
    mockFetch({});
    const result = await fetchPlaceSuggestions(TEST_KEY, 'xyz');
    expect(result).toEqual([]);
  });
});

// ── fetchPlaceDetail ─────────────────────────────────────────────────────────

describe('fetchPlaceDetail', () => {
  it('returns lat/lon on success', async () => {
    mockFetch({ location: { latitude: 35.68, longitude: 139.69 } });
    const result = await fetchPlaceDetail(TEST_KEY, 'places/tokyo123');
    expect(result).toEqual({ lat: 35.68, lon: 139.69 });
  });

  it('calls correct endpoint with key header', async () => {
    const fetchMock = mockFetch({ location: { latitude: 0, longitude: 0 } });
    await fetchPlaceDetail(TEST_KEY, 'places/abc');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://places.googleapis.com/v1/places/abc?fields=location,displayName',
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Goog-Api-Key': TEST_KEY }) }),
    );
  });

  it('throws when location is missing', async () => {
    mockFetch({ displayName: { text: 'Somewhere' } });
    await expect(fetchPlaceDetail(TEST_KEY, 'places/abc')).rejects.toThrow();
  });
});
