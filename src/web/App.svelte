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
    <span class="best" aria-label="{best} best nights">★ {best} best</span>
    <span class="partial" aria-label="{partial} partial nights">◑ {partial} partial</span>
    <span class="none" aria-label="{rows.length - best - partial} not visible nights">✗ {rows.length - best - partial} not visible</span>
  </section>

  <Legend />
  <CalendarTable {rows} />

  <footer>
    <span class="copy">© 2026 <a href="https://jonathanpoh.photography" target="_blank" rel="noopener">Jonathan Poh</a></span>
    <a class="gh-link" href="https://github.com/jonathanpoh/milky-way-calendar" target="_blank" rel="noopener" aria-label="View source on GitHub">
      <svg class="gh-icon" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
        <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
    </a>
  </footer>
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

  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 2.5rem;
    padding-top: 1rem;
    border-top: 1px solid #1e1e2e;
  }

  .copy {
    font-size: 0.75rem;
    color: #45475a;
    letter-spacing: 0.03em;
  }

  .copy a {
    color: #585b70;
    text-decoration: none;
    transition: color 0.15s;
  }
  .copy a:hover { color: #a6adc8; }

  .gh-link {
    display: flex;
    align-items: center;
    color: #45475a;
    transition: color 0.15s;
  }
  .gh-link:hover { color: #89b4fa; }

  .gh-icon {
    width: 16px;
    height: 16px;
  }
</style>
