# `scripts`

**Propósito:** automatizaciones del flujo por módulos (ver `context/09-automatizacion.md`).
**Capa:** herramientas de desarrollo; no se empaquetan en la app.
**Módulo que la creó:** M00
**Puede importar de:** solo módulos de Node (`node:*`) y `lib.mjs`.

## Contenido

| Archivo / carpeta    | Qué es                                                                                       | Módulo |
| -------------------- | -------------------------------------------------------------------------------------------- | ------ |
| `lib.mjs`            | Rutas del proyecto, lectura/escritura, `sh`, `fail`, normalizar `mNN`                        | M00    |
| `check-index.mjs`    | Verifica (o con `--fix` crea) los `INDEX.md` de `src/` y `scripts/`                          | M00    |
| `check-security.mjs` | Busca patrones prohibidos de `01-reglas § B` en `src/`                                       | M00    |
| `new-error.mjs`      | Añade una entrada `E-xxx` a `context/07-errores.md`                                          | M00    |
| `module.mjs`         | `start` / `close` de un módulo: rama, `progreso.md`, `verify`, tag                           | M00    |
| `setup-claude.mjs`   | Instala los comandos de `tools/claude-commands` en `.claude/commands` (correr en tu máquina) | M00    |
