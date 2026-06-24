import { describe, it, expect } from 'vitest';
import stringWidth from 'string-width';
import { renderTable } from '../../src/cli/table-renderer.js';
import { generateCalendar } from '../../src/core/calendar.js';
import { PALMELA } from '../fixtures/locations.js';
import { stripAnsi } from './helpers.js';

const rows = generateCalendar({
  location: PALMELA,
  startDate: new Date(Date.UTC(2026, 5, 1)),
  endDate: new Date(Date.UTC(2026, 7, 31)),
  interval: 7,
});

describe('renderTable', () => {
  it('default output fits within 80 display columns', () => {
    const output = renderTable(rows, PALMELA.timezone!);
    for (const line of output.split('\n')) {
      expect(stringWidth(line)).toBeLessThanOrEqual(80);
    }
  });

  it('verbose output fits within 115 display columns', () => {
    const output = renderTable(rows, PALMELA.timezone!, true);
    for (const line of output.split('\n')) {
      expect(stringWidth(line)).toBeLessThanOrEqual(115);
    }
  });

  it('verbose output has more columns than default', () => {
    const def = renderTable(rows, PALMELA.timezone!);
    const verb = renderTable(rows, PALMELA.timezone!, true);
    const defHeader = stripAnsi(def.split('\n')[0]);
    const verbHeader = stripAnsi(verb.split('\n')[0]);
    expect(stringWidth(verbHeader)).toBeGreaterThan(stringWidth(defHeader));
    expect(verbHeader).toContain('Dark');
    expect(verbHeader).toContain('MW win');
    expect(verbHeader).toContain('GC clr');
    expect(defHeader).not.toContain('Dark');
  });

  it('best rows show shoot window times', () => {
    const output = stripAnsi(renderTable(rows, PALMELA.timezone!));
    const lines = output.split('\n').slice(2); // skip header + separator
    const bestLine = lines.find(l => l.includes('Best'));
    expect(bestLine).toBeDefined();
    expect(bestLine).toMatch(/\d{2}:\d{2}–\d{2}:\d{2}/);
  });

  it('not-visible rows show dash for shoot window', () => {
    const output = stripAnsi(renderTable(rows, PALMELA.timezone!));
    const lines = output.split('\n').slice(2);
    const noneLine = lines.find(l => l.includes('None'));
    expect(noneLine).toBeDefined();
    expect(noneLine).toMatch(/None\s+—/);
  });

  it('every data row has a moon emoji', () => {
    const output = stripAnsi(renderTable(rows, PALMELA.timezone!));
    const lines = output.split('\n').slice(2);
    for (const line of lines) {
      expect(line).toMatch(/🌑|🌒|🌓|🌔|🌕|🌖|🌗|🌘/);
    }
  });

  it('date label follows the UTC calendar date, not the display timezone', () => {
    // row.date is a UTC-anchored midnight; a negative-offset display timezone
    // must not shift the label back a day.
    const oneRow = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 5, 1)),
      endDate: new Date(Date.UTC(2026, 5, 1)),
      interval: 1,
    });
    const output = stripAnsi(renderTable(oneRow, 'America/Los_Angeles'));
    const dataLine = output.split('\n')[2];
    expect(dataLine).toMatch(/^01 Jun/);
  });
});
