# 03 · Arquitectura

## Stack y librerías

| Necesidad       | Elección                                                                                     | Nota                                                                      |
| --------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Framework       | Angular 22, standalone, signals, **zoneless**                                                | Sin SSR · CLI 22.2.5                                                      |
| UI              | Angular Material + CDK                                                                       | Tematizado con tokens de Figma                                            |
| Estado remoto   | Servicios con signals + RxJS                                                                 | Sin NgRx (no hace falta para este tamaño)                                 |
| Gráficas        | `ng2-charts` (Chart.js)                                                                      | Colores desde tokens                                                      |
| SSE con headers | `@microsoft/fetch-event-source`                                                              | Regla S6                                                                  |
| Íconos          | Material Symbols empaquetado (o set de Figma exportado a SVG)                                | Sin CDN                                                                   |
| Lint            | ESLint 10 (`angular-eslint` 22) + stylelint 17 + Prettier · husky + lint-staged + commitlint | stylelint prohíbe hex, rgb/hsl y px en sombras/radios dentro de `src/app` |
| Tests           | **Vitest** + jsdom (runner por defecto del CLI 22) · Playwright en M15                       |                                                                           |

## Árbol de carpetas

```
gatekeeper-frontend/
├── CLAUDE.md                         # entrada para agentes
├── README.md
├── context/                          # documentación de gobierno (este folder)
│   ├── INDEX.md
│   ├── 00-proyecto.md … 08-figma.md
│   ├── progreso.md
│   └── templates/
├── angular.json · package.json · tsconfig*.json
├── .eslintrc / eslint.config.js · .stylelintrc.json · .prettierrc
├── scripts/                          # automatizaciones (ver 09-automatizacion.md)
│   └── INDEX.md
├── .husky/                           # hooks de git (pre-commit, commit-msg)
├── .claude/                          # skill impeccable, agentes, comandos /modulo-*
├── PRODUCT.md                        # ficha de producto para impeccable
├── nginx/
│   ├── INDEX.md
│   └── default.conf                  # CSP, nosniff, HSTS (M15)
├── e2e/                              # Playwright (M15)
│   └── INDEX.md
└── src/
    ├── index.html · main.ts
    ├── environments/
    │   ├── INDEX.md
    │   ├── environment.ts            # producción · useMocks: false
    │   └── environment.development.ts # ng serve · useMocks: true
    ├── assets/
    │   ├── INDEX.md
    │   ├── fonts/                    # woff2 empaquetadas
    │   ├── icons/                    # SVG exportados de Figma
    │   └── brand/                    # logo, favicon
    ├── styles/
    │   ├── INDEX.md
    │   ├── styles.scss               # punto de entrada global
    │   ├── tokens/                   # _color, _typography, _space, _radius, _elevation, _motion
    │   ├── themes/                   # _dark.scss, _light.scss
    │   ├── material/                 # _theme.scss, _overrides.scss
    │   └── base/                     # _reset.scss, _a11y.scss, _utilities.scss
    └── app/
        ├── INDEX.md
        ├── app.config.ts · app.routes.ts · app.component.ts
        ├── core/                     # singletons, nunca importa de features/
        │   ├── INDEX.md
        │   ├── auth/                 # auth.service, token.store, session-timer
        │   ├── http/                 # interceptors: auth, refresh, error, mock-backend
        │   ├── guards/               # auth.guard, role.guard, guest.guard
        │   ├── api/                  # files.api, admin-files.api, metrics.api, audit.api, api-keys.api, events.api
        │   ├── models/               # interfaces y enums del contrato
        │   ├── mocks/                # fixtures/, hostile-filenames.ts, mock-db.ts
        │   ├── layout/               # shell, sidebar, topbar, alerts-bell
        │   └── theme/                # theme.service (dark/light)
        ├── shared/                   # reutilizable, sin estado global
        │   ├── INDEX.md
        │   ├── components/           # status-chip, severity-chip, layer-badge, hash-cell, …
        │   ├── pipes/                # file-size, relative-time, days-left
        │   ├── directives/           # copy-to-clipboard, autofocus
        │   └── utils/                # csv.ts (con escape S7), date-range.ts
        └── features/                 # una carpeta por pantalla, lazy
            ├── INDEX.md
            ├── landing/              # landing pública en / (M01), una carpeta por sección
            ├── auth/                 # login, totp-step
            ├── overview/             # resumen + gráficas
            ├── files/                # files-list, file-detail
            ├── quarantine/           # quarantine-list, release-dialog
            ├── alerts/               # alerts-feed
            ├── audit/                # audit-log
            ├── api-keys/             # api-keys-list, create-key-dialog, revoke-dialog
            ├── errors/               # forbidden, not-found, server-error
            └── dev/                  # styleguide (solo en desarrollo)
```

## Reglas de dependencia entre capas

```
features ──▶ shared
features ──▶ core (api, models, guards)
shared   ──▶ core/models   (solo tipos)
core     ──▶ (nada de features ni shared/components)
```

Se puede reforzar con `eslint-plugin-boundaries` en M00.

## Convenciones de nombres

| Elemento               | Convención                                      | Ejemplo                            |
| ---------------------- | ----------------------------------------------- | ---------------------------------- |
| Selector de componente | prefijo `gk-`                                   | `gk-status-chip`                   |
| Archivo                | guía de estilo 2025 del CLI, sin sufijo de tipo | `status-chip.ts`, `.html`, `.scss` |
| Clase de componente    | PascalCase sin sufijo `Component`               | `StatusChip`                       |
| Servicio API           | `<recurso>.api.ts`                              | `admin-files.api.ts`               |
| Modelo                 | `<recurso>.model.ts`                            | `file-record.model.ts`             |
| Token CSS              | `--gk-<grupo>-<nombre>`                         | `--gk-color-status-clean-bg`       |
| Ruta                   | kebab-case en inglés                            | `/api-keys`                        |
| Texto de UI            | español, sentence case                          | "Liberar archivo"                  |

## Índices de carpetas

Cada carpeta marcada con `INDEX.md` en el árbol tiene su índice, basado en [templates/INDEX.folder.md](templates/INDEX.folder.md). Lista maestra:

| Índice                                              | Se crea en                     |
| --------------------------------------------------- | ------------------------------ |
| `src/app/INDEX.md`                                  | M00                            |
| `src/app/core/INDEX.md` (+ uno por subcarpeta)      | M00, se llena en M04–M06       |
| `src/app/shared/INDEX.md` (+ `components/INDEX.md`) | M00, se llena en M03           |
| `src/app/features/INDEX.md` (+ uno por feature)     | M00, cada feature en su módulo |
| `src/styles/INDEX.md`                               | M02                            |
| `src/assets/INDEX.md`                               | M02                            |
| `src/environments/INDEX.md`                         | M00                            |
| `scripts/INDEX.md`                                  | M00                            |
| `src/app/features/landing/INDEX.md`                 | M01                            |
| `nginx/INDEX.md`, `e2e/INDEX.md`                    | M15                            |
