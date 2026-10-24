// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';
import astroadmin from 'astroadmin/integration';

// astro/config's `defineConfig` in this Astro version only accepts a plain
// object (no Vite-style `(env) => config` function form — passing one here
// silently breaks config resolution instead of erroring), so the dev/build
// branch is picked with a process.argv check instead.
const isDev = process.argv.includes('dev');

// The Cloudflare adapter is build/preview-only: it makes `astro build` produce
// a Worker, but it also forces `astro dev` to run entirely inside workerd. The
// adapter is omitted in dev so the dev server (and the AstroAdmin preview that
// embeds it) runs on plain Node.
const adapterConfig = isDev ? {} : {
  adapter: cloudflare({
    // Site doesn't use Cloudflare Images or Sessions — keep the adapter from
    // provisioning bindings for either.
    imageService: 'passthrough',
  }),
};

// https://astro.build/config
export default defineConfig({
  // Site pages stay statically prerendered; only routes that opt in with
  // `export const prerender = false` are server-rendered on demand. See
  // https://docs.astro.build/en/guides/upgrade-to/v5/#removed-hybrid-rendering-mode
  output: 'static',
  ...adapterConfig,
  session: false,

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [astroadmin()],
});
