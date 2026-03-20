import { describe, it, expect } from 'vitest';
import { generateCalendar } from '../../src/core/calendar.js';

const PALMELA = { lat: 38.563, lon: -8.882 };

describe('CalendarTable data (integration)', () => {
  it('generates rows for each day in a month', () => {
    const rows = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 6, 1)),
      endDate: new Date(Date.UTC(2026, 6, 31)),
      interval: 1,
    });
    expect(rows).toHaveLength(31);
  });

  it('rows have the correct month', () => {
    const rows = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 6, 1)),
      endDate: new Date(Date.UTC(2026, 6, 31)),
      interval: 1,
    });
    for (const row of rows) {
      expect(row.date.getUTCMonth()).toBe(6); // July = 6
    }
  });

  it('MW window start is within the dark window', () => {
    const rows = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 6, 1)),
      endDate: new Date(Date.UTC(2026, 6, 31)),
      interval: 1,
    });
    for (const row of rows) {
      if (row.mwWindow) {
        expect(row.mwWindow.start.getTime()).toBeGreaterThanOrEqual(row.sun.twilightEnd.getTime() - 60_000);
        expect(row.mwWindow.end.getTime()).toBeLessThanOrEqual(row.sun.twilightStart.getTime() + 60_000);
      }
    }
  });

  it('reference fixture: Aug 4 2024 (Denver, new moon ~1%, peak GC) is rated best', () => {
    // Aug 4 2024 is new moon day — low illumination + good GC window
    const rows = generateCalendar({
      location: { lat: 39.0, lon: -104.0 },
      startDate: new Date(Date.UTC(2024, 7, 4)),
      endDate: new Date(Date.UTC(2024, 7, 4)),
      interval: 1,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.rating).toBe('best');
  });

  it('reference fixture: Dec 15 2024 (Denver, winter) is not-visible', () => {
    const rows = generateCalendar({
      location: { lat: 39.0, lon: -104.0 },
      startDate: new Date(Date.UTC(2024, 11, 15)),
      endDate: new Date(Date.UTC(2024, 11, 15)),
      interval: 1,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.rating).toBe('not-visible');
  });
});
