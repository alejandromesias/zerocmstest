import { config, fields, singleton } from "@keystatic/core";

const isLocal = import.meta.env.DEV;

export default config({
  storage: isLocal
    ? { kind: 'local' }
    : { kind: 'cloud' },
  
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
      },
    }),
  },
});
