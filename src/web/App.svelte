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
  <section class="controls">
    <LocationPicker />
  </section>

  <section class="stats">
    <span class="best" aria-label="{best} best nights">★ {best} best</span>
    <span class="partial" aria-label="{partial} partial nights">◑ {partial} partial</span>
    <span class="none" aria-label="{rows.length - best - partial} not visible nights">✗ {rows.length - best - partial} not visible</span>
  </section>

  <Legend />
  <CalendarTable {rows} />
</main>

<style>
  main { max-width: 1400px; margin: 0 auto; padding: 1.5rem 1rem; }

  .controls { margin-bottom: 1rem; }

  .stats { display: flex; gap: 1.5rem; font-size: 0.9rem; margin-bottom: 0.5rem; }
  .best { color: #a6e3a1; }
  .partial { color: #f9e2af; }
  .none { color: #585b70; }
</style>
