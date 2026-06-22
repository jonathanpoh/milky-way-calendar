<script lang="ts">
  import { tick } from 'svelte';
  import { todayUTC } from '../stores/calendar.js';

  interface Props {
    value: Date;                    // UTC midnight
    onChange: (d: Date) => void;
  }
  let { value, onChange }: Props = $props();

  const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  let open = $state(false);
  let root = $state<HTMLElement>();
  let grid = $state<HTMLElement>();
  let trigger = $state<HTMLButtonElement>();

  // Month shown in the popover + the roving-focus day (only meaningful while open).
  let viewYear = $state(value.getUTCFullYear());
  let viewMonth = $state(value.getUTCMonth());
  let focusDate = $state<Date>(value);

  const today = todayUTC();

  function iso(d: Date): string { return d.toISOString().slice(0, 10); }
  function sameDay(a: Date, b: Date): boolean {
    return a.getUTCFullYear() === b.getUTCFullYear()
      && a.getUTCMonth() === b.getUTCMonth()
      && a.getUTCDate() === b.getUTCDate();
  }

  const buttonLabel = $derived(new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(value));

  const monthTitle = $derived(new Intl.DateTimeFormat('en-GB', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(Date.UTC(viewYear, viewMonth, 1))));

  // 6 weeks (Monday-first) covering the view month.
  const weeks = $derived.by((): Date[][] => {
    const first = new Date(Date.UTC(viewYear, viewMonth, 1));
    const dow = (first.getUTCDay() + 6) % 7; // 0 = Monday
    const cur = new Date(first);
    cur.setUTCDate(1 - dow);
    const out: Date[][] = [];
    for (let r = 0; r < 6; r++) {
      const row: Date[] = [];
      for (let c = 0; c < 7; c++) { row.push(new Date(cur)); cur.setUTCDate(cur.getUTCDate() + 1); }
      out.push(row);
    }
    return out;
  });

  function focusDay() {
    grid?.querySelector<HTMLElement>(`[data-date="${iso(focusDate)}"]`)?.focus();
  }

  async function openPicker() {
    viewYear = value.getUTCFullYear();
    viewMonth = value.getUTCMonth();
    focusDate = value;
    open = true;
    await tick();
    focusDay();
  }
  function close(returnFocus = false) {
    open = false;
    if (returnFocus) trigger?.focus();
  }
  function toggle() { open ? close() : openPicker(); }

  function select(d: Date) {
    onChange(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
    close(true);
  }

  function shiftMonth(n: number) {
    const m = new Date(Date.UTC(viewYear, viewMonth + n, 1));
    viewYear = m.getUTCFullYear();
    viewMonth = m.getUTCMonth();
  }

  async function onGridKeydown(e: KeyboardEvent) {
    let delta = 0;
    switch (e.key) {
      case 'ArrowLeft':  delta = -1; break;
      case 'ArrowRight': delta = 1; break;
      case 'ArrowUp':    delta = -7; break;
      case 'ArrowDown':  delta = 7; break;
      case 'PageUp':     e.preventDefault(); shiftMonth(-1); return;
      case 'PageDown':   e.preventDefault(); shiftMonth(1); return;
      case 'Enter':
      case ' ':          e.preventDefault(); select(focusDate); return;
      case 'Escape':     close(true); return;
      default: return;
    }
    e.preventDefault();
    const nd = new Date(focusDate);
    nd.setUTCDate(nd.getUTCDate() + delta);
    focusDate = nd;
    viewYear = nd.getUTCFullYear();
    viewMonth = nd.getUTCMonth();
    await tick();
    focusDay();
  }

  function resetToday() {
    onChange(todayUTC());
    close();
  }

  // Close on outside click / Escape while open.
  $effect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (root && !root.contains(e.target as Node)) close(); };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  });
</script>

<div class="start-picker" bind:this={root}>
  <label class="field">
    <span class="label">Start date</span>
    <button
      class="trigger"
      bind:this={trigger}
      onclick={toggle}
      onkeydown={(e) => { if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openPicker(); } }}
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      {buttonLabel}<span class="chevron" class:open>▾</span>
    </button>
  </label>
  <button class="today-link" onclick={resetToday}>today</button>

  {#if open}
    <div class="popover" role="dialog" aria-label="Choose start date">
      <div class="head">
        <button class="nav" onclick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
        <span class="title">{monthTitle}</span>
        <button class="nav" onclick={() => shiftMonth(1)} aria-label="Next month">›</button>
      </div>
      <div class="dow-row" aria-hidden="true">
        {#each WEEKDAYS as d}<span class="dow">{d}</span>{/each}
      </div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="grid" role="grid" tabindex="-1" bind:this={grid} onkeydown={onGridKeydown}>
        {#each weeks as week}
          <div class="week" role="row">
            {#each week as d}
              <button
                type="button"
                role="gridcell"
                class="day"
                class:other={d.getUTCMonth() !== viewMonth}
                class:today={sameDay(d, today)}
                class:selected={sameDay(d, value)}
                aria-selected={sameDay(d, value)}
                aria-current={sameDay(d, today) ? 'date' : undefined}
                tabindex={sameDay(d, focusDate) ? 0 : -1}
                data-date={iso(d)}
                onclick={() => select(d)}
              >{d.getUTCDate()}</button>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .start-picker {
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .label {
    font-family: var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--text-faint);
  }

  .trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.4rem 0.55rem;
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-radius: var(--radius);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    transition: border-color 0.1s;
    min-width: 9rem;
  }
  .trigger:hover,
  .trigger:focus { outline: none; border-color: var(--azure); }

  .chevron { color: var(--text-faint); transition: transform 0.15s; }
  .chevron.open { transform: rotate(180deg); }

  .today-link {
    background: none;
    border: none;
    padding: 0 0 0.5rem;
    font-family: var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.62rem;
    font-weight: 700;
    color: var(--azure);
    cursor: pointer;
    line-height: 1;
    transition: color 0.15s;
  }
  .today-link:hover { color: var(--text); }

  .popover {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 250;
    padding: 0.5rem;
    background: var(--surface-2);
    border: 1px solid var(--hairline);
    border-radius: var(--radius);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.65);
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.4rem;
  }
  .title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1rem;
    color: var(--text);
  }
  .nav {
    width: 1.6rem;
    height: 1.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-radius: var(--radius);
    color: var(--text-dim);
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    transition: background 0.1s, color 0.1s, border-color 0.1s;
  }
  .nav:hover { background: var(--surface-2); color: var(--text); border-color: var(--text-faint); }

  .dow-row, .week {
    display: grid;
    grid-template-columns: repeat(7, 2rem);
    gap: 2px;
  }
  .dow {
    text-align: center;
    font-family: var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.58rem;
    font-weight: 700;
    color: var(--text-faint);
    padding-bottom: 0.2rem;
  }

  .day {
    height: 2rem;
    border: 1px solid transparent;
    border-radius: var(--radius);
    background: none;
    color: var(--text);
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    transition: background 0.1s, color 0.1s, border-color 0.1s;
  }
  .day:hover { background: var(--surface); }
  .day.other { color: var(--text-faint); }
  .day.today { border-color: var(--azure); color: var(--azure); }
  .day.selected { background: var(--azure); color: var(--void); font-weight: 700; border-color: var(--azure); }
</style>
