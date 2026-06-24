import chalk from 'chalk';
import stringWidth from 'string-width';
import type { CalendarRow, TimeWindow } from '../core/types.js';
import { moonEmoji } from './emoji.js';
import { formatTime, formatDateShort, formatDuration } from './format.js';

interface Column {
  header: string;
  width: number;
  align: 'left' | 'right';
  verboseOnly?: boolean;
  render: (row: CalendarRow, tz: string) => string;
}

function fmtTime(date: Date | null, tz: string): string {
  if (!date) return '—';
  return formatTime(date, tz);
}

function fmtWindow(win: TimeWindow | null, tz: string): string {
  if (!win) return '—';
  return `${fmtTime(win.start, tz)}–${fmtTime(win.end, tz)}`;
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
  { header: 'Date',    width: 6,  align: 'left',  render: (r) => formatDateShort(r.date) },
  { header: 'Rtg',     width: 6,  align: 'left',  render: (r) => fmtRating(r.rating) },
  { header: 'Shoot',   width: 11, align: 'left',  render: (r, tz) => fmtWindow(r.shootingWindow, tz) },
  { header: 'Dur',     width: 6,  align: 'right', render: (r) => formatDuration(r.shootingWindow?.durationHours) },
  { header: 'Moon',    width: 7,  align: 'right', render: (r) => fmtMoon(r.moon) },
  { header: 'Dark',    width: 11, align: 'left',  verboseOnly: true, render: (r, tz) => fmtWindow(r.sun.darkWindow, tz) },
  { header: 'MW win',  width: 11, align: 'left',  verboseOnly: true, render: (r, tz) => fmtWindow(r.mwWindow, tz) },
  { header: 'GC clr',  width: 6,  align: 'right', verboseOnly: true, render: (r) => formatDuration(r.gcClearWindow?.durationHours) },
  { header: 'Position', width: 27, align: 'left', render: (r) => r.gc.positionLabel || '—' },
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
