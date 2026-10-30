# 02 · Sistema de diseño

> **Estado:** estructura definida, **valores pendientes de extraer de Figma** (nodo `0:1`). Ver [E-002](07-errores.md#e-002).
> Ningún valor de esta página se usa en código hasta que la columna "Valor Figma" esté llena.

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

### 2.1 Color · base

| Token                       | Uso                   | Valor Figma (Dark) | Valor Figma (Light) |
| --------------------------- | --------------------- | ------------------ | ------------------- |
| `--gk-color-bg`             | Fondo de la app       | ⏳                 | ⏳                  |
| `--gk-color-surface`        | Tarjetas, tablas      | ⏳                 | ⏳                  |
| `--gk-color-surface-raised` | Modales, menús        | ⏳                 | ⏳                  |
| `--gk-color-border`         | Bordes y divisores    | ⏳                 | ⏳                  |
| `--gk-color-text`           | Texto principal       | ⏳                 | ⏳                  |
| `--gk-color-text-muted`     | Texto secundario      | ⏳                 | ⏳                  |
| `--gk-color-accent`         | Acción primaria, foco | ⏳                 | ⏳                  |
| `--gk-color-focus-ring`     | Anillo de foco        | ⏳                 | ⏳                  |

### 2.2 Color · estados de archivo (fondo / texto / borde / ícono)

| Estado        | `-bg` | `-fg` | `-border` | Ícono |
| ------------- | ----- | ----- | --------- | ----- |
| `pending`     | ⏳    | ⏳    | ⏳        | ⏳    |
| `clean`       | ⏳    | ⏳    | ⏳        | ⏳    |
| `quarantined` | ⏳    | ⏳    | ⏳        | ⏳    |
| `rejected`    | ⏳    | ⏳    | ⏳        | ⏳    |

### 2.3 Color · severidad

| Severidad            | `-bg` | `-fg` |
| -------------------- | ----- | ----- |
| `low` · Baja         | ⏳    | ⏳    |
| `medium` · Media     | ⏳    | ⏳    |
| `high` · Alta        | ⏳    | ⏳    |
| `critical` · Crítica | ⏳    | ⏳    |

### 2.4 Tipografía

| Token               | Estilo Figma | Familia | Tamaño / interlineado | Peso |
| ------------------- | ------------ | ------- | --------------------- | ---- |
| `--gk-text-display` | ⏳           | ⏳      | ⏳                    | ⏳   |
| `--gk-text-h1`      | ⏳           | ⏳      | ⏳                    | ⏳   |
| `--gk-text-h2`      | ⏳           | ⏳      | ⏳                    | ⏳   |
| `--gk-text-h3`      | ⏳           | ⏳      | ⏳                    | ⏳   |
| `--gk-text-body`    | ⏳           | ⏳      | ⏳                    | ⏳   |
| `--gk-text-body-sm` | ⏳           | ⏳      | ⏳                    | ⏳   |
| `--gk-text-label`   | ⏳           | ⏳      | ⏳                    | ⏳   |
| `--gk-text-mono`    | ⏳           | ⏳      | ⏳                    | ⏳   |

Las fuentes se **empaquetan** en `src/assets/fonts/` (woff2), nunca desde Google Fonts en runtime (regla S9).

### 2.5 Espaciado, radios, elevación, movimiento

| Grupo                   | Tokens esperados                                                                                                                                                                                                                  | Valores Figma                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Espaciado (escala 4 px) | `--gk-space-1` … `--gk-space-12`                                                                                                                                                                                                  | ⏳                                                              |
| Radios                  | `--gk-radius-sm`, `-md`, `-lg`, `-full`                                                                                                                                                                                           | ⏳                                                              |
| Elevación               | `--gk-elevation-1`, `-2`, `-3`                                                                                                                                                                                                    | ⏳                                                              |
| Movimiento              | `--gk-ease-out: cubic-bezier(0.23,1,0.32,1)`, `--gk-ease-in-out: cubic-bezier(0.77,0,0.175,1)`, `--gk-ease-drawer: cubic-bezier(0.32,0.72,0,1)`; `--gk-duration-press: 160ms`, `-tooltip: 150ms`, `-menu: 200ms`, `-modal: 250ms` | Definidos por emil-design-eng; se ajustan si Figma define otros |
| Breakpoints             | `mobile` 390, `tablet` 1024, `desktop` 1440                                                                                                                                                                                       | Confirmado por frames                                           |
| Densidad de tabla       | `--gk-row-height`, `--gk-cell-padding-x`                                                                                                                                                                                          | ⏳                                                              |

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
