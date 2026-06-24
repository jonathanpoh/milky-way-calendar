import chalk from 'chalk';
import type { CalendarRow } from '../core/types.js';
import { formatMonth } from './format.js';

export function renderSummary(rows: CalendarRow[]): string {
  const best = rows.filter(r => r.rating === 'best');
  const partial = rows.filter(r => r.rating === 'partial');
  const totalGcHours = rows.reduce((sum, r) => sum + (r.gcClearWindow?.durationHours ?? 0), 0);

  // Find peak month (most best/partial nights)
  const monthCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.rating !== 'not-visible') {
      const key = formatMonth(row.date);
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    }
  }
  let peakMonth = '—';
  let peakCount = 0;
  for (const [month, count] of monthCounts) {
    if (count > peakCount) { peakMonth = month; peakCount = count; }
  }

  const lines = [
    chalk.bold('\n── Summary ──────────────────────────────'),
    `Best nights:    ${chalk.green(String(best.length))}`,
    `Partial nights: ${chalk.yellow(String(partial.length))}`,
    `Not visible:    ${chalk.dim(String(rows.length - best.length - partial.length))}`,
    `Total GC hours: ${totalGcHours.toFixed(1)}h`,
    `Peak month:     ${peakMonth} (${peakCount} visible nights)`,
    chalk.bold('─────────────────────────────────────────'),
  ];
  return lines.join('\n');
}
