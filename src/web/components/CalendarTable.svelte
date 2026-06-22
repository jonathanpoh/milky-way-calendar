<script lang="ts">
  import type { CalendarRow } from '../../core/types.js';
  import Row from './CalendarRow.svelte';
  import { location, year, startDate } from '../stores/calendar.js';

  interface Props { rows: CalendarRow[]; }
  let { rows }: Props = $props();

  const tz = $derived($location.timezone ?? 'UTC');

  const WINDOW_DAYS = 30;

  // The start date (a shared store, kept in the URL) drives the view: the table
  // shows the next WINDOW_DAYS nights from here, crossing month boundaries.
  const visibleRows = $derived(
    rows.filter(r => r.date.getTime() >= $startDate.getTime()).slice(0, WINDOW_DAYS)
  );

  // ── Fixed bar bounds: local noon → next local noon (full 24h) ───────────────
  // 0 = local 12:00, 1440 = local 12:00 next day (minutes since local noon).
  const BAR_START_MIN =  0 * 60; // 12:00 (noon)
  const BAR_END_MIN   = 24 * 60; // 12:00 next day
</script>

<div class="table-scroll">
<table aria-label="Milky Way visibility calendar for {$year}">
  <thead>
    <tr>
      <th>Date</th>
      <th title="Best / Partial / Not visible">★</th>
      <th class="bar-header">Night  <span class="hint">hover for times</span></th>
      <th title="Moon illumination">Moon</th>
      <th title="MW window / GC clear (altitude > 10°)">MW / GC clear</th>
      <th>GC position</th>
    </tr>
  </thead>
  <tbody>
    {#each visibleRows as row (row.date.toISOString())}
      <Row {row} timezone={tz} barStartMin={BAR_START_MIN} barEndMin={BAR_END_MIN} />
    {/each}
    {#if visibleRows.length === 0}
      <tr><td colspan="6" class="empty">No data for the selected dates.</td></tr>
    {/if}
  </tbody>
</table>
</div>

<style>
  .table-scroll {
    overflow-x: auto;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    min-width: 560px;
  }

  thead tr {
    border-bottom: 1px solid var(--text-faint);
  }

  th {
    padding: 0.4rem 0.6rem;
    text-align: left;
    font-family: var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.62rem;
    color: var(--text-faint);
    font-weight: 700;
    white-space: nowrap;
  }
  .bar-header { width: 100%; }
  .hint {
    letter-spacing: 0.04em;
    font-size: 0.6rem;
    font-weight: 400;
    color: var(--text-faint);
    margin-left: 0.4rem;
    text-transform: none;
  }

  .empty { text-align: center; padding: 2rem; color: var(--text-faint); }
</style>
