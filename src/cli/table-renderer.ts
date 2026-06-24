import chalk from 'chalk';
import stringWidth from 'string-width';
import type { CalendarRow, TimeWindow } from '../core/types.js';
import { moonEmoji } from './emoji.js';

interface Column {
  header: string;
  width: number;
  align: 'left' | 'right';
  verboseOnly?: boolean;
  render: (row: CalendarRow, tz: string) => string;
}

function fmtTime(date: Date | null, tz: string): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
  }).format(date);
}

function fmtWindow(win: TimeWindow | null, tz: string): string {
  if (!win) return '—';
  return `${fmtTime(win.start, tz)}–${fmtTime(win.end, tz)}`;
}

function fmtDuration(hours: number | undefined): string {
  if (!hours || hours <= 0) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

function fmtDate(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', timeZone: tz,
  }).format(date);
}

function fmtRating(rating: CalendarRow['rating']): string {
  if (rating === 'best') return '★ Best';
  if (rating === 'partial') return '◑ Part';
  return '· None';
}

function fmtMoon(moon: CalendarRow['moon']): string {
  const pct = String(moon.illumination).padStart(3);
  return `${moonEmoji(moon.phaseAngle)} ${pct}%`;
}

function padCell(text: string, width: number, align: 'left' | 'right'): string {
  const visible = stringWidth(text);
  const gap = Math.max(0, width - visible);
  return align === 'right' ? ' '.repeat(gap) + text : text + ' '.repeat(gap);
}

const COLUMNS: Column[] = [
  { header: 'Date',    width: 6,  align: 'left',  render: (r, tz) => fmtDate(r.date, tz) },
  { header: 'Rtg',     width: 6,  align: 'left',  render: (r) => fmtRating(r.rating) },
  { header: 'Shoot',   width: 11, align: 'left',  render: (r, tz) => fmtWindow(r.shootingWindow, tz) },
  { header: 'Dur',     width: 5,  align: 'right', render: (r) => fmtDuration(r.shootingWindow?.durationHours) },
  { header: 'Moon',    width: 7,  align: 'right', render: (r) => fmtMoon(r.moon) },
  { header: 'Dark',    width: 11, align: 'left',  verboseOnly: true, render: (r, tz) => fmtWindow(r.sun.darkWindow, tz) },
  { header: 'MW win',  width: 11, align: 'left',  verboseOnly: true, render: (r, tz) => fmtWindow(r.mwWindow, tz) },
  { header: 'GC clr',  width: 5,  align: 'right', verboseOnly: true, render: (r) => fmtDuration(r.gcClearWindow?.durationHours) },
  { header: 'Position', width: 24, align: 'left', render: (r) => r.gc.positionLabel || '—' },
];

function colorByRating(text: string, rating: CalendarRow['rating']): string {
  if (rating === 'best') return chalk.green(text);
  if (rating === 'partial') return chalk.yellow(text);
  return chalk.dim(text);
}

export function renderTable(rows: CalendarRow[], timezone = 'UTC', verbose = false): string {
  const cols = verbose ? COLUMNS : COLUMNS.filter(c => !c.verboseOnly);
  const gap = '  ';

  const headerLine = cols.map(c => chalk.bold(padCell(c.header, c.width, c.align))).join(gap);
  const sepLine = chalk.dim(cols.map(c => '─'.repeat(c.width)).join(gap));

  const dataLines = rows.map(row => {
    const cells = cols.map(col => {
      const plain = col.render(row, timezone);
      const padded = padCell(plain, col.width, col.align);

      if (row.rating === 'not-visible') return chalk.dim(padded);
      if (col.header === 'Rtg' || col.header === 'Shoot' || col.header === 'Dur') {
        return colorByRating(padded, row.rating);
      }
      return padded;
    });
    return cells.join(gap);
  });

  return [headerLine, sepLine, ...dataLines].join('\n');
}
