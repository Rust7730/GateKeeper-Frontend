# `src/app/features/dev`

**Propósito:** Herramientas solo de desarrollo (styleguide en M02–M03, API simulada en M04)
**Capa:** features
**Módulo que la creó:** M00 (vacía) · M04 añade `dev-api/`
**Puede importar de:** core, shared

## Contenido

| Archivo / carpeta | Qué es                                                          | Módulo |
| ----------------- | --------------------------------------------------------------- | ------ |
| `dev-api/`        | `/dev/api`: tabla paginada de archivos mock (aceptación de M04) | M04    |

## Notas

- Las rutas de esta carpeta solo se registran con `!environment.production` (ver `app.routes.ts`).
