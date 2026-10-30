# 04 · Plan por módulos

Cada módulo es **servible** (`npm start` muestra algo nuevo y navegable) y **comprobable** (tiene criterios de aceptación verificables). Se cierra con `npm run verify` en verde, merge y tag `mNN`.

## Mapa y dependencias

```
M00 Base del proyecto + automatizaciones
 └─ M01 Landing pública (PRIORIDAD) ── marca base desde Figma
     └─ M02 Tokens + tema del dashboard (Figma)
         └─ M03 Componentes compartidos ── styleguide
             └─ M04 Modelos + capa API + mocks
                 └─ M05 Autenticación (login, TOTP, interceptores, guards)
                     └─ M06 Layout (shell, sidebar por rol, topbar, 403/404)
                         ├─ M07 Archivos ── M08 Detalle ── M09 Cuarentena
                         ├─ M10 Resumen / métricas
                         ├─ M11 Alertas en tiempo real
                         ├─ M12 Auditoría
                         └─ M13 API keys
                             └─ M14 Responsive + accesibilidad
                                 └─ M15 Endurecimiento, pruebas y despliegue
```

**Prioridad:** después de M00 se construye la landing (M01) completa y pulida antes de tocar el dashboard. La landing fija la marca (logo, color de acento, tipografía) que luego hereda el dashboard en M02.

**Rutas:** la landing vive en `/`. Todo el dashboard cuelga de `/app` (`/app`, `/app/files`, `/app/quarantine`…) y el login en `/login`.

M07–M13 pueden reordenarse entre sí; todos dependen de M06.

## Resumen

| Módulo  | Entregable visible                                                    | Figma         | Esfuerzo |
| ------- | --------------------------------------------------------------------- | ------------- | -------- |
| M00     | App vacía que compila, lint, índices y automatizaciones activas       | —             | S        |
| **M01** | **Landing pública en `/`, diseñada con impeccable + emil-design-eng** | `0:1` (marca) | **L**    |
| M02     | `/dev/styleguide` con colores, tipografía, espaciado, dark/light      | `0:1`         | M        |
| M03     | Styleguide con todos los componentes `gk-*` y sus variantes           | `0:1`         | L        |
| M04     | Styleguide muestra datos mock (incluye nombres hostiles)              | —             | M        |
| M05     | Login + TOTP funcionando con usuarios mock                            | `3:2`, `3:4`  | M        |
| M06     | Shell navegable por rol, 403/404/error                                | `3:2`         | M        |
| M07     | `/app/files` con filtros, búsqueda y paginación                       | `3:2`         | L        |
| M08     | `/app/files/:id` con línea de tiempo de capas                         | `3:2`         | M        |
| M09     | `/app/quarantine` + modal de liberación (admin)                       | `3:2`, `3:4`  | M        |
| M10     | `/app` resumen con KPIs y gráficas                                    | `3:2`         | M        |
| M11     | `/app/alerts` + campana en topbar con SSE simulado                    | `3:2`         | M        |
| M12     | `/app/audit` con filtros y exportar CSV                               | `3:2`         | S        |
| M13     | `/app/api-keys` crear (mostrar una vez) y revocar                     | `3:2`, `3:4`  | M        |
| M14     | Vistas tablet y móvil, auditoría a11y                                 | `3:3`         | L        |
| M15     | Nginx + CSP, e2e, matriz de seguridad, build final                    | —             | M        |

S = medio día · M = 1 día · L = 2 días (aprox.).

---

## M00 · Base del proyecto

**Objetivo:** proyecto Angular limpio, con reglas automáticas desde el día uno.

**Tareas**

1. `ng new` en la carpeta existente (`--directory . --style=scss --routing --ssr=false --ai-config=none --skip-git`) · `strict` activado. **`--ai-config=none` es obligatorio**: sin él, el CLI genera su propio `CLAUDE.md` y pisa el nuestro.
2. `ng add @angular/material` (tema custom, sin Google Fonts en runtime).
3. ESLint (`angular-eslint`), stylelint, Prettier.
4. Regla ESLint que prohíbe `innerHTML` y `bypassSecurityTrust*`. (S1)
5. Automatizaciones de [09-automatizacion.md](09-automatizacion.md): scripts de índices, seguridad, errores y módulos; husky + commitlint; comandos de Claude Code.
6. Scripts `npm run lint`, `test`, `build`, `verify`.
7. Crear el árbol de `03-arquitectura.md` con carpetas vacías y sus `INDEX.md`.
8. `environment.ts` con `useMocks: true`, `apiBaseUrl`.
9. `git init`, primer commit y tag `m00`.

**Aceptación**

- [ ] `npm start` muestra una página con el título "Gatekeeper".
- [ ] `npm run verify` pasa.
- [ ] Un `[innerHTML]` de prueba hace fallar `npm run check:security` (y luego se borra).
- [ ] Un commit con mensaje inválido es rechazado por commitlint.
- [ ] Todas las carpetas del árbol existen y tienen `INDEX.md`; `npm run check:index` lo confirma.

**Commits:** `chore(m00): crear proyecto angular` · `build(m00): configurar lint y formato` · `docs(m00): índices de carpetas y contexto`

---

## M01 · Landing pública (prioridad)

**Objetivo:** una página que explique Gatekeeper en segundos a quien decide adoptarlo (líder técnico, PyME, institución educativa) y lo lleve a la acción: ver la documentación de la API o entrar al dashboard.

**Modo de diseño:** _Persuade_ (impeccable). La landing puede tener más expresión que el dashboard (que es _Operate_), pero comparte marca: logo, acento y tipografía salen de Figma `0:1`.

**Herramientas obligatorias**

- `/impeccable shape landing` → brief de la superficie y dirección visual. **El usuario aprueba la dirección antes de escribir código.**
- `/impeccable` (new-work) para construir; `reference/craft-floor.md` antes de cada edición de UI.
- `/emil-design-eng` para todo el movimiento: marco de decisión de animación, curvas propias, duraciones, `prefers-reduced-motion`. Las revisiones de animación se entregan en tabla Before / After / Why.
- Al cerrar: `/impeccable critique`, `/impeccable audit` y `/impeccable polish` sobre la landing; hallazgos altos se corrigen antes del tag.

**Contenido (solo hechos de la propuesta; no inventar clientes, cifras de uso ni testimonios)**

1. Primera vista: qué hace Gatekeeper en una frase y las dos acciones (documentación de la API · entrar al dashboard).
2. El problema: subida de archivos sin restricciones (CWE-434, lugar 12 del CWE Top 25 2025 de MITRE) y por qué revisar extensión o Content-Type no basta.
3. Cómo funciona: el recorrido de un archivo por las capas (firma real → reconstrucción CDR → ClamAV → VirusTotal por hash). Es una secuencia real, así que aquí sí cabe numeración. Es el momento visual memorable de la página.
4. Integración en una llamada: ejemplo de `POST /v1/files` → `202` → `GET /v1/files/{id}` → `/content`.
5. Garantías: ningún original llega a la app, worker sin internet, solo el hash sale a VirusTotal, auditoría de cada liberación.
6. Matriz de pruebas: los 15 vectores y la capa que detiene cada uno.
7. Alcance honesto: limitaciones declaradas (solo JPEG/PNG/PDF, zero-day neutralizado por CDR, no análisis semántico).
8. Pie: enlaces a la propuesta, OWASP File Upload Cheat Sheet, login.

**Tareas técnicas**

1. `features/landing/` con secciones como componentes standalone; ruta `/` pública y lazy.
2. Tokens de marca mínimos en `styles/tokens/` (los que necesite la landing), extraídos de Figma; el resto de tokens queda para M02.
3. Movimiento solo con CSS (transiciones, `@starting-style`, WAAPI si hace falta); nada de librerías de animación pesadas. Una sola secuencia orquestada como máximo, siguiendo emil-design-eng.
4. Metadatos: `<title>`, description, Open Graph, favicon/logo.
5. Responsive desde 390 px; Lighthouse ≥ 95 en rendimiento, accesibilidad y buenas prácticas.
6. Decidir prerender estático de `/` (ver 02 § Decisiones pendientes).

**Aceptación**

- [ ] Dirección visual aprobada por el usuario antes de implementar (brief guardado por impeccable).
- [ ] Sin hallazgos altos en `impeccable critique` / `audit` ni en el detector del hook.
- [ ] Todas las animaciones cumplen la tabla de emil-design-eng (≤ 300 ms en UI, sin `transition: all`, sin `scale(0)`, hover tras `@media (hover: hover)`, reduced motion respetado).
- [ ] Ningún dato inventado: cada cifra de la página aparece en la propuesta.
- [ ] Lighthouse ≥ 95 (rendimiento, a11y, buenas prácticas) en móvil.

**Commits:** `feat(m01): estructura y ruta de la landing` · `feat(m01): sección <nombre>` (una por sección) · `style(m01): movimiento` · `fix(m01): hallazgos de critique y audit`

---

## M02 · Tokens y tema desde Figma

**Objetivo:** que el sistema de diseño de Figma exista como CSS y que Material lo use.

**Tareas**

1. Extraer variables y estilos del nodo `0:1` (procedimiento en `08-figma.md`). Llenar las tablas de `02-sistema-de-diseno.md`.
2. Revisar las mejoras D1–D9 y anotar decisión.
3. Escribir `styles/tokens/*`, `themes/_dark.scss`, `themes/_light.scss`.
4. Empaquetar fuentes en `assets/fonts/`.
5. Tema de Material con los tokens (`mat.theme` + overrides por `--mat-sys-*` / tokens de componente).
6. `ThemeService` (dark por defecto, light opcional, persiste la preferencia en `localStorage` — es preferencia, no dato sensible).
7. Ruta `/dev/styleguide` (solo con `!environment.production`): paleta, escala tipográfica, espaciado, radios, sombras, botones e inputs de Material tematizados.

**Aceptación**

- [ ] Captura de styleguide vs. página de sistema de diseño de Figma: colores y tipografías idénticos.
- [ ] Cambiar a light no deja ningún elemento con color fijo.
- [ ] stylelint falla si un `.scss` de componente usa `#hex` o `rgb()`.
- [ ] Contraste AA comprobado en texto principal, muted y chips (D4).

**Commits:** `feat(m02): tokens de color, tipografía y espaciado` · `feat(m02): tema de angular material` · `feat(m02): styleguide y cambio de tema`

---

## M03 · Componentes compartidos

**Objetivo:** todos los bloques reutilizables, aislados y probados antes de cualquier pantalla.

**Componentes:** `status-chip`, `severity-chip`, `layer-badge`, `hash-cell` (copiar al portapapeles), `truncated-text` (tooltip), `kpi-card`, `page-header`, `empty-state`, `skeleton`, `confirm-dialog` (incluye variante "escribe el ID para confirmar"), `filter-bar`. Pipes: `file-size`, `relative-time`, `days-left`.

**Aceptación**

- [ ] Cada componente aparece en `/dev/styleguide` con todas sus variantes de Figma.
- [ ] Cada uno tiene `.spec.ts` (variantes renderizan texto e ícono correctos).
- [ ] `truncated-text` y `hash-cell` muestran los nombres hostiles como texto literal.
- [ ] Todos operables con teclado y con `aria-label` donde aplique.

**Commits:** uno por componente o grupo: `feat(m03): chips de estado y severidad` …

---

## M04 · Modelos, capa API y mocks

**Objetivo:** el contrato del backend en TypeScript y un backend falso realista.

**Tareas**

1. Modelos de `05-api-contratos.md` en `core/models/`.
2. Servicios `core/api/*.api.ts` con `HttpClient`.
3. `mock-backend.interceptor` activo si `useMocks`: responde rutas `/v1/*` con latencia aleatoria (200–800 ms), paginación, filtros y errores simulados (401, 403, 404, 429, 500).
4. `mock-db.ts` con ~250 archivos, 3 apps, 40 eventos de auditoría, 6 API keys, incluye **todos** los fixtures hostiles.

**Aceptación**

- [ ] Una tabla de prueba en styleguide lista archivos mock con paginación.
- [ ] Cambiar `useMocks` a `false` hace que las peticiones vayan a `apiBaseUrl` sin tocar componentes.
- [ ] Los 15 vectores de la matriz tienen al menos un registro mock que los represente.

**Commits:** `feat(m04): modelos del contrato` · `feat(m04): servicios api` · `feat(m04): backend mock con fixtures hostiles`

---

## M05 · Autenticación

**Pantallas:** login (paso 1), TOTP (paso 2). Estados: error de credenciales, código incorrecto, cuenta bloqueada, cargando.

**Tareas**

1. `TokenStore` (signal en memoria), `AuthService` (login, verifyTotp, refresh, logout, `currentUser`, `role`).
2. Interceptores: `auth` (Bearer), `refresh` (S4, una sola petición compartida), `error` (toasts y redirecciones).
3. Guards: `authGuard`, `roleGuard('admin')`, `guestGuard`.
4. `SessionTimer`: aviso 2 min antes de expirar con opción "Seguir conectado".
5. Al recargar la página: intentar refresh con la cookie; si falla, a `/login`.
6. Usuarios mock: `analista@gatekeeper.test` y `admin@gatekeeper.test` (contraseña y TOTP documentados en README).

**Aceptación**

- [ ] Ningún token en `localStorage`/`sessionStorage` (verificar en DevTools).
- [ ] Admin no puede saltarse el TOTP.
- [ ] Forzar 401 en mock → un solo refresh aunque haya 5 peticiones en paralelo.
- [ ] Flujo login → TOTP → resumen igual al prototipo de Figma (`3:4`).

---

## M06 · Layout

**Tareas:** `ShellComponent` con sidebar (expandida/colapsada, opciones según rol), topbar (usuario, rol, cambio de tema, campana con contador — sin datos aún, logout), rutas lazy, páginas 403/404/error.

**Aceptación**

- [ ] Analista no ve Auditoría ni API keys; si escribe la URL, va a 403.
- [ ] Sidebar colapsada recuerda el estado.
- [ ] Skip link "Ir al contenido" y foco gestionado al navegar.

---

## M07 · Archivos (lista)

**Tareas:** tabla Material con UUID, nombre original, aplicación, tipo real, tamaño, estado, capa, fecha. Filtros (estado, rango de fechas, aplicación), búsqueda con debounce, ordenamiento y paginación **del lado del servidor**; filtros reflejados en la URL (query params sin datos sensibles). Estados: cargando (skeleton), vacío, sin resultados, error.

**Aceptación**

- [ ] Recargar con filtros en la URL conserva la vista.
- [ ] Los nombres hostiles se ven como texto, truncados con tooltip.
- [ ] Clic o Enter en una fila abre el detalle.

---

## M08 · Detalle de archivo

**Tareas:** metadatos, hash copiable, comparación **extensión declarada vs. tipo real** con discrepancia resaltada, línea de tiempo de capas (firma → CDR → ClamAV → VirusTotal con "X de N motores"), motivo de bloqueo, aviso "los originales nunca se muestran". Botón "Liberar" si está en cuarentena y el rol es admin (abre el diálogo de M09; mientras tanto, deshabilitado).

**Aceptación**

- [ ] No existe ningún enlace de descarga ni vista previa (S5).
- [ ] UUID inexistente → estado "Archivo no encontrado", no pantalla en blanco.
- [ ] Ver archivo de otra app (IDOR, vector 13) → el mock responde 404 y se muestra igual que "no encontrado".

---

## M09 · Cuarentena

**Tareas:** lista filtrada con "días restantes" (30 días), diálogo de liberación: advertencia, motivo obligatorio (≥ 20 caracteres), escribir el ID para confirmar, toast "Archivo liberado" y registro visible en auditoría mock.

**Aceptación**

- [ ] Analista ve la lista sin botón "Liberar".
- [ ] El botón de confirmar se habilita solo con motivo válido e ID exacto.
- [ ] La liberación aparece en la bitácora (M12) con usuario, fecha y motivo.

---

## M10 · Resumen y métricas

**Tareas:** KPIs (procesados, bloqueados, en cuarentena, rechazados), amenazas por día, desglose por capa, top de aplicaciones, últimas alertas. Selector de periodo (24 h, 7 d, 30 d). Gráficas con colores de tokens y alternativa en tabla accesible.

**Aceptación**

- [ ] Las gráficas cambian de color al cambiar de tema.
- [ ] Cada gráfica tiene descripción accesible o tabla equivalente.

---

## M11 · Alertas en tiempo real

**Tareas:** `EventsApi` con `fetch-event-source` (S6) y reconexión con backoff; en mock, un `Observable` que emite cada 3–10 s. Feed con severidad, indicador Conectado/Reconectando/Desconectado, pausar/reanudar, marcar como leídas. Campana del topbar con contador y panel desplegable.

**Aceptación**

- [ ] Cortar el mock → indicador "Reconectando" y reintento automático.
- [ ] Pausar detiene la inserción visual pero acumula el contador.
- [ ] Nuevas alertas se anuncian con `aria-live="polite"`, no roban el foco.

---

## M12 · Auditoría (admin)

**Tareas:** tabla de solo lectura (usuario, acción, recurso, fecha, IP, motivo), filtros, exportar CSV con `utils/csv.ts` (S7).

**Aceptación**

- [ ] Un motivo que empieza con `=HYPERLINK(...)` se exporta como `'=HYPERLINK(...)`.
- [ ] Test unitario de `csv.ts` con los casos de S7.

---

## M13 · API keys (admin)

**Tareas:** lista (nombre, app, prefijo, creación, último uso, estado); crear → modal que muestra la key completa **una sola vez** con botón copiar y advertencia; al cerrar se descarta de memoria. Revocar con confirmación.

**Aceptación**

- [ ] Cerrar y reabrir el modal no vuelve a mostrar la key.
- [ ] La key completa nunca se guarda en ningún store ni se loguea.

---

## M14 · Responsive y accesibilidad

**Tareas:** aplicar frames de `3:3`. Resumen, archivos y alertas en tablet (1024) y móvil (390); tablas → tarjetas en móvil; sidebar → drawer. Auditoría a11y (axe / Lighthouse) en todas las pantallas.

**Aceptación**

- [ ] Sin scroll horizontal en 390 px.
- [ ] Lighthouse Accesibilidad ≥ 95 en todas las rutas.
- [ ] Recorrido completo solo con teclado.

---

## M15 · Endurecimiento, pruebas y despliegue

**Tareas**

1. `nginx/default.conf`: CSP (`default-src 'self'`, sin `unsafe-inline` en scripts), `X-Content-Type-Options: nosniff`, HSTS, `Referrer-Policy`, `Permissions-Policy`, fallback SPA.
2. Dockerfile multi-stage (build Node → Nginx no root).
3. Playwright: login por rol, liberar de cuarentena, crear/revocar key, XSS en nombres (assert de que no se ejecuta `alert`).
4. Matriz de seguridad del frontend (abajo).
5. `npm audit`, Trivy de la imagen, sin hallazgos altos.

**Matriz de seguridad del frontend**

| Vector propuesta                | Qué verifica el front                      | Prueba     |
| ------------------------------- | ------------------------------------------ | ---------- |
| #3 Nombre con `../` o byte nulo | Se muestra literal y truncado              | e2e        |
| #12 Nombre con HTML/JS          | No se ejecuta, se muestra como texto       | e2e        |
| #13 IDOR                        | 404 se muestra como "no encontrado"        | unit + e2e |
| #14 Rate limit                  | 429 muestra mensaje claro y reintento      | unit       |
| #15 Archivo pendiente           | No hay acción de descarga en ningún estado | e2e        |
| — Tokens                        | Nada en storage                            | e2e        |
| — CSV                           | Escape de fórmulas                         | unit       |
| — CSP                           | La app carga sin violaciones en consola    | e2e        |

**Aceptación:** `npm run verify` + e2e en verde, imagen Docker sirve la app con los headers correctos.
