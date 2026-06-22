import { mount } from 'svelte';
import App from './App.svelte';
import ThemeToggle from './components/ThemeToggle.svelte';
import { initUrlSync } from './url-sync.js';

// Restore state from the URL (and cookie/GeoIP fallback) before mounting.
initUrlSync();

const app = mount(App, { target: document.getElementById('app')! });

const toggleTarget = document.getElementById('theme-toggle');
if (toggleTarget) mount(ThemeToggle, { target: toggleTarget });

export default app;
