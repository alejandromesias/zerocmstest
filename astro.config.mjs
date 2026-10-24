// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import astroadmin from 'astroadmin/integration';

// zerocms-root: no deploy adapter. The Cloudflare adapter (and wrangler) pull in
// workerd, a native binary that can't run in 0cms's WebContainer, and the
// site is fully static anyway.

// https://astro.build/config
export default defineConfig({
  output: 'static',
  session: false,

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [astroadmin()],
});
