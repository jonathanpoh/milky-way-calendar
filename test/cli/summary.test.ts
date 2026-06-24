import { describe, it, expect } from 'vitest';
import { renderSummary } from '../../src/cli/summary.js';
import { generateCalendar } from '../../src/core/calendar.js';
import { PALMELA } from '../fixtures/locations.js';

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

const tz = PALMELA.timezone!;
const rows = generateCalendar({
  location: PALMELA,
  startDate: new Date(Date.UTC(2026, 5, 1)),
  endDate: new Date(Date.UTC(2026, 7, 31)),
  interval: 7,
});

describe('renderSummary', () => {
  it('includes best, partial, and not-visible counts', () => {
    const output = stripAnsi(renderSummary(rows, tz));
    expect(output).toContain('Best nights:');
    expect(output).toContain('Partial nights:');
    expect(output).toContain('Not visible:');
  });

  it('counts add up to total rows', () => {
    const output = stripAnsi(renderSummary(rows, tz));
    const best = parseInt(output.match(/Best nights:\s+(\d+)/)![1]);
    const partial = parseInt(output.match(/Partial nights:\s+(\d+)/)![1]);
    const none = parseInt(output.match(/Not visible:\s+(\d+)/)![1]);
    expect(best + partial + none).toBe(rows.length);
  });

  it('includes total GC hours', () => {
    const output = stripAnsi(renderSummary(rows, tz));
    expect(output).toMatch(/Total GC hours:\s+\d+\.\d+h/);
  });

  it('includes peak month', () => {
    const output = stripAnsi(renderSummary(rows, tz));
    expect(output).toMatch(/Peak month:\s+\w+ \d{4}/);
  });
});
