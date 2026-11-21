# `src/app/core/http`

**Propósito:** Configuración de HttpClient e interceptores: backend mock (M04); auth, refresh y error (M05)
**Capa:** core
**Módulo que la creó:** M00 (vacía) · se llena en M04–M05
**Puede importar de:** core/* (nunca features ni shared/components)

## Contenido

| Archivo / carpeta             | Qué es                                                                                      | Módulo |
| ----------------------------- | ------------------------------------------------------------------------------------------- | ------ |
| `api-request.ts`              | Helpers `apiPathOf()`, `injectApiPath()` e `isAuthPath()` para aislar peticiones a la API   | M05    |
| `auth.interceptor.ts`         | Adjunta `Authorization: Bearer` o `withCredentials` + `X-CSRF-Token` solo hacia la API      | M05    |
| `refresh.interceptor.ts`      | Ante 401 intenta un refresh único deduplicado y reintenta la petición (S4)                  | M05    |
| `provide-api.ts`              | `provideApi()`: HttpClient + interceptores + `API_BASE_URL`; registra mock con `useMocks`   | M04    |
| `mock-backend.interceptor.ts` | Backend simulado: DTO del backend, latencia 200–800 ms, paginación, filtros, IDOR y errores | M04    |

## Notas

- Errores naturales del mock: 400 (validación), 401 (sesión expirada), 403 (analista en ruta de admin), 404 (inexistente o de otra app, mismo cuerpo), 409 (liberar fuera de cuarentena, revocar dos veces).
- Errores forzados con `MockBackendState.failNext({ status, pathPrefix? })`: 401, 423, 429 (con `Retry-After`), 500…
