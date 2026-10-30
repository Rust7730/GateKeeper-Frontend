# 02 · Sistema de diseño

> **Estado:** fundamentos confirmados con el conector de Figma (`get_variable_defs` sobre `7:29095` Dark y `7:29207` Light) el 2026-10-29: los 19 colores en ambos modos coinciden con lo transcrito desde el navegador. Pendiente: elevación y densidad de tabla.

## 1. Cómo se convierte Figma en código

```
Figma (variables + estilos)            código
──────────────────────────             ──────────────────────────────
Variables · colección Color  ──────▶  src/styles/tokens/_color.scss      (--gk-color-*)
   modos Dark / Light        ──────▶  src/styles/themes/_dark.scss / _light.scss
Estilos de texto             ──────▶  src/styles/tokens/_typography.scss (--gk-font-*, --gk-text-*)
Variables · Spacing / Radius ──────▶  src/styles/tokens/_space.scss, _radius.scss
Efectos (sombras, blur)      ──────▶  src/styles/tokens/_elevation.scss
Componentes + variantes      ──────▶  src/app/shared/components/*
                                      src/styles/material/_theme.scss (overrides de Material)
```

Regla: el **nombre** del token en código replica el nombre de la variable en Figma, en kebab-case y con prefijo `--gk-`.
Ej.: `Color/Status/Quarantined/Bg` → `--gk-color-status-quarantined-bg`.

## 2. Tokens

> Fuente: Figma `0:1`, frames **Sistema / Fundamentos / Dark** (`7:29095`) y **/ Light** (`7:29207`), colección de variables "Gatekeeper". Confirmado con el conector MCP.

**Principio del sistema (texto del propio Figma):** jerarquía neutra; el color se reserva para estados, severidad y foco. **No hay color de acento de marca**: la acción primaria es casi blanca en Dark y casi negra en Light.

### 2.1 Color

Nombre en código = nombre de la variable en Figma con prefijo `--gk-` y `/` → `-`.

| Variable Figma        | Token CSS                  | Dark      | Light     |
| --------------------- | -------------------------- | --------- | --------- |
| `background/canvas`   | `--gk-background-canvas`   | `#101215` | `#F4F5F7` |
| `background/surface`  | `--gk-background-surface`  | `#181B20` | `#FFFFFF` |
| `background/elevated` | `--gk-background-elevated` | `#20242B` | `#FFFFFF` |
| `background/subtle`   | `--gk-background-subtle`   | `#252A32` | `#EAEDF1` |
| `text/primary`        | `--gk-text-primary`        | `#F2F4F7` | `#171B22` |
| `text/secondary`      | `--gk-text-secondary`      | `#B0B8C5` | `#505C6D` |
| `text/muted`          | `--gk-text-muted`          | `#929DAD` | `#5E6A7C` |
| `border/default`      | `--gk-border-default`      | `#343B46` | `#D0D6DF` |
| `action/background`   | `--gk-action-background`   | `#E7EBF1` | `#222832` |
| `action/foreground`   | `--gk-action-foreground`   | `#161B22` | `#FFFFFF` |
| `focus/ring`          | `--gk-focus-ring`          | `#B6CDF9` | `#244FC7` |
| `status/pending`      | `--gk-status-pending`      | `#E9C46A` | `#7D5705` |
| `status/clean`        | `--gk-status-clean`        | `#75D6AD` | `#146748` |
| `status/quarantine`   | `--gk-status-quarantine`   | `#F6BB73` | `#8C470A` |
| `status/rejected`     | `--gk-status-rejected`     | `#FF9198` | `#AB2534` |
| `severity/low`        | `--gk-severity-low`        | `#93B9E8` | `#285C9C` |
| `severity/medium`     | `--gk-severity-medium`     | `#E9C46A` | `#7D5705` |
| `severity/high`       | `--gk-severity-high`       | `#F6AA72` | `#94450D` |
| `severity/critical`   | `--gk-severity-critical`   | `#FF9198` | `#AB2534` |

Observaciones para decidir (ver § 4):

- `severity/medium` = `status/pending` y `severity/critical` = `status/rejected` en ambos modos (relacionado con la mejora D1).
- `background/surface` y `background/elevated` son iguales en Light (`#FFFFFF`): la elevación en claro depende solo de borde o sombra.

### 2.2 Tipografía

Familias: **Inter** (interfaz) e **IBM Plex Mono** (identificadores, rutas, hashes e IP). Se empaquetan en `src/assets/fonts/` (S9).

| Estilo Figma               | Token               | Familia       | Tamaño                              |
| -------------------------- | ------------------- | ------------- | ----------------------------------- |
| `Gatekeeper/Display`       | `--gk-text-display` | Inter         | 40 px                               |
| `Gatekeeper/H1`            | `--gk-text-h1`      | Inter         | 28 px                               |
| `Gatekeeper/H2`            | `--gk-text-h2`      | Inter         | 20 px                               |
| `Gatekeeper/H3`            | `--gk-text-h3`      | Inter         | 16 px                               |
| `Gatekeeper/Cuerpo`        | `--gk-text-body`    | Inter         | 14 px                               |
| `Gatekeeper/Etiqueta`      | `--gk-text-label`   | Inter         | 12 px (en mayúsculas en el ejemplo) |
| `Gatekeeper/Monoespaciada` | `--gk-text-mono`    | IBM Plex Mono | 12 px                               |

Pesos e interlineado (confirmados): **Semi Bold 600** en Display, H1, H2 y H3; **Regular 400** en Cuerpo, Etiqueta y Mono. Interlineado **1.5** y espaciado entre letras 0 en todos. El archivo usa además Inter 10 px Regular y IBM Plex Mono 11 px Regular en componentes pequeños.

### 2.3 Espaciado, radios y otros

| Grupo             | Variables Figma           | Valores                                                                                                                                                                                                                                                                                                                                                   |
| ----------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Espaciado         | `space/0` … `space/64`    | 0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 px                                                                                                                                                                                                                                                                                                      |
| Radios            | `radius/0` … `radius/999` | 0 · 4 · 8 · 12 · 999 px                                                                                                                                                                                                                                                                                                                                   |
| Foco              | — (nota del Figma)        | Anillo visible de 2 px con `focus/ring`                                                                                                                                                                                                                                                                                                                   |
| Elevación         | ⏳                        | No documentada en Fundamentos                                                                                                                                                                                                                                                                                                                             |
| Movimiento        | —                         | El Figma indica que las interacciones son representaciones estáticas. Se usan los tokens de emil-design-eng: `--gk-ease-out: cubic-bezier(0.23,1,0.32,1)`, `--gk-ease-in-out: cubic-bezier(0.77,0,0.175,1)`, `--gk-ease-drawer: cubic-bezier(0.32,0.72,0,1)`; duraciones `--gk-duration-press: 160ms`, `-tooltip: 150ms`, `-menu: 200ms`, `-modal: 250ms` |
| Breakpoints       | —                         | `mobile` 390, `tablet` 1024, `desktop` 1440 (ancho de los frames: 1440)                                                                                                                                                                                                                                                                                   |
| Densidad de tabla | ⏳                        | Leer de `Componentes / Fila tabla` en M03                                                                                                                                                                                                                                                                                                                 |

Nota de accesibilidad del Figma: contraste AA; estado con ícono + texto, nunca solo color; foco visible de 2 px; escala de espaciado de 4 px.

## 3. Inventario de componentes

| Componente (código)                                          | Nombre en Figma       | Variantes                               | Módulo | Estado |
| ------------------------------------------------------------ | --------------------- | --------------------------------------- | ------ | ------ |
| `gk-status-chip`                                             | ⏳                    | pending, clean, quarantined, rejected   | M03    | ⏳     |
| `gk-severity-chip`                                           | ⏳                    | low, medium, high, critical             | M03    | ⏳     |
| `gk-layer-badge`                                             | ⏳                    | 9 capas (ver 00-proyecto)               | M03    | ⏳     |
| `gk-hash-cell`                                               | ⏳                    | completo / truncado, copiado            | M03    | ⏳     |
| `gk-truncated-text`                                          | ⏳                    | con tooltip                             | M03    | ⏳     |
| `gk-kpi-card`                                                | ⏳                    | normal, cargando, con tendencia         | M03    | ⏳     |
| `gk-page-header`                                             | ⏳                    | con / sin acciones                      | M03    | ⏳     |
| `gk-empty-state`                                             | ⏳                    | sin datos, sin resultados, error        | M03    | ⏳     |
| `gk-skeleton`                                                | ⏳                    | línea, fila de tabla, tarjeta           | M03    | ⏳     |
| `gk-confirm-dialog`                                          | ⏳                    | normal, peligro, confirmación por texto | M03    | ⏳     |
| `gk-filter-bar`                                              | ⏳                    | —                                       | M03    | ⏳     |
| `gk-otp-input`                                               | ⏳                    | normal, error, deshabilitado            | M05    | ⏳     |
| `gk-sidebar`                                                 | ⏳                    | expandida, colapsada; analista / admin  | M06    | ⏳     |
| `gk-topbar`                                                  | ⏳                    | con contador de alertas                 | M06    | ⏳     |
| `gk-timeline-item`                                           | ⏳                    | passed, failed, skipped, running        | M08    | ⏳     |
| `gk-alert-item`                                              | ⏳                    | por severidad, nueva / leída            | M11    | ⏳     |
| Botones, inputs, select, datepicker, tabla, paginador, toast | Material con override | —                                       | M02    | ⏳     |

## 4. Mejoras propuestas al sistema de diseño

El sistema está abierto a mejoras. Estas se revisan **contra Figma** en M02 y se marcan como aceptada / rechazada / ya cubierta. Ninguna se aplica sin decisión.

| #   | Mejora                                                                                              | Motivo                                                                                       | Decisión |
| --- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| D1  | Separar paleta de **estado** (del archivo) y de **severidad** (de la alerta) aunque compartan tonos | Un archivo "en cuarentena" con alerta "media" no debe verse igual a uno con alerta "crítica" | ⏳       |
| D2  | Cada estado con **ícono + texto + color**                                                           | WCAG 1.4.1, daltonismo                                                                       | ⏳       |
| D3  | Token de **anillo de foco** propio, visible en dark y light                                         | Navegación con teclado en tablas densas                                                      | ⏳       |
| D4  | Verificar contraste ≥ 4.5:1 en texto de chips sobre su fondo, en ambos modos                        | Los chips suelen fallar en light                                                             | ⏳       |
| D5  | Tipografía mono con **cifras tabulares** para hashes, tamaños y fechas                              | Columnas alineadas                                                                           | ⏳       |
| D6  | Tokens de **densidad** de tabla (compacta / cómoda)                                                 | Analistas pasan horas en tablas                                                              | ⏳       |
| D7  | Tokens de movimiento cortos (≤ 200 ms) y respeto a `prefers-reduced-motion`                         | Herramienta de trabajo, no marketing                                                         | ⏳       |
| D8  | Estado "conexión SSE": conectado / reconectando / desconectado                                      | Necesario en M11 y no siempre está en el kit                                                 | ⏳       |
| D9  | Variante de nombre hostil: texto truncado en mono con indicador "contiene caracteres sospechosos"   | Vectores #3 y #12                                                                            | ⏳       |

## 5. Decisiones pendientes

Registro de huecos de Figma que bloquean código. Formato: `fecha · módulo · qué falta · qué se decidió`.

- 2026-10-29 · M01 · ¿Prerender estático de `/` para SEO? La propuesta descartó SSR para el dashboard; prerender en build sigue siendo app estática en Nginx. **Pendiente de decisión del usuario.** Por defecto: CSR con metadatos en `index.html`.
- 2026-10-29 · M01 · La landing no tiene frames en Figma; su dirección se define con `impeccable shape` usando la marca de `0:1`. Si se diseña en Figma después, Figma manda.
