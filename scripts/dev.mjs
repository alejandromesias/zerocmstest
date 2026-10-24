// Runs `astro dev` in the foreground. Astro 7 auto-detects "AI agent"
// environments (via am-i-vibing) and then backgrounds the dev server and
// exits; a WebContainer with SHELL=/bin/jsh can be detected as one, which
// would leave 0cms waiting on a port nothing in its process tree serves.
// ASTRO_DEV_BACKGROUND is the flag Astro's own background child runs with,
// and it skips that detection. Set here, not inline in the npm script, so it
// works on Windows and in the WebContainer shell alike.
process.env.ASTRO_DEV_BACKGROUND ??= '1';
await import('../node_modules/astro/bin/astro.mjs');
