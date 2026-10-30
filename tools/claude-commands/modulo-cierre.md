---
description: Cierra un módulo del plan de Gatekeeper con el checklist completo
argument-hint: mNN
---

Vas a cerrar el módulo **$ARGUMENTS**.

1. Recorre `context/06-checklist-modulo.md` punto por punto y marca cada casilla con evidencia (comando corrido, captura revisada, archivo). Lo que no aplique lleva "N/A" y el motivo.
2. Compara las pantallas del módulo contra sus frames de Figma (`context/08-figma.md`).
3. Si el módulo tiene UI: corre `/impeccable critique` y `/impeccable audit` sobre sus rutas. Corrige los hallazgos de severidad alta antes de seguir.
4. Si el módulo tiene animaciones: revísalas con los criterios de `emil-design-eng` y entrega la revisión en tabla Before / After / Why.
5. Verifica que `npm run check:index` pase y que los `INDEX.md` tengan descripciones reales (sin ⏳).
6. Si durante el módulo hubo errores, confirma que están en `context/07-errores.md` con su lección.
7. Ejecuta `npm run module:close -- $ARGUMENTS` y reporta el resultado.
