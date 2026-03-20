/** Validate latitude/longitude bounds. Returns an error string or null if valid. */
export function validateCoords(lat: number, lon: number): string | null {
  if (isNaN(lat) || lat < -90  || lat > 90)  return 'Latitude must be −90 to 90';
  if (isNaN(lon) || lon < -180 || lon > 180) return 'Longitude must be −180 to 180';
  return null;
}
