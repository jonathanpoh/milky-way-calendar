<script lang="ts">
  import type { CalendarRow } from '../../core/types.js';
  import Row from './CalendarRow.svelte';
  import { location, year, startDate, todayUTC } from '../stores/calendar.js';

  const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 1 + i);

  interface Props { rows: CalendarRow[]; }
  let { rows }: Props = $props();

  const tz = $derived($location.timezone ?? 'UTC');

  const WINDOW_DAYS = 30;
  const currentYear = new Date().getFullYear();

  // The start date (a shared store, kept in the URL) drives the view: the table
  // shows the next WINDOW_DAYS nights from here, crossing month boundaries.
  const visibleRows = $derived(
    rows.filter(r => r.date.getTime() >= $startDate.getTime()).slice(0, WINDOW_DAYS)
  );

  // ── Month filter ────────────────────────────────────────────────────────────
  const activeMonth = $derived($startDate.getUTCMonth());

  // Months that actually appear in the rows (for the pill bar).
  const months = $derived.by(() => {
    const seen = new Map<number, string>();
    for (const row of rows) {
      const m = row.date.getUTCMonth();
      if (!seen.has(m)) {
        seen.set(m, new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(row.date));
      }
    }
    return [...seen.entries()].sort((a, b) => a[0] - b[0]);
  });

  // Picking a month starts the window at the 1st of that month.
  function selectMonth(m: number) {
    $startDate = new Date(Date.UTC($startDate.getUTCFullYear(), m, 1));
  }

  // ── Exact start-date picker ───────────────────────────────────────────────
  const startInput = $derived($startDate.toISOString().slice(0, 10));
  function onStartInput(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    if (!v) return;
    const [y, m, d] = v.split('-').map(Number);
    $startDate = new Date(Date.UTC(y, m - 1, d));
  }

  // ── Year dropdown ────────────────────────────────────────────────────────────
  let yearOpen        = $state(false);
  let yearActiveIndex = $state(-1);

  // Picking a year starts at today (current year) or Jan 1 (other years).
  function selectYear(y: number) {
    $startDate = y === currentYear ? todayUTC() : new Date(Date.UTC(y, 0, 1));
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
    >
      {$year}<span class="chevron" class:open={yearOpen}>▾</span>
    </button>
    {#if yearOpen}
      <ul class="year-dropdown" id="year-listbox" role="listbox" tabindex="-1" aria-activedescendant={yearActiveIndex >= 0 ? `year-opt-${yearActiveIndex}` : undefined}>
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
  {#each months as [m, label]}
    <button
      class="month-btn"
      class:active={activeMonth === m}
      onclick={() => selectMonth(m)}
    >{label}</button>
  {/each}

  <div class="date-wrap">
    <span class="date-label">Start</span>
    <input
      class="date-input"
      type="date"
      value={startInput}
      oninput={onStartInput}
      aria-label="Start date"
    />
  </div>
</div>

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
      <tr><td colspan="6" class="empty">No data for this month.</td></tr>
    {/if}
  </tbody>
</table>
</div>

<style>
  /* Month pill bar */
  .month-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
    margin-bottom: var(--sp-3);
  }

  .year-wrap {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-right: 0.3rem;
  }

  .year-label {
    font-family: var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--text-faint);
  }

  .year-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.6rem;
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-radius: var(--radius);
    color: var(--text);
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.1s, border-color 0.1s;
    min-width: 5rem;
    justify-content: space-between;
    font-variant-numeric: tabular-nums;
  }
  .year-btn:hover  { background: var(--surface-2); border-color: var(--text-faint); }

  .chevron {
    font-size: 1.0rem;
    color: var(--text-faint);
    transition: transform 0.15s;
    display: inline-block;
  }
  .chevron.open { transform: rotate(180deg); }

  .year-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 100%;
    background: var(--surface-2);
    border: 1px solid var(--hairline);
    border-radius: var(--radius);
    margin: 0;
    padding: 0.25rem 0;
    list-style: none;
    z-index: 200;
    box-shadow: 0 8px 24px rgba(0,0,0,0.6);
  }
  .year-dropdown li {
    padding: 0.35rem 0.7rem;
    font-size: 0.85rem;
    color: var(--text);
    cursor: pointer;
    font-variant-numeric: tabular-nums;
  }
  .year-dropdown li:hover, .year-dropdown li.active { background: var(--surface); }
  .year-dropdown li.selected { color: var(--azure); font-weight: 700; }

  .month-btn {
    width: 3.6rem;
    padding: 0.3rem 0;
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-radius: var(--radius);
    color: var(--text-dim);
    font-family: var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.66rem;
    font-weight: 700;
    cursor: pointer;
    text-align: center;
    transition: background 0.1s, border-color 0.1s, color 0.1s;
  }
  .month-btn:hover  { background: var(--surface-2); border-color: var(--text-faint); color: var(--text); }
  .month-btn.active { background: var(--surface-2); border-color: var(--azure); color: var(--text); }

  .date-wrap {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-left: 0.3rem;
  }
  .date-label {
    font-family: var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--text-faint);
  }
  .date-input {
    padding: 0.3rem 0.5rem;
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-radius: var(--radius);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
    color-scheme: dark;
    cursor: pointer;
  }
  .date-input:hover { border-color: var(--text-faint); }
  .date-input:focus { outline: none; border-color: var(--azure); }

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
