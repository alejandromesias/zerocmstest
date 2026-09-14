import { config, fields, singleton } from "@keystatic/core";

const isLocal = import.meta.env.DEV;

export default config({
  storage: isLocal
    ? { kind: 'local' }
    // Cloud storage reads directly from the GitHub repo, which has no concept
    // of the local dev cwd (code/) that local storage resolves paths against.
    // The repo root has no src/ or keystatic.config.ts of its own — everything
    // lives under code/ — so pathPrefix tells Cloud to look for content there.
    : { kind: 'cloud', pathPrefix: 'code' },
  
  // Keystatic Cloud project details
  cloud: {
    project: 'test-team-amesias/pocwork1keystatic1',
  },
  singletons: {
    heroPagina: singleton({
      label: "Hero — Página principal",
      path: "src/content/hero/pagina",
      schema: {
        titulo: fields.text({
          label: "Título",
          description: "Texto principal del hero (subtexto bajo el encabezado).",
          multiline: true,
        }),
        subtitulo: fields.text({
          label: "Subtítulo",
          description: "Línea de confianza mostrada bajo los botones de acción.",
          multiline: true,
        }),
        retrato: fields.image({
          label: "Retrato",
          description: "Foto mostrada junto al encabezado del hero.",
          directory: "src/content/hero",
          publicPath: "./",
        }),
      },
    }),
  },
});
