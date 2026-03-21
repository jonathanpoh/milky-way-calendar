import { describe, it, expect } from 'vitest';
import { validateCoords } from '../../src/web/utils/coords.js';
import { PRESET_LOCATIONS } from '../../src/web/utils/presets.js';

describe('validateCoords', () => {
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

  it('accepts boundary values', () => {
    expect(validateCoords(90, 0)).toBeNull();
    expect(validateCoords(-90, 0)).toBeNull();
    expect(validateCoords(0, 180)).toBeNull();
    expect(validateCoords(0, -180)).toBeNull();
  });
});

describe('PRESET_LOCATIONS', () => {
  it('has 15 entries', () => {
    expect(PRESET_LOCATIONS).toHaveLength(15);
  });

  it('all presets have valid coordinates', () => {
    for (const loc of PRESET_LOCATIONS) {
      expect(validateCoords(loc.lat, loc.lon)).toBeNull();
    }
  });

  it('all presets have non-empty name and timezone', () => {
    for (const loc of PRESET_LOCATIONS) {
      expect(loc.name).toBeTruthy();
      expect(loc.timezone).toBeTruthy();
    }
  });

  it('no duplicate names', () => {
    const names = PRESET_LOCATIONS.map(l => l.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
