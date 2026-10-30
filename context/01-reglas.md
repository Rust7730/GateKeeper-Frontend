# 01 · Reglas obligatorias

Si una regla choca con una petición, **se detiene el trabajo y se pregunta**. Las reglas con `[E-xxx]` nacieron de un error registrado en [07-errores.md](07-errores.md).

## A. Antes de empezar cualquier tarea

1. Leer `CLAUDE.md`, este archivo, `07-errores.md` y `progreso.md`.
2. Trabajar **solo en el módulo actual**. Si algo pertenece a otro módulo, anotarlo en `progreso.md` como pendiente; no adelantarlo.
3. Abrir los nodos de Figma del módulo (ver `08-figma.md`) antes de maquetar.
4. Trabajar en la carpeta del proyecto, nunca editar archivos fuente de solo lectura (adjuntos, `uploads/`). `[E-001]`
5. `node_modules` se instala **en la máquina de la persona** (`npm install` en Windows). Un agente que trabaje desde otro sistema operativo verifica en una copia aparte y solo sincroniza código fuente y `package-lock.json`, nunca `node_modules`. `[E-004]`
6. `.claude/` no se escribe desde herramientas remotas: lo que deba vivir ahí se versiona en `tools/` y se instala con `npm run setup:claude`. `[E-003]`

## B. Seguridad (no negociables)

| #   | Regla                                                                                                                                                                                                                                            | Por qué                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| S1  | Todo texto que venga de la API se renderiza con interpolación `{{ }}` o `[textContent]`. **Prohibido** `[innerHTML]`, `bypassSecurityTrust*`, `ElementRef.nativeElement.innerHTML`, `document.write`, `Renderer2.setProperty(..., 'innerHTML')`. | Los nombres de archivo son controlados por el atacante (vector #12). |
| S2  | El token de acceso vive **solo en memoria** (signal en `TokenStore`). Prohibido `localStorage`, `sessionStorage`, IndexedDB y cookies legibles para tokens.                                                                                      | Robo de sesión vía XSS.                                              |
| S3  | El refresh token es cookie HttpOnly; el front no la lee. Peticiones a `/v1/auth/*` con `withCredentials: true`.                                                                                                                                  | —                                                                    |
| S4  | Ante un `401`, el interceptor intenta **un solo** refresh; si falla, cierra sesión y redirige a `/login`. Las peticiones concurrentes esperan el mismo refresh (no se lanzan N refresh).                                                         | Bucles y condiciones de carrera.                                     |
| S5  | No existe ningún botón, enlace ni ruta para ver o descargar el archivo original.                                                                                                                                                                 | Requisito de la propuesta.                                           |
| S6  | Las alertas SSE **no** usan `EventSource` nativo (no permite header `Authorization`). Usar `fetch` con streaming (`@microsoft/fetch-event-source` o implementación propia). Nunca poner el token en la URL.                                      | Tokens en logs de Nginx.                                             |
| S7  | Exportar CSV: escapar celdas que empiezan con `=`, `+`, `-`, `@`, tab o CR anteponiendo `'`.                                                                                                                                                     | CSV/Formula injection: los nombres de archivo son hostiles.          |
| S8  | Guards de rol en rutas **y** ocultar opciones en UI. El ocultar es UX; la seguridad real es el backend. Nunca confiar en el rol para mostrar datos que el backend no filtró.                                                                     | —                                                                    |
| S9  | Sin scripts ni estilos inline que rompan CSP. Usar `ngCspNonce` si se requiere. Sin CDN externos en runtime: fuentes e íconos van empaquetados.                                                                                                  | CSP estricta en Nginx.                                               |
| S10 | Datos sensibles nunca en query params (ej. motivos de liberación, códigos TOTP).                                                                                                                                                                 | Logs.                                                                |
| S11 | Los mocks incluyen siempre los fixtures hostiles de `05-api-contratos.md § Fixtures hostiles`.                                                                                                                                                   | Verificar S1 visualmente.                                            |
| S12 | `npm audit --omit=dev` sin vulnerabilidades altas antes de cada tag.                                                                                                                                                                             | Trivy en el pipeline.                                                |

## C. Código

1. Angular standalone, **zoneless**, **signals** para estado local, `OnPush` en todos los componentes (ESLint lo exige).
2. TypeScript `strict: true`; prohibido `any` (usar `unknown` + narrowing).
3. Control flow nuevo (`@if`, `@for` con `track`), nada de `*ngIf/*ngFor`.
4. Componentes de `features/` no llaman a `HttpClient`: usan servicios de `core/api/`.
5. Mocks y HTTP real intercambiables con `environment.useMocks`; los componentes no saben cuál se usa.
6. Un componente = una carpeta con `.ts`, `.html`, `.scss`, `.spec.ts`, con nombres de la guía 2025 (`status-chip.ts`, no `status-chip.component.ts`). Generar con `ng g c`. `[E-005]`
7. Lazy loading por feature (`loadChildren` / `loadComponent`).
8. Nada de colores, tamaños, sombras ni radios literales en `.scss` de componentes: **solo tokens** (`var(--gk-*)`). Lint con stylelint lo verifica.
9. Textos de interfaz en español, en sentence case, sin signos de exclamación. Un botón dice lo que hace ("Liberar archivo"), y su toast usa el mismo verbo ("Archivo liberado").
10. Accesibilidad AA: foco visible, navegación por teclado, `aria-label` en botones solo con ícono, estado nunca comunicado solo con color.
11. Respetar `prefers-reduced-motion`.

## D. Diseño

1. **Figma es la fuente de verdad.** No inventar valores. Si falta algo en Figma, se pregunta o se registra en `02-sistema-de-diseno.md § Decisiones pendientes`.
2. Toda mejora al sistema de diseño se propone primero en `02 § Mejoras propuestas`; no se implementa en silencio.
3. Cada pantalla terminada se compara contra su captura de Figma (desktop, tablet, móvil cuando aplique).

## D2. Skills de diseño (obligatorias en trabajo de UI)

| Skill                               | Cuándo                                             | Qué exige                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `impeccable` (en `.claude/skills/`) | Toda superficie nueva o mejora visual              | `impeccable context` una vez por sesión; `shape` antes de una superficie nueva; leer `reference/craft-floor.md` antes de cada edición de UI; `critique` + `audit` + `polish` al cerrar módulos con UI. Modo **Persuade** para la landing, **Operate** para el dashboard.                                                                                                                                                                           |
| `emil-design-eng`                   | Cualquier animación, transición o microinteracción | Decidir primero si debe animarse (frecuencia de uso); nada de animación en acciones de teclado; solo `transform` y `opacity`; curvas propias (`--gk-ease-out`, `--gk-ease-in-out`); UI ≤ 300 ms; `:active` con `scale(0.97)` en pulsables; nunca `scale(0)`; popovers con origen en su disparador (modales centrados); hover tras `@media (hover: hover) and (pointer: fine)`; `prefers-reduced-motion`. Revisiones en tabla Before / After / Why. |

Reglas de convivencia:

1. Figma sigue siendo la fuente de verdad visual. Si impeccable propone algo que contradice Figma, se registra como mejora propuesta en `02 § 4` y decide el usuario.
2. El hook de impeccable (`.claude/settings.json`) no se desactiva para "pasar" un módulo; sus hallazgos se corrigen o se ignoran explícitamente con `/impeccable hooks ignore-rule` y una nota en `02 § 5`.
3. En el dashboard (modo Operate) el movimiento es casi nulo: tablas, filtros y navegación de teclado no se animan.

## E. Git y módulos

1. Rama por módulo: `feat/mNN-nombre` (ej. `feat/m07-archivos`). `npm run module:start -- mNN nombre` la crea y actualiza `progreso.md`.
2. **Conventional Commits** con scope de módulo: `feat(m07): tabla de archivos con filtros`.
   Tipos: `feat`, `fix`, `style`, `refactor`, `test`, `docs`, `chore`, `build`.
3. Cada commit compila (`npm run build` pasa). No hay commits "WIP" en la rama principal.
4. Al cerrar un módulo: `npm run module:close -- mNN` (corre `verify`, actualiza `progreso.md`, crea el tag). Luego merge a `main`.
5. Los cambios de documentación del contexto van en commits `docs(context): ...` separados.
6. **Ningún commit, tag ni PR lleva atribución a una IA o herramienta**: sin `Co-Authored-By`, `Claude-Session`, "Generated with…", emojis de robot ni menciones a Claude o Anthropic. La autoría es solo de la persona. `scripts/check-commit-msg.mjs` lo bloquea en el hook `commit-msg`. `[E-006]`

## F. Índices

1. Al crear, mover o borrar un archivo en `src/`, actualizar el `INDEX.md` de esa carpeta en el mismo commit.
2. Al crear una carpeta nueva, crear su `INDEX.md` con la plantilla y añadirla al árbol de `03-arquitectura.md`.

## G. Errores

1. Todo error (de código, de proceso, de interpretación de Figma o de reglas) se registra en `07-errores.md` **antes** de corregirlo, con `npm run error:new -- "título"`.
2. Si el error es repetible, se convierte en regla aquí con su referencia `[E-xxx]`.
