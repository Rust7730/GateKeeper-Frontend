# `src/app/core`

**Propósito:** Singletons y contrato con el backend
**Capa:** core
**Módulo que la creó:** M00
**Puede importar de:** core/*

## Contenido

| Archivo / carpeta | Qué es                                                             | Módulo  |
| ----------------- | ------------------------------------------------------------------ | ------- |
| `api/`            | Un servicio por recurso del contrato (`*.api.ts`)                  | M04     |
| `auth/`           | Sesión: TokenStore en memoria, AuthService, temporizador de sesión | M05     |
| `guards/`         | authGuard, roleGuard, guestGuard                                   | M05     |
| `http/`           | Interceptores: auth, refresh, error y backend mock                 | M04–M05 |
| `layout/`         | Shell del dashboard: sidebar, topbar, campana de alertas           | M06     |
| `mocks/`          | mock-db, fixtures y nombres hostiles                               | M04     |
| `models/`         | Interfaces y tipos de 05-api-contratos.md                          | M04     |
| `theme/`          | ThemeService (oscuro / claro)                                      | M02     |
