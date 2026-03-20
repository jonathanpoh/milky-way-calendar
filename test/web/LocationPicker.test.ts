import { describe, it, expect } from 'vitest';

// Unit-test the validation logic (no Svelte component rendering needed for bounds checks)
function validateCoords(lat: number, lon: number): string | null {
  if (isNaN(lat) || lat < -90 || lat > 90) return 'Latitude must be between -90 and 90';
  if (isNaN(lon) || lon < -180 || lon > 180) return 'Longitude must be between -180 and 180';
  return null;
}

describe('LocationPicker validation', () => {
  it('accepts valid coordinates', () => {
    expect(validateCoords(38.563, -8.882)).toBeNull();
    expect(validateCoords(0, 0)).toBeNull();
    expect(validateCoords(-90, 180)).toBeNull();
  });

  it('rejects latitude out of bounds', () => {
    expect(validateCoords(91, 0)).toMatch(/Latitude/);
    expect(validateCoords(-91, 0)).toMatch(/Latitude/);
  });

  it('rejects longitude out of bounds', () => {
    expect(validateCoords(0, 181)).toMatch(/Longitude/);
    expect(validateCoords(0, -181)).toMatch(/Longitude/);
  });

  it('rejects NaN values', () => {
    expect(validateCoords(NaN, 0)).toMatch(/Latitude/);
    expect(validateCoords(0, NaN)).toMatch(/Longitude/);
  });
});
