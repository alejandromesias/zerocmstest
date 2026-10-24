// Runs `astro dev` in the foreground. Astro 7 auto-detects "AI agent"
// environments (via am-i-vibing) and then backgrounds the dev server and
// exits; a WebContainer with SHELL=/bin/jsh can be detected as one, which
// would leave 0cms waiting on a port nothing in its process tree serves.
// ASTRO_DEV_BACKGROUND is the flag Astro's own background child runs with,
// and it skips that detection. Set here, not inline in the npm script, so it
// works on Windows and in the WebContainer shell alike.
process.env.ASTRO_DEV_BACKGROUND ??= '1';

// Diagnostics for 0cms: in its WebContainer `astro dev` prints nothing and
// never listens. The heartbeat shows whether the main thread is blocked (it
// stops) or Astro is merely stuck awaiting something (it keeps ticking).
const t0 = Date.now();
const diag = (msg) => console.log(`[dev.mjs +${((Date.now() - t0) / 1000).toFixed(1)}s] ${msg}`);
diag(`node ${process.version} ${process.platform}/${process.arch} SHELL=${process.env.SHELL} npm_config_yes=${process.env.npm_config_yes} webcontainer=${process.versions.webcontainer ?? '-'}`);
setInterval(() => diag('heartbeat'), 5000).unref();
process.on('exit', (code) => diag(`exit ${code}`));
process.on('uncaughtException', (e) => { diag(`uncaught: ${e?.stack ?? e}`); process.exit(1); });
process.on('unhandledRejection', (e) => diag(`unhandled rejection: ${e?.stack ?? e}`));

diag('importing astro cli');
await import('../node_modules/astro/bin/astro.mjs');
