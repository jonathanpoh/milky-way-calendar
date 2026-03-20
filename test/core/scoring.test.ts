import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scoreNight } from '../../src/core/scoring.js';
import type { Location, MoonData, TimeWindow } from '../../src/core/types.js';

vi.mock('../../src/core/milky-way.js', () => ({
  moonAboveHorizonFraction: vi.fn(),
}));

import { moonAboveHorizonFraction } from '../../src/core/milky-way.js';
const mockMoonFrac = vi.mocked(moonAboveHorizonFraction);

const LOC: Location = { lat: 38.563, lon: -8.882, timezone: 'Europe/Lisbon' };

function makeWindow(durationHours: number): TimeWindow {
  const start = new Date('2026-07-01T22:00:00Z');
  return { start, end: new Date(start.getTime() + durationHours * 3_600_000), durationHours };
}

function makeMoon(illumination: number): MoonData {
  return {
    date: new Date('2026-07-01T00:00:00Z'),
    moonrise: null, moonset: null,
    illumination, phaseAngle: 0,
    moonriseNextDay: false, moonsetNextDay: false,
  };
}

beforeEach(() => {
  mockMoonFrac.mockReturnValue(0); // moon below horizon by default
});

describe('scoreNight', () => {
  it('returns not-visible when mwWindow is null', () => {
    expect(scoreNight(LOC, null, null, makeMoon(0))).toBe('not-visible');
  });

  it('returns not-visible when mwWindow.durationHours is 0', () => {
    expect(scoreNight(LOC, makeWindow(0), null, makeMoon(0))).toBe('not-visible');
  });

  it('returns not-visible when mwWindow.durationHours is negative', () => {
    expect(scoreNight(LOC, makeWindow(-1), null, makeMoon(0))).toBe('not-visible');
  });

  it('returns not-visible when mwWindow.durationHours < 0.5 (below minimum threshold)', () => {
    mockMoonFrac.mockReturnValue(0);
    expect(scoreNight(LOC, makeWindow(0.3), null, makeMoon(5))).toBe('not-visible');
  });

  it('returns best when clearHours >= 2 and moon illumination < 25', () => {
    mockMoonFrac.mockReturnValue(0.5); // moon up for half window, but illumination is low
    const gc = makeWindow(3);
    expect(scoreNight(LOC, makeWindow(4), gc, makeMoon(24))).toBe('best');
  });

  it('returns best when clearHours >= 2 and moonFrac < 0.25 (dim moon irrelevant)', () => {
    mockMoonFrac.mockReturnValue(0.1); // moon below horizon for 90% of window
    const gc = makeWindow(2.5);
    expect(scoreNight(LOC, makeWindow(3), gc, makeMoon(80))).toBe('best');
  });

  it('returns partial when clearHours < 2 regardless of moon', () => {
    mockMoonFrac.mockReturnValue(0);
    const gc = makeWindow(1);
    expect(scoreNight(LOC, makeWindow(2), gc, makeMoon(5))).toBe('partial');
  });

  it('returns partial when high illumination and moon above horizon', () => {
    mockMoonFrac.mockReturnValue(0.5); // moon up for 50% of window
    const gc = makeWindow(3);
    expect(scoreNight(LOC, makeWindow(4), gc, makeMoon(80))).toBe('partial');
  });

  it('returns partial when mwWindow.durationHours is exactly 0.5', () => {
    mockMoonFrac.mockReturnValue(0.5);
    expect(scoreNight(LOC, makeWindow(0.5), null, makeMoon(80))).toBe('partial');
  });

  it('boundary: clearHours exactly 2 with good moon is best', () => {
    mockMoonFrac.mockReturnValue(0);
    const gc = makeWindow(2);
    expect(scoreNight(LOC, makeWindow(3), gc, makeMoon(10))).toBe('best');
  });

  it('boundary: illumination 24 (below threshold) gives best', () => {
    mockMoonFrac.mockReturnValue(0.5);
    const gc = makeWindow(2);
    expect(scoreNight(LOC, makeWindow(3), gc, makeMoon(24))).toBe('best');
  });

  it('boundary: illumination 26 (above threshold) with high moonFrac gives partial', () => {
    mockMoonFrac.mockReturnValue(0.5);
    const gc = makeWindow(2);
    expect(scoreNight(LOC, makeWindow(3), gc, makeMoon(26))).toBe('partial');
  });

  it('falls back to mwWindow when gcClearWindow is null for moon check', () => {
    // With no gcClearWindow, should use mwWindow for moon fraction check
    mockMoonFrac.mockReturnValue(0.1);
    // clearHours is 0 (no gcClearWindow), so never 'best' via clearHours >= 2
    expect(scoreNight(LOC, makeWindow(2), null, makeMoon(80))).toBe('partial');
  });
});
