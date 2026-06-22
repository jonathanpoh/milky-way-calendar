<script lang="ts">
  import LocationPicker from './components/LocationPicker.svelte';
  import CalendarTable from './components/CalendarTable.svelte';
  import HeroNight from './components/HeroNight.svelte';
  import { calendarRows } from './stores/calendar.js';

  const rows = $derived($calendarRows);
  const best = $derived(rows.filter(r => r.rating === 'best').length);
  const partial = $derived(rows.filter(r => r.rating === 'partial').length);
  const none = $derived(rows.length - best - partial);
</script>

<main>
  <HeroNight />

  <section class="controls">
    <LocationPicker />
  </section>

  <section class="summary" aria-label="Rating summary">
    <span class="item best"><b>★ {best}</b> best — core ≥2h, low moon</span>
    <span class="item partial"><b>◑ {partial}</b> partial — Milky Way visible but limited</span>
    <span class="item none"><b>✗ {none}</b> not visible — core down, or washed out by moon</span>
  </section>

  <CalendarTable {rows} />
</main>

<style>
  main {
    max-width: var(--content-max);
    margin: 0 auto;
    padding: var(--sp-5) var(--sp-4);
  }

  .controls { margin-bottom: var(--sp-5); }

  .summary {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin-bottom: var(--sp-4);
  }
  .item {
    padding: 0.3rem 0.7rem;
    border: 1px solid var(--hairline);
    border-radius: 999px;
    background: var(--surface);
    font-size: 0.78rem;
    color: var(--text-dim);
    white-space: nowrap;
  }
  .item b { font-weight: 700; font-variant-numeric: tabular-nums; }
  .item.best b    { color: var(--gc-prime); }
  .item.partial b { color: var(--moon-lbl); }
  .item.none b    { color: var(--text-faint); }

  @media (max-width: 560px) {
    .item { white-space: normal; }
  }
</style>
