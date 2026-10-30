# 05 · Contratos de API y mocks

> Contrato **provisional** derivado de la propuesta. Cuando el backend publique su OpenAPI, este archivo se alinea con él y se registra el cambio en `progreso.md`.

## Endpoints usados por el dashboard

| Método          | Ruta                           | Auth                                  | Servicio front                          |
| --------------- | ------------------------------ | ------------------------------------- | --------------------------------------- |
| POST            | `/v1/auth/login`               | credenciales (+ TOTP en segundo paso) | `AuthService`                           |
| POST            | `/v1/auth/refresh`             | cookie HttpOnly                       | `AuthService`                           |
| POST            | `/v1/auth/logout`              | cookie                                | `AuthService` _(confirmar con backend)_ |
| GET             | `/v1/files/{id}`               | JWT analista                          | `FilesApi`                              |
| GET             | `/v1/admin/files`              | JWT analista                          | `AdminFilesApi`                         |
| POST            | `/v1/admin/files/{id}/release` | JWT admin                             | `AdminFilesApi`                         |
| GET             | `/v1/admin/metrics`            | JWT analista                          | `MetricsApi`                            |
| GET             | `/v1/admin/audit`              | JWT admin                             | `AuditApi`                              |
| GET             | `/v1/admin/events`             | JWT analista (SSE)                    | `EventsApi`                             |
| GET/POST/DELETE | `/v1/admin/api-keys`           | JWT admin                             | `ApiKeysApi`                            |

## Modelos (TypeScript)

```ts
export type FileStatus = 'pending' | 'clean' | 'quarantined' | 'rejected';
export type Role = 'analyst' | 'admin';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type DetectionLayer =
  | 'signature'
  | 'whitelist'
  | 'cdr'
  | 'clamav'
  | 'virustotal'
  | 'size_limit'
  | 'pixel_limit'
  | 'rate_limit'
  | 'encrypted_pdf';
export type LayerOutcome = 'passed' | 'failed' | 'skipped' | 'running';

export interface FileRecord {
  id: string; // UUID
  originalName: string; // HOSTIL: solo interpolación
  appId: string;
  appName: string;
  declaredExtension: string | null;
  declaredContentType: string | null;
  detectedType: 'image/jpeg' | 'image/png' | 'application/pdf' | string;
  sizeBytes: number;
  sha256: string;
  status: FileStatus;
  blockedBy: DetectionLayer | null;
  reason: string | null;
  createdAt: string; // ISO 8601
  analyzedAt: string | null;
  quarantineExpiresAt: string | null;
}

export interface LayerResult {
  layer: DetectionLayer;
  outcome: LayerOutcome;
  detail: string | null; // ej. "EICAR-Test-File", "JavaScript eliminado"
  durationMs: number | null;
  vtDetections?: { positives: number; total: number };
}

export interface FileDetail extends FileRecord {
  layers: LayerResult[];
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface FileQuery {
  status?: FileStatus[];
  appId?: string;
  from?: string;
  to?: string;
  q?: string;
  sort?: 'createdAt' | 'sizeBytes' | 'status';
  dir?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface ReleaseRequest {
  reason: string;
} // mín. 20 caracteres

export interface Metrics {
  period: '24h' | '7d' | '30d';
  totals: Record<FileStatus | 'processed', number>;
  threatsByDay: { date: string; blocked: number; quarantined: number }[];
  byLayer: { layer: DetectionLayer; count: number }[];
  topApps: { appId: string; appName: string; blocked: number }[];
}

export interface AuditEntry {
  id: string;
  actor: { id: string; email: string; role: Role };
  action:
    'login' | 'logout' | 'release_file' | 'create_api_key' | 'revoke_api_key' | 'login_failed';
  resource: string | null;
  reason: string | null; // HOSTIL en export CSV
  ip: string;
  at: string;
}

export interface SecurityEvent {
  id: string;
  severity: Severity;
  type: 'malware_detected' | 'policy_rejected' | 'rate_limited' | 'file_released' | 'login_failed';
  fileId: string | null;
  appName: string | null;
  message: string;
  at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  appId: string;
  appName: string;
  prefix: string; // ej. "gk_live_3f9a"
  createdAt: string;
  lastUsedAt: string | null;
  status: 'active' | 'revoked';
}
export interface ApiKeyCreated extends ApiKey {
  secret: string;
} // se muestra una vez

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  mfaEnabled: boolean;
}
export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: SessionUser;
}
export interface LoginStep1Response {
  mfaRequired: true;
  challengeId: string;
}
```

## Errores esperados

| Código | Caso                                            | UI                                         |
| ------ | ----------------------------------------------- | ------------------------------------------ |
| 400    | Validación                                      | Mensaje en el campo                        |
| 401    | Token expirado                                  | Refresh (S4)                               |
| 403    | Rol insuficiente                                | `/forbidden`                               |
| 404    | No existe o es de otra app (IDOR)               | "Archivo no encontrado"                    |
| 409    | Liberar un archivo que ya no está en cuarentena | Toast + recargar                           |
| 423    | Cuenta bloqueada                                | Estado de login bloqueado                  |
| 429    | Rate limit                                      | Mensaje con tiempo de espera               |
| 5xx    | Error del servidor                              | `gk-empty-state` de error con "Reintentar" |

## Datos mock

- Apps: **Portal Escolar**, **App Pagos PyME**, **RH Reclutamiento**.
- Usuarios: `analista@gatekeeper.test` (analyst), `admin@gatekeeper.test` (admin, MFA).
- Detecciones de ejemplo: `EICAR-Test-File`, "PDF con JavaScript eliminado", "Polyglot JPEG reconstruido", "Bomba de píxeles rechazada", "PDF cifrado rechazado", "SVG no permitido".

## Fixtures hostiles

Obligatorios en `core/mocks/hostile-filenames.ts` y presentes en la tabla de archivos, el detalle, la cuarentena, las alertas y la auditoría:

```ts
export const HOSTILE_FILENAMES = [
  '<script>alert(1)</script>.jpg',
  '"><img src=x onerror=alert(1)>.png',
  '../../etc/passwd',
  '..\\..\\windows\\system32\\config\\sam',
  'factura.pdf.exe',
  'foto.jpg\u0000.php',
  '=HYPERLINK("http://evil.test","clic").pdf',
  "{{constructor.constructor('alert(1)')()}}.png",
  '‮gnp.exe', // override RTL
  'comprobante_pago_marzo_2026_cliente_final_version_definitiva_revisada_' +
    'x'.repeat(220) +
    '.pdf',
  '😈💣.pdf',
  '   espacios   .jpg',
];
```
