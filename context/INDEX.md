# Índice de contexto

Toda la documentación que gobierna el frontend. Los archivos están numerados en el orden en que conviene leerlos la primera vez.

| #   | Archivo                                            | Para qué sirve                                                     | Cuándo se actualiza                    |
| --- | -------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------- |
| 00  | [00-proyecto.md](00-proyecto.md)                   | Qué es Gatekeeper, roles, estados, pantallas, alcance              | Solo si cambia la propuesta            |
| 01  | [01-reglas.md](01-reglas.md)                       | Reglas obligatorias: seguridad, código, diseño, git                | Cuando un error genera una regla nueva |
| 02  | [02-sistema-de-diseno.md](02-sistema-de-diseno.md) | Tokens, componentes, mapeo Figma → código, mejoras propuestas      | Al extraer o cambiar tokens (M02)      |
| 03  | [03-arquitectura.md](03-arquitectura.md)           | Árbol de carpetas, capas, convenciones de nombres, librerías       | Al crear o mover carpetas              |
| 04  | [04-plan-modulos.md](04-plan-modulos.md)           | Plan M00–M15: alcance, entregable, criterio de aceptación, commits | Al cerrar o reordenar módulos          |
| 05  | [05-api-contratos.md](05-api-contratos.md)         | Endpoints, modelos TypeScript, datos mock y fixtures hostiles      | Cuando cambie el contrato del backend  |
| 06  | [06-checklist-modulo.md](06-checklist-modulo.md)   | Definición de "terminado" para cada módulo                         | Rara vez                               |
| 07  | [07-errores.md](07-errores.md)                     | Bitácora de errores y lección aprendida                            | **Cada vez que se cometa un error**    |
| 08  | [08-figma.md](08-figma.md)                         | Links y nodos de Figma, cómo extraer diseño                        | Cuando cambie el archivo de Figma      |
| 09  | [09-automatizacion.md](09-automatizacion.md)       | Scripts, hooks de git y comandos de Claude Code                    | Al añadir o cambiar una automatización |
| —   | [progreso.md](progreso.md)                         | Tablero de estado de módulos                                       | Al iniciar y cerrar cada módulo        |
| —   | [templates/](templates/INDEX.md)                   | Plantillas de INDEX.md, entrada de error y descripción de módulo   | Rara vez                               |

## Archivos relacionados fuera de `context/`

| Archivo                          | Qué es                                                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`../PRODUCT.md`](../PRODUCT.md) | Ficha de producto que usa la skill _impeccable_ (`.claude/skills/impeccable`). Debe ser coherente con `00-proyecto.md`; si cambia uno, se revisa el otro. |

## Índices de carpetas del código

Cada carpeta dentro de `src/app` y `src/styles` tiene su propio `INDEX.md` (plantilla en [templates/INDEX.folder.md](templates/INDEX.folder.md)). El árbol completo y la lista de índices están en [03-arquitectura.md § Índices de carpetas](03-arquitectura.md#índices-de-carpetas).
