# `src/app/features/dashboard`

**Propósito:** Consola de pruebas de la API (se muestra dentro del Workspace)
**Capa:** features
**Módulo que la creó:** M10
**Puede importar de:** core, shared, features/overview (preferencias y ajustes)

## Contenido

| Archivo / carpeta   | Qué es                                                                       | Módulo |
| ------------------- | ---------------------------------------------------------------------------- | ------ |
| `api-endpoints.ts`  | Catálogo de endpoints y agrupación por carpeta                               | M10    |
| `api-responses.ts`  | Respuestas posibles de cada endpoint (código, cuándo ocurre y cuerpo)        | M10    |
| `console-page.ts`   | Página de consola reutilizada por cada sección con su carpeta de la API      | M10    |
| `console-page.html` | Consola de pruebas en tres pasos: elegir, completar y revisar la respuesta   | M10    |
| `docs-page.ts`      | Guía de integración completa de la API (sección Documentación)               | M10    |
| `docs-page.html`    | Contenido de la guía: inicio rápido, referencia, estados, límites y ejemplos | M10    |
| `docs-page.scss`    | Estilos de la guía con índice lateral fijo                                   | M10    |
| `console-page.scss` | Estilos de la consola de pruebas                                             | M10    |
