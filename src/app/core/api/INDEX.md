# `src/app/core/api`

**Propósito:** Un servicio por recurso del contrato (`*.api.ts`), DTO del backend y adaptador
**Capa:** core
**Módulo que la creó:** M00 (vacía) · se llena en M04
**Puede importar de:** core/* (nunca features ni shared/components)

## Contenido

| Archivo / carpeta    | Qué es                                                                                                                    | Módulo |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------ |
| `api-config.ts`      | Token `API_BASE_URL`, `apiUrl()` (codifica; rechaza segmentos vacíos, `.` y `..`) e `invalidIdError()` (404 sin petición) | M04    |
| `backend.dto.ts`     | Tipos de transporte con los valores reales del backend (en español)                                                       | M04    |
| `backend-adapter.ts` | Adaptador puro DTO → modelos del front; tablas de mapeo; K20 falla cerrado                                                | M04    |
| `admin-files.api.ts` | `AdminFilesApi`: lista, detalle y liberación de archivos (`/v1/admin/files`)                                              | M04    |
| `metrics.api.ts`     | `MetricsApi`: `/v1/admin/metrics`                                                                                         | M04    |
| `audit.api.ts`       | `AuditApi`: `/v1/admin/audit` (solo admin)                                                                                | M04    |
| `api-keys.api.ts`    | `ApiKeysApi`: listar, crear y revocar (`/v1/admin/api-keys`, solo admin)                                                  | M04    |

## Notas

- Los servicios piden `unknown` al `HttpClient` y pasan todo por `backend-adapter.ts`: nunca se confía en la forma de la respuesta.
- Un valor desconocido del backend cae en `unknown` o `null`, nunca en el texto crudo. Las fechas se devuelven normalizadas con `toISOString()`.
- Un id que va en la URL debe ser UUID (`isUuid`); si no, el servicio no hace la petición y responde 404, igual que "no encontrado".
- K20: un archivo que no está en cuarentena ni tiene malware es `RestrictedFile`; si el DTO trae nombre, hash o resultados, el adaptador los descarta.
- `AuthService` (`/v1/auth/*`) es de M05 y `EventsApi` (SSE, S6) de M11.
