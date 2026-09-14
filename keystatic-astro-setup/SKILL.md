# Adding Keystatic to an Astro + Cloudflare Workers project

Reference notes from wiring `@keystatic/astro` into this project. Astro version at
the time: `astro@7.3.1`. Keystatic: `@keystatic/astro@6.0.0`, `@keystatic/core@0.6.9`.
Deploy target: Cloudflare Workers via `wrangler`, static output with selective SSR.

Content-specific details (field labels, singleton names, translated copy, the exact
`Hero.astro` markup) are intentionally left out — this is about the reusable
integration mechanics, not this particular site's content.

## 1. Install and wire up the integration

```bash
npm install @keystatic/core @keystatic/astro @astrojs/react react react-dom
```

`@astrojs/react` + `react`/`react-dom` are required even if the project has no React
components of its own — Keystatic's admin UI is a React app, and Astro needs the
React integration installed to render it.

In `astro.config.mjs`:

```js
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

export default defineConfig({
  integrations: [react(), keystatic()],
});
```

Create `keystatic.config.ts` at the project root (same directory as `astro.config.mjs`
— see the monorepo caveat in section 4 if that root isn't the repo root):

```ts
import { config, fields, singleton } from "@keystatic/core";

export default config({
  storage: { kind: 'local' },
  singletons: {
    mySingleton: singleton({
      label: "...",
      path: "src/content/my-content/entry",
      schema: { /* fields.text(), fields.image(), etc. */ },
    }),
  },
});
```

Use `singleton()` for content that only ever has one instance (a page section, site
settings). Use `collection()` for repeating content (blog posts, team members) — it
needs a wildcard path (`content/posts/*`) and a `slugField`.

In dev, the admin UI is served at `/keystatic` (and its API at `/api/keystatic/...`)
automatically — no route setup needed. `@keystatic/astro`'s integration hook injects
both routes itself, each already marked `prerender: false`.

## 2. `defineConfig` may not support a function form — check your Astro version

Vite's `defineConfig((env) => ({...}))` function form is a common pattern for
picking config conditionally (e.g. dev vs build). **Astro 7.3.1's `defineConfig` does
not support this** — its type signature only accepts a plain object
(`defineConfig(config: AstroUserConfig)`), and passing a function silently breaks
config resolution (routes stop registering, no error is thrown) instead of failing
loudly. Confirmed by reading `node_modules/astro/dist/config/index.d.ts`.

If you need dev/build-conditional config, use a plain object with a `process.argv`
check instead:

```js
const isDev = process.argv.includes('dev');
const adapterConfig = isDev ? {} : { adapter: cloudflare({ ... }) };

export default defineConfig({
  ...adapterConfig,
  // ...
});
```

Don't assume this limitation still applies to newer Astro versions — check
`defineConfig`'s type signature in the installed version before reaching for this
workaround.

## 3. The Cloudflare adapter breaks Keystatic's local storage mode in dev — omit it there

Keystatic's `storage: { kind: 'local' }` mode reads and writes content files
directly via Node's `fs`. `@keystatic/core` ships separate `.node.js` (real
filesystem) and `.worker.js` builds — the worker build has no local read/write
support, only the Node build does.

`@astrojs/cloudflare` makes `astro dev` run entirely inside `workerd` (Cloudflare's
real Workers runtime, via `@cloudflare/vite-plugin`) as soon as the adapter is
attached — there's no adapter option to opt out of this for dev specifically (only
`prerenderEnvironment`, which affects build-time prerendering only, not dev). Under
workerd, `@keystatic/core`'s Node-only local-storage code path breaks with `exports
is not defined` (a CJS/ESM interop failure specific to that runtime).

Fix: only attach the adapter outside `astro dev` (see the `isDev` check above). The
adapter is a build/preview-only concern — `astro dev` doesn't need any adapter for
`prerender: false` routes to work; that's a build-time-only requirement
(`NoAdapterInstalled` is thrown by `astro build`, not by `astro dev`).

```js
const adapterConfig = isDev ? {} : {
  adapter: cloudflare({ imageService: 'passthrough' }),
};
```

## 4. Keystatic Cloud storage + a monorepo-style repo layout needs `pathPrefix`

If the Astro project (and `keystatic.config.ts`) lives in a subdirectory of the git
repo rather than at the repo root (e.g. everything under `code/`), **local** storage
still works fine — it resolves content paths against `process.cwd()`, which is
already the subdirectory when you run `astro dev` from there.

**Cloud** storage (and `github` storage) has no such cwd — it fetches files
directly from GitHub via
`https://raw.githubusercontent.com/<repo>/<sha>/<path>`, with `path` taken literally
from the singleton/collection's `path` field, relative to the **repo root**. Without
correcting for the subdirectory, this 404s silently and the admin UI just renders
blank fields instead of erroring.

Fix: set `pathPrefix` on the remote storage config to the subdirectory:

```ts
storage: isLocal
  ? { kind: 'local' }
  : { kind: 'cloud', pathPrefix: 'code' },
```

`pathPrefix` (and `branchPrefix`) are only valid on `github`/`cloud` storage kinds,
not `local` — confirmed in `@keystatic/core`'s `config.d.ts`
(`CommonRemoteStorageConfig`). `branchPrefix` is unrelated to access control: it's
only prepended (with no separator) to branch names Keystatic creates through its own
UI, and used to filter the branch switcher — it does not restrict who can create
branches or force direct-to-main commits. That's a GitHub branch-protection /
Keystatic Cloud project-settings concern, not a `keystatic.config.ts` one.

## 5. `astro build` needs an adapter once any route is `prerender: false`

Keystatic's injected admin/API routes are always `prerender: false`. As soon as
that's true for any route, `astro build` requires an adapter
(`output: 'static'` is otherwise fine — Astro 5+ merged what used to be `'hybrid'`
mode into `'static'`; any route can opt into SSR individually via
`prerender: false`, no separate output mode needed).

```bash
npm install @astrojs/cloudflare
```

```js
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  adapter: cloudflare({ imageService: 'passthrough' }), // see note below
  session: false, // ditto
});
```

`imageService: 'passthrough'` and `session: false` are opt-outs, not required for
Keystatic itself — omit them and the adapter otherwise auto-provisions a Cloudflare
Images binding and a KV namespace for sessions on every deploy. Skip both unless the
project actually uses Cloudflare Images or Astro Sessions.

### Wrangler config needs updating for the adapter's output layout

The adapter splits build output into `dist/client` (static assets) and
`dist/server` (the worker entrypoint), instead of a single flat `dist/`. Update
`wrangler.jsonc` accordingly:

```jsonc
{
  "main": "@astrojs/cloudflare/entrypoints/server",
  "assets": {
    "directory": "./dist/client",
    "binding": "ASSETS"
  }
}
```

Validate with `wrangler deploy --dry-run` before an actual deploy — it resolves the
worker entry and reports exactly what bindings/assets it picked up.

## 6. TypeScript: `process` needs Node types, but React types usually don't need adding

If `astro.config.mjs`/`keystatic.config.ts` use `process.*` (e.g. the `isDev` check
above), add:

```bash
npm install --save-dev @types/node
```

```jsonc
// tsconfig.json
{ "compilerOptions": { "types": ["node"] } }
```

`@types/react` / `@types/react-dom` do **not** need to be added as explicit
dependencies just because `@astrojs/react` is installed — `@keystatic/astro` and
`@keystatic/core` both already declare `@types/react` as their own dependency, so
it's already resolvable transitively. Verified by removing both from `package.json`
and confirming `astro build`, `astro dev`, and the admin UI still work unchanged.
`jsx`/`jsxImportSource` in `tsconfig.json` (added by `@astrojs/react`) are still
needed regardless:

```jsonc
{ "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "react" } }
```

## 7. Content collections: images need Astro's `image()` helper, not a static import

For a content field that should be swappable through Keystatic (rather than baked in
via a static `import ... from "..."` in a component), the content collection schema
and the Keystatic field need to agree on the same relative-path convention:

- `content.config.ts`: schema becomes a function receiving `{ image }`, with the
  field declared as `image()` — this is what makes Astro validate the stored path
  and transform it into optimized image metadata usable by `<Image>`.

  ```ts
  schema: ({ image }) => z.object({ myImage: image() }),
  ```

- `keystatic.config.ts`: use `fields.image()`, with `directory` pointing at the
  content entry's own folder and `publicPath: "./"` so the stored value gets the
  `./` prefix Astro's `image()` helper expects (a bare filename without `./` is
  treated as a bare module specifier, not a relative path):

  ```ts
  myImage: fields.image({ directory: "src/content/my-content", publicPath: "./" }),
  ```

- The actual image file needs to live next to the content entry (not in
  `src/assets/` or similar) — Astro resolves `image()` paths relative to the content
  file's own directory.

- The consuming component should read the image from the content entry
  (`entry.data.myImage`) rather than a static import — otherwise replacing the file
  through Keystatic has no effect on what actually renders.

## 8. A vanity `/admin` route to the panel

Prefer Astro's built-in `redirects` config over a hand-written `.astro` page with
`export const prerender = false` + `Astro.redirect(...)`:

```js
export default defineConfig({
  redirects: { '/admin': '/keystatic' },
});
```

It's the more robust option, not less: a manual `prerender: false` page needs an
adapter to build, exactly like Keystatic's own routes, and hard-fails
(`NoAdapterInstalled`) without one. The config-based `redirects` option degrades
gracefully instead — with no adapter at build time it falls back to a static HTML
page with a `<meta http-equiv="refresh">` tag rather than failing the build.
Verified directly: in `astro dev` (no adapter attached at all, per section 3) it
still returns a real HTTP `301`; at build time, `@astrojs/cloudflare` writes a proper
`_redirects` entry instead of a static page.

## 9. Customizing the admin UI

`keystatic.config.ts` → `ui`:

```ts
ui: {
  brand: { name: 'My Project' },       // replaces the default "Keystatic" title
  navigation: {                          // replaces the default Collections/Singletons
    Content: ['mySingleton', 'myCollection'], // grouping with custom named sections
  },
},
```

There's no direct way to rename the default "SINGLETONS"/"COLLECTIONS" section
labels — `navigation` replaces that grouping entirely with your own named sections,
each listing the collection/singleton keys that belong under it.
