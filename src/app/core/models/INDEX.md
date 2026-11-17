# `src/app/core/models`

**Propósito:** Modelos del front (contrato en inglés de 05-api-contratos.md)
**Capa:** core
**Módulo que la creó:** M00 (vacía) · se llena en M04
**Puede importar de:** core/models

## Contenido

| Archivo / carpeta         | Qué es                                                                                             | Módulo |
| ------------------------- | -------------------------------------------------------------------------------------------------- | ------ |
| `file.model.ts`           | `FileStatus`, `DetectionLayer`, `LayerOutcome`, `RejectionReason`, `FileRecord` (K20), `FileQuery` | M04    |
| `page.model.ts`           | `Page<T>`                                                                                          | M04    |
| `metrics.model.ts`        | `Metrics` del resumen                                                                              | M04    |
| `audit.model.ts`          | `AuditEntry`, `AuditQuery`                                                                         | M04    |
| `security-event.model.ts` | `SecurityEvent` (alertas, M11)                                                                     | M04    |
| `api-key.model.ts`        | `ApiKey`, `ApiKeyCreated`                                                                          | M04    |
| `session.model.ts`        | `Role`, `SessionUser`, respuestas de login (provisional, M05)                                      | M04    |

## Notas

- `FileRecord = RestrictedFile | DisclosedFile`, discriminada por `disclosure`. Leer `originalName`, `sha256` o `layers` exige `file.disclosure === 'full'`; el compilador lo impide si no.
- Solo tipos: aquí no hay lógica ni dependencias de Angular.
