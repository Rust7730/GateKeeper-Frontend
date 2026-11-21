# `src/app/core/auth`

**Propósito:** Sesión: TokenStore en memoria, AuthService, lectura de cookie CSRF
**Capa:** core
**Módulo que la creó:** M00 (vacía) · se llena en M05
**Puede importar de:** core/* (nunca features ni shared/components)

## Contenido

| Archivo / carpeta | Qué es                                                                            | Módulo |
| ----------------- | --------------------------------------------------------------------------------- | ------ |
| `auth.service.ts` | `AuthService`: login, TOTP, refresh deduplicado con CSRF, `ensureSession`, logout | M05    |
| `csrf.ts`         | `CsrfToken`: lectura de la cookie `gk_csrf` para el header `X-CSRF-Token`         | M05    |
| `token-store.ts`  | `TokenStore`: única fuente del access token JWT en memoria (`signal`, S2)         | M05    |
