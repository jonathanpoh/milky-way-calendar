import { describe, it, expect } from 'vitest';
import { getMoonData } from '../../src/core/moon.js';

const PALMELA: import('../../src/core/types.js').Location = { lat: 38.563, lon: -8.882 };

describe('getMoonData', () => {
  it('returns illumination between 0 and 100', () => {
    const date = new Date(Date.UTC(2026, 0, 14));
    const data = getMoonData(PALMELA, date);
    expect(data.illumination).toBeGreaterThanOrEqual(0);
    expect(data.illumination).toBeLessThanOrEqual(100);
  });

  it('returns phase angle between 0 and 360 (MoonPhase convention)', () => {
    const date = new Date(Date.UTC(2026, 0, 14));
    const data = getMoonData(PALMELA, date);
    expect(data.phaseAngle).toBeGreaterThanOrEqual(0);
    expect(data.phaseAngle).toBeLessThan(360);
  });

  it('illumination is near 0 around new moon (Jan 18 2026)', () => {
    // Actual new moon: 2026-01-18T19:52Z
    const date = new Date(Date.UTC(2026, 0, 18));
    const data = getMoonData(PALMELA, date);
    expect(data.illumination).toBeLessThan(5);
  });

  it('illumination is near 100 around full moon (Jan 3 2026)', () => {
    // Actual full moon: 2026-01-03T10:03Z
    const date = new Date(Date.UTC(2026, 0, 3));
    const data = getMoonData(PALMELA, date);
    expect(data.illumination).toBeGreaterThan(95);
  });

  it('phase angle is near 0 around new moon (MoonPhase convention)', () => {
    const date = new Date(Date.UTC(2026, 0, 18));
    const data = getMoonData(PALMELA, date);
    // MoonPhase: 0=new, so near 0° or near 360°
    const nearNew = data.phaseAngle < 20 || data.phaseAngle > 340;
    expect(nearNew).toBe(true);
  });

  it('phase angle is near 180 around full moon (MoonPhase convention)', () => {
    const date = new Date(Date.UTC(2026, 0, 3));
    const data = getMoonData(PALMELA, date);
    expect(data.phaseAngle).toBeGreaterThan(160);
    expect(data.phaseAngle).toBeLessThan(200);
  });
});
