<script lang="ts">
  import LocationPicker from './components/LocationPicker.svelte';
  import CalendarTable from './components/CalendarTable.svelte';
  import Legend from './components/Legend.svelte';
  import { calendarRows } from './stores/calendar.js';

  const rows = $derived($calendarRows);
  const best = $derived(rows.filter(r => r.rating === 'best').length);
  const partial = $derived(rows.filter(r => r.rating === 'partial').length);
</script>

<main>
  <header>
    <h1>🌌 Milky Way Calendar</h1>
    <p class="subtitle">Plan your Milky Way astrophotography sessions</p>
  </header>

  <section class="controls">
    <LocationPicker />
  </section>

  <section class="stats">
    <span class="best">★ {best} best</span>
    <span class="partial">◑ {partial} partial</span>
    <span class="none">✗ {rows.length - best - partial} not visible</span>
  </section>

  <Legend />
  <CalendarTable {rows} />
</main>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; }
  :global(body) {
    margin: 0;
    background: #11111b;
    color: #cdd6f4;
    font-family: 'Segoe UI', system-ui, sans-serif;
  }

  main { max-width: 1400px; margin: 0 auto; padding: 1.5rem 1rem; }
  header { margin-bottom: 1.5rem; }
  h1 { margin: 0 0 0.25rem; font-size: 1.8rem; }
  .subtitle { margin: 0; color: #a6adc8; font-size: 0.9rem; }

  .controls { margin-bottom: 1rem; }

  .stats { display: flex; gap: 1.5rem; font-size: 0.9rem; margin-bottom: 0.5rem; }
  .best { color: #a6e3a1; }
  .partial { color: #f9e2af; }
  .none { color: #585b70; }
</style>
