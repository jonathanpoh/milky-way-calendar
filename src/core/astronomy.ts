/**
 * astronomy-engine import wrapper.
 *
 * In Node.js / tsx (CLI): astronomy-engine is a CJS module. We use createRequire
 * to import it reliably in an ESM context, avoiding interop issues where
 * named namespace imports wrap constructors in a way that breaks `new`.
 *
 * In the browser / Vite: createRequire doesn't exist. Vite bundles CJS modules
 * and exposes named exports correctly, so `import * as` works fine.
 * Vite is configured to alias this file to `astronomy.browser.ts`.
 */
import { createRequire } from 'module';

const req = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const A = req('astronomy-engine') as typeof import('astronomy-engine');
export default A;
