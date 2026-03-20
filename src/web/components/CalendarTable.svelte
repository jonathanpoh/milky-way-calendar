<script lang="ts">
  import type { CalendarRow } from '../../core/types.js';
  import Row from './CalendarRow.svelte';
  import { location, year } from '../stores/calendar.js';

  const YEARS = [2025,2026,2027,2028,2029,2030,2031,2032,2033,2034];

  interface Props { rows: CalendarRow[]; }
  let { rows }: Props = $props();

  const tz = $derived($location.timezone ?? 'UTC');

  // ── Month filter ────────────────────────────────────────────────────────────
  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().getUTCMonth();
  let selectedMonth = $state<number>(currentMonth);

  // Derive the set of months that actually appear in the rows.
  const months = $derived(() => {
    const seen = new Map<number, { label: string; best: number; partial: number; total: number }>();
    for (const row of rows) {
      const m = row.date.getUTCMonth();
      if (!seen.has(m)) {
        seen.set(m, {
          label: new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(row.date),
          best: 0, partial: 0, total: 0,
        });
      }
      const entry = seen.get(m)!;
      entry.total++;
      if (row.rating === 'best') entry.best++;
      else if (row.rating === 'partial') entry.partial++;
    }
    // Return in calendar order
    return [...seen.entries()].sort((a, b) => a[0] - b[0]);
  });

  const visibleRows = $derived(
    rows.filter(r => r.date.getUTCMonth() === selectedMonth)
  );

  function selectMonth(m: number) {
    selectedMonth = m;
  }

  // ── Year dropdown ────────────────────────────────────────────────────────────
  let yearOpen        = $state(false);
  let yearActiveIndex = $state(-1);

  function selectYear(y: number) {
    $year = y;
    yearOpen = false;
    yearActiveIndex = -1;
  }

  function onYearKeydown(e: KeyboardEvent) {
    if (!yearOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        yearOpen = true;
        yearActiveIndex = YEARS.indexOf($year);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      yearActiveIndex = Math.min(yearActiveIndex + 1, YEARS.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      yearActiveIndex = Math.max(yearActiveIndex - 1, 0);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (yearActiveIndex >= 0) selectYear(YEARS[yearActiveIndex]);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      yearOpen = false;
      yearActiveIndex = -1;
    }
  }

  // When rows change (new year / location), reset to current month (or first available)
  $effect(() => {
    const available = months();
    rows; // track
    const defaultMonth = $year === currentYear ? currentMonth : 0;
    if (available.some(([m]) => m === defaultMonth)) {
      selectedMonth = defaultMonth;
    } else if (available.length > 0) {
      selectedMonth = available[0]![0];
    }
  });

  // ── Fixed bar bounds: local noon → next local noon (full 24h) ───────────────
  // 0 = local 12:00, 1440 = local 12:00 next day (minutes since local noon).
  const BAR_START_MIN =  0 * 60; // 12:00 (noon)
  const BAR_END_MIN   = 24 * 60; // 12:00 next day
</script>

<!-- Month filter bar (with year selector at left) -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="month-bar" onmousedown={(e) => { if (!(e.target as Element).closest('.year-wrap')) yearOpen = false; }}>
  <div class="year-wrap">
    <span class="year-label">Year</span>
    <button
      class="year-btn"
      onclick={() => { yearOpen = !yearOpen; if (yearOpen) yearActiveIndex = YEARS.indexOf($year); }}
      onkeydown={onYearKeydown}
      aria-haspopup="listbox"
      aria-expanded={yearOpen}
      aria-controls="year-listbox"
      aria-activedescendant={yearOpen && yearActiveIndex >= 0 ? `year-opt-${yearActiveIndex}` : undefined}
    >
      {$year}<span class="chevron" class:open={yearOpen}>▾</span>
    </button>
    {#if yearOpen}
      <ul class="year-dropdown" id="year-listbox" role="listbox">
        {#each YEARS as y, i}
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <li
            id="year-opt-{i}"
            role="option"
            aria-selected={y === $year}
            class:selected={y === $year}
            class:active={i === yearActiveIndex}
            onmousedown={() => selectYear(y)}
            onmouseenter={() => { yearActiveIndex = i; }}
          >{y}</li>
        {/each}
      </ul>
    {/if}
  </div>
  {#each months() as [m, info]}
    <button
      class="month-btn"
      class:active={selectedMonth === m}
      onclick={() => selectMonth(m)}
    >{info.label}</button>
  {/each}
</div>

<table>
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
      <tr><td colspan="6" class="empty">No data for this month.</td></tr>
    {/if}
  </tbody>
</table>

<style>
  /* Month pill bar */
  .month-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
  }

  .year-wrap {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .year-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #89b4fa;
  }

  .year-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.6rem;
    background: #1e1e2e;
    border: 1px solid #45475a;
    border-radius: 6px;
    color: #cdd6f4;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.1s, border-color 0.1s;
    min-width: 5rem;
    justify-content: space-between;
  }
  .year-btn:hover  { background: #313244; border-color: #6c7086; }

  .chevron {
    font-size: 1.0rem;
    color: #6c7086;
    transition: transform 0.15s;
    display: inline-block;
  }
  .chevron.open { transform: rotate(180deg); }

  .year-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 100%;
    background: #1e1e2e;
    border: 1px solid #45475a;
    border-radius: 4px;
    margin: 0;
    padding: 0.25rem 0;
    list-style: none;
    z-index: 200;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  }
  .year-dropdown li {
    padding: 0.35rem 0.7rem;
    font-size: 0.85rem;
    color: #cdd6f4;
    cursor: pointer;
    font-variant-numeric: tabular-nums;
  }
  .year-dropdown li:hover, .year-dropdown li.active { background: #313244; }
  .year-dropdown li.selected { color: #89b4fa; font-weight: 600; }

  .month-btn {
    width: 3.8rem;
    padding: 0.3rem 0;
    background: #1e1e2e;
    border: 1px solid #45475a;
    border-radius: 6px;
    color: #a6adc8;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    text-align: center;
    transition: background 0.1s, border-color 0.1s, color 0.1s;
  }
  .month-btn:hover  { background: #313244; border-color: #6c7086; color: #cdd6f4; }
  .month-btn.active { background: #313244; border-color: #89b4fa; color: #cdd6f4; }

  table {
    border-collapse: collapse;
    width: 100%;
    min-width: 560px;
  }

  thead tr {
    border-bottom: 2px solid #45475a;
  }

  th {
    padding: 0.4rem 0.6rem;
    text-align: left;
    font-size: 0.78rem;
    color: #89b4fa;
    font-weight: 600;
    white-space: nowrap;
  }
  .bar-header { width: 100%; }
  .hint {
    font-size: 0.68rem;
    font-weight: 400;
    color: #45475a;
    margin-left: 0.4rem;
  }

  .empty { text-align: center; padding: 2rem; color: #585b70; }
</style>
