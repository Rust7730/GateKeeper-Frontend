# 09 · Automatización

Todo lo que se repite en cada módulo está automatizado para que no dependa de la memoria (de una persona o de un agente).

## Scripts (`scripts/`, Node sin dependencias)

| Comando                                      | Qué hace                                                                                                                                                 | Cuándo corre                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `npm run check:index`                        | Verifica que cada carpeta de `src/` y `scripts/` tenga `INDEX.md` y que cada archivo y subcarpeta aparezca en él                                         | `verify`, pre-commit        |
| `npm run index:fix`                          | Crea los `INDEX.md` que falten y añade filas `⏳` para los archivos no listados (luego se completa la descripción a mano)                                | A mano                      |
| `npm run check:security`                     | Busca patrones prohibidos de `01-reglas § B` en `src/` (innerHTML, bypassSecurityTrust, tokens en storage, EventSource, `document.write`, tokens en URL) | `verify`, pre-commit        |
| `npm run error:new -- "título" [mNN] [tipo]` | Añade la siguiente entrada `E-xxx` a `07-errores.md` (detalle + fila del resumen)                                                                        | Al cometer un error         |
| `npm run module:start -- mNN nombre`         | Crea la rama `feat/mNN-nombre` y marca el módulo 🟨 con fecha en `progreso.md`                                                                           | Al empezar un módulo        |
| `npm run module:close -- mNN`                | Corre `verify`; si pasa, marca ✅ con fecha y tag, hace commit `docs(context)` y crea el tag `mNN`                                                       | Al cerrar un módulo         |
| `npm run verify`                             | `lint` + `check:index` + `check:security` + `test` + `build`                                                                                             | Antes de cada cierre; en CI |

## Hooks de git (husky)

| Hook         | Acción                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pre-commit` | `lint-staged` (Prettier + ESLint en archivos tocados) · `check:index` · `check:security`                                                        |
| `commit-msg` | `commitlint`: Conventional Commits con scope obligatorio `mNN`, `context`, `deps` o `ci` · `check-commit-msg.mjs`: rechaza atribución a IA (E6) |

## Comandos de Claude Code (`.claude/commands/`)

| Comando              | Para qué                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `/modulo-inicio mNN` | Lee reglas, errores y progreso; abre el módulo del plan; corre `module:start`; lista los nodos de Figma y las skills que aplican |
| `/modulo-cierre mNN` | Recorre `06-checklist-modulo.md`, corre `impeccable critique/audit` si el módulo tiene UI, `module:close`                        |
| `/registrar-error`   | Pregunta qué pasó, corre `error:new` y, si la lección es general, la copia a `01-reglas.md`                                      |

## Hook de impeccable (ya existente)

`.claude/settings.json` corre el detector de diseño de impeccable al iniciar sesión, después de cada `Edit`/`Write` en archivos de UI y en una pasada profunda al terminar. No se modifica desde aquí.

## Qué no se automatiza a propósito

- La aprobación de la dirección visual (`impeccable shape`): la decide el usuario.
- La comparación visual contra Figma: requiere ojos; el checklist la exige.
- El merge a `main`: se hace a mano tras revisar.
