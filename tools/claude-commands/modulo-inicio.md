---
description: Inicia un módulo del plan de Gatekeeper con todo el contexto cargado
argument-hint: mNN [nombre-corto]
---

Vas a iniciar el módulo **$ARGUMENTS** del frontend de Gatekeeper.

1. Lee, en este orden: `CLAUDE.md`, `context/01-reglas.md`, `context/07-errores.md`, `context/progreso.md`.
2. Abre la sección del módulo en `context/04-plan-modulos.md` y resume en 3 a 5 líneas: objetivo, entregable, criterios de aceptación.
3. Revisa en `context/08-figma.md` qué nodos de Figma le corresponden. Si el conector de Figma está disponible, confirma que responde con `get_metadata` sobre esos nodos; si no, dilo y aplica la lección de E-002.
4. Si el módulo tiene UI, corre `.claude/skills/impeccable/scripts/impeccable context` y di qué modo aplica (Persuade para la landing, Operate para el dashboard). Si tiene movimiento, recuerda las reglas de `emil-design-eng` en `01-reglas § D2`.
5. Ejecuta `npm run module:start -- $ARGUMENTS`.
6. Lista los errores de `07-errores.md` que son relevantes para este módulo.
7. Propón el orden de commits del módulo y espera confirmación antes de escribir código.
