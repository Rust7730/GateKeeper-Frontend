---
description: Registra un error en la bitácora antes de corregirlo
argument-hint: 'título corto del error'
---

Registra el error **$ARGUMENTS** en la bitácora del proyecto.

1. Identifica el módulo actual en `context/progreso.md` y el tipo (código, proceso, diseño, seguridad, regla).
2. Ejecuta `npm run error:new -- "$ARGUMENTS" <mNN> <tipo>`.
3. Completa en `context/07-errores.md` los campos ⏳ de la nueva entrada: qué pasó (síntoma), causa raíz, corrección y lección.
4. Si la lección aplica más allá de este caso, añádela como regla en `context/01-reglas.md` con la referencia `[E-xxx]` y actualiza la columna "¿Generó regla?" del resumen.
5. Solo después corrige el error, y haz un commit `docs(context): registrar E-xxx` separado del commit de la corrección.
