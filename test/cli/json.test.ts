import { describe, it, expect } from 'vitest';
import { serializeRows } from '../../src/cli/json.js';
import { generateCalendar } from '../../src/core/calendar.js';
import { PALMELA } from '../fixtures/locations.js';

const tz = PALMELA.timezone!;
const rows = generateCalendar({
  location: PALMELA,
  startDate: new Date(Date.UTC(2026, 5, 1)),
  endDate: new Date(Date.UTC(2026, 7, 31)),
  interval: 7,
});

const serialized = serializeRows(rows, tz);

describe('serializeRows', () => {
  it('returns one object per input row', () => {
    expect(serialized).toHaveLength(rows.length);
  });

  it('dates are YYYY-MM-DD strings', () => {
    for (const row of serialized) {
      expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('rating is a valid value', () => {
    for (const row of serialized) {
      expect(['best', 'partial', 'not-visible']).toContain(row.rating);
    }
  });

  it('shootingWindow is null or has start/end/durationHours', () => {
    for (const row of serialized) {
      if (row.shootingWindow !== null) {
        expect(row.shootingWindow.start).toMatch(/^\d{2}:\d{2}$/);
        expect(row.shootingWindow.end).toMatch(/^\d{2}:\d{2}$/);
        expect(typeof row.shootingWindow.durationHours).toBe('number');
      }
    }
  });

  it('best rows have a non-null shootingWindow', () => {
    const bestRows = serialized.filter(r => r.rating === 'best');
    expect(bestRows.length).toBeGreaterThan(0);
    for (const row of bestRows) {
      expect(row.shootingWindow).not.toBeNull();
    }
  });

  it('moon has illumination, phaseAngle, and emoji', () => {
    for (const row of serialized) {
      expect(row.moon.illumination).toBeGreaterThanOrEqual(0);
      expect(row.moon.illumination).toBeLessThanOrEqual(100);
      expect(typeof row.moon.phaseAngle).toBe('number');
      expect(row.moon.emoji).toMatch(/🌑|🌒|🌓|🌔|🌕|🌖|🌗|🌘/);
    }
  });

  it('sun times are HH:MM strings or null', () => {
    for (const row of serialized) {
      for (const val of [row.sun.sunset, row.sun.darkFrom, row.sun.darkUntil]) {
        if (val !== null) expect(val).toMatch(/^\d{2}:\d{2}$/);
      }
    }
  });

  it('gc times are HH:MM strings or null', () => {
    for (const row of serialized) {
      for (const val of [row.gc.rise, row.gc.set, row.gc.transit]) {
        if (val !== null) expect(val).toMatch(/^\d{2}:\d{2}$/);
      }
    }
  });

  it('output is valid JSON when stringified', () => {
    const json = JSON.stringify(serialized);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('date follows the UTC calendar date, not the display timezone', () => {
    // row.date is a UTC-anchored midnight; a negative-offset display timezone
    // must not shift the serialized date back a day.
    const oneRow = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 5, 1)),
      endDate: new Date(Date.UTC(2026, 5, 1)),
      interval: 1,
    });
    expect(serializeRows(oneRow, 'America/Los_Angeles')[0].date).toBe('2026-06-01');
  });
});
