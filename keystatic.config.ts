import { config, fields, singleton } from "@keystatic/core";

export default config({
  storage: {
    kind: "local",
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
