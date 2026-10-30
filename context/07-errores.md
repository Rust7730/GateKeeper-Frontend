# 07 · Bitácora de errores

Cada error se registra **antes** de corregirlo, con la lección que evita repetirlo. Si la lección es una regla general, se copia a `01-reglas.md` con la referencia `[E-xxx]`.

Plantilla: [templates/error-entry.md](templates/error-entry.md).

## Resumen

| ID    | Fecha      | Módulo     | Tipo    | Título                                                              | ¿Generó regla?                 |
| ----- | ---------- | ---------- | ------- | ------------------------------------------------------------------- | ------------------------------ |
| E-001 | 2026-10-29 | planeación | proceso | Archivo escrito en la carpeta de adjuntos en vez del proyecto       | Sí · 01-reglas A4              |
| E-002 | 2026-10-29 | planeación | diseño  | Figma no se pudo leer al planear; tokens quedaron sin valores       | Sí · 01-reglas D1 (ya existía) |
| E-003 | 2026-10-29 | M00        | proceso | Comandos de Claude Code rechazados al escribir en `.claude/`        | Sí · 01-reglas A6              |
| E-004 | 2026-10-29 | M00        | proceso | `npm install` lanzado desde Linux dentro de la carpeta de Windows   | Sí · 01-reglas A5              |
| E-005 | 2026-10-29 | M00        | regla   | Convención de nombres del plan no coincidía con el CLI 22           | Sí · 01-reglas C6              |
| E-006 | 2026-10-29 | M00        | regla   | Commits con atribución a la IA (`Co-Authored-By`, `Claude-Session`) | Sí · 01-reglas E6              |

---

### E-001

- **Fecha:** 2026-10-29 · **Módulo:** planeación · **Tipo:** proceso
- **Qué pasó:** al generar esta documentación, el primer `CLAUDE.md` se escribió en la carpeta de archivos adjuntos (`/mnt/user-data/uploads/…`) en lugar de la carpeta de trabajo del proyecto.
- **Causa:** se reutilizó la ruta de un archivo adjunto como destino sin verificar el directorio de trabajo.
- **Corrección:** se copió a la carpeta del proyecto y el resto de archivos se crearon ahí.
- **Lección / regla:** escribir siempre dentro del repo del proyecto; los adjuntos y las carpetas de origen son de solo lectura. Antes de crear el primer archivo de una sesión, confirmar con `pwd` dónde está la raíz del proyecto.

### E-002

- **Fecha:** 2026-10-29 · **Módulo:** planeación · **Tipo:** diseño
- **Qué pasó:** las herramientas del conector de Figma no estaban cargadas en la sesión de planeación, así que no se pudieron leer variables ni capturas de los nodos `0:1`, `3:2`, `3:3`, `3:4`.
- **Causa:** el conector aparecía como conectado en el registro, pero sus herramientas no estaban disponibles en esa sesión.
- **Corrección:** el sistema de diseño se documentó como estructura con valores ⏳, y M02 empieza obligatoriamente por la extracción.
- **Lección / regla:** nunca rellenar tokens con valores supuestos. Al inicio de M01 (marca de la landing) y de M02, verificar que las herramientas de Figma responden (`get_metadata` sobre `0:1`); si no, pedir al usuario una exportación de variables (JSON) o capturas antes de escribir CSS.

<!-- Nuevas entradas abajo, en orden ascendente -->

### E-003

- **Fecha:** 2026-10-29 · **Módulo:** M00 · **Tipo:** proceso
- **Qué pasó:** se intentó escribir `/modulo-inicio`, `/modulo-cierre` y `/registrar-error` directamente en `.claude/commands/` desde la sesión remota y el sistema lo rechazó.
- **Causa:** se asumió permiso de escritura en `.claude/` sin comprobarlo; las herramientas remotas no pueden escribir en las carpetas de configuración de Claude.
- **Corrección:** los comandos se versionan en `tools/claude-commands/` y `npm run setup:claude` los copia a `.claude/commands/` en la máquina de la persona.
- **Lección / regla:** nada que deba vivir en `.claude/` se escribe remotamente; se versiona en `tools/` con un script de instalación.

### E-004

- **Fecha:** 2026-10-29 · **Módulo:** M00 · **Tipo:** proceso
- **Qué pasó:** `npm install` se ejecutó desde la VM Linux directamente en la carpeta del proyecto en Windows. Fue muy lento, quedó a medias y, de haber terminado, habría dejado binarios nativos de Linux (esbuild, rollup) que no funcionan en Windows.
- **Causa:** no se consideró que el sistema que instala y el que ejecuta eran distintos.
- **Corrección:** se borró el `node_modules` parcial; la verificación se hizo en una copia local en Linux y a la carpeta solo se sincronizó código y `package-lock.json`.
- **Lección / regla:** las dependencias se instalan en la máquina que va a correr el proyecto. El agente verifica en una copia aparte.

### E-005

- **Fecha:** 2026-10-29 · **Módulo:** M00 · **Tipo:** regla
- **Qué pasó:** el plan pedía archivos `*.component.ts`, `environment.prod.ts` y "Jasmine/Karma o Jest", pero el CLI 22 genera `app.ts` (guía de estilo 2025), `environment.development.ts` y usa Vitest.
- **Causa:** la arquitectura se escribió antes de crear el proyecto, con convenciones de versiones anteriores de Angular.
- **Corrección:** se actualizaron `03-arquitectura.md` y `01-reglas.md` a lo que genera el CLI.
- **Lección / regla:** cuando el plan y la herramienta discrepan en convenciones, manda la herramienta y se corrige el plan en el mismo módulo.

### E-006

- **Fecha:** 2026-10-29 · **Módulo:** M00 · **Tipo:** regla
- **Qué pasó:** los 4 commits de M00 se crearon con las líneas `Co-Authored-By: Claude…` y `Claude-Session: …`. La persona no quiere atribución a la IA en ningún commit.
- **Causa:** se aplicó la configuración por defecto de la herramienta sin preguntar la preferencia del proyecto.
- **Corrección:** se reescribió el historial local (aún sin remoto) para quitar esas líneas, se movió el tag `m00` y se añadió `scripts/check-commit-msg.mjs` al hook `commit-msg`.
- **Lección / regla:** la autoría de commits, tags y PR es solo de la persona. Ver 01-reglas E6.
