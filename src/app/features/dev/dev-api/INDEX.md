# `src/app/features/dev/dev-api`

**Propósito:** Página `/dev/api` que lista archivos del backend simulado con paginación y filtro por estado
**Capa:** features
**Módulo que la creó:** M04
**Puede importar de:** core (api, models)

## Contenido

| Archivo / carpeta | Qué es                                              | Módulo |
| ----------------- | --------------------------------------------------- | ------ |
| `dev-api.ts`      | Componente `DevApi` (OnPush, signals, `rxResource`) | M04    |
| `dev-api.html`    | Tabla, filtro y paginación                          | M04    |
| `dev-api.scss`    | Estilos con tokens `--gk-*`                         | M04    |

## Notas

- Usa `AdminFilesApi`, nunca `HttpClient` (C4). No sabe si responde el mock o la API real (C5).
- Los archivos restringidos por K20 muestran "Restringido" en vez del nombre.
