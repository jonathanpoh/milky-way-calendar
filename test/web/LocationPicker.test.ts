import { describe, it, expect } from 'vitest';
import { validateCoords } from '../../src/web/utils/coords.js';

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
