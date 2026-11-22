// Catálogo real de endpoints de la API de Gatekeeper para la consola de pruebas.
export type EndpointAuthMode = 'api-key' | 'jwt' | 'none';

export interface ApiEndpoint {
  id: string;
  name: string;
  folder: string;
  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
  path: string;
  authMode: EndpointAuthMode;
  isMultipart?: boolean;
  /** Nombre corto para la lista de la consola. */
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  description: string;
  descriptionEn: string;
  requestBody?: string;
  responseExample: Record<string, unknown>;
  /** Código HTTP del ejemplo de respuesta (200 si se omite). */
  responseStatus?: { code: number; text: string };
  latencyMs: number;
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'files-upload',
    title: 'Subir un archivo',
    titleEn: 'Upload a file',
    name: 'upload.post',
    folder: 'files',
    method: 'POST',
    path: '/v1/files',
    authMode: 'api-key',
    isMultipart: true,
    summary: 'Subir archivo para inspección (CDR + ClamAV + VirusTotal)',
    description:
      'Recibe un archivo multipart (campo "file", máx. 10 MiB), calcula SHA-256 en streaming y responde 202 con el UUID para consultar el veredicto.',
    summaryEn: 'Upload a file for inspection (CDR + ClamAV + VirusTotal)',
    descriptionEn:
      'Receives a multipart file ("file" field, max. 10 MiB), computes SHA-256 while streaming and responds 202 with the UUID to check the verdict.',
    responseExample: {
      id: '3c7b078b-47f5-475e-a6f5-d0fc32c30b16',
      estado: 'pendiente',
    },
    responseStatus: { code: 202, text: 'Accepted' },
    latencyMs: 45,
  },
  {
    id: 'files-status',
    title: 'Consultar el estado',
    titleEn: 'Check the status',
    name: 'status.get',
    folder: 'files',
    method: 'GET',
    path: '/v1/files/:id',
    authMode: 'api-key',
    summary: 'Consultar estado y veredicto del archivo',
    description:
      'Devuelve el estado actual (pendiente, limpio, rechazado, en_cuarentena o error), tipo MIME real detectado, tamaño y SHA-256.',
    summaryEn: 'Check the file status and verdict',
    descriptionEn:
      'Returns the current status (pending, clean, rejected, quarantined or error), the real detected MIME type, size and SHA-256.',
    responseExample: {
      id: '3c7b078b-47f5-475e-a6f5-d0fc32c30b16',
      estado: 'limpio',
      tipo_detectado: 'image/png',
      tamano_bytes: 1024,
    },
    latencyMs: 12,
  },
  {
    id: 'files-download',
    title: 'Descargar la copia limpia',
    titleEn: 'Download the clean copy',
    name: 'content.get',
    folder: 'files',
    method: 'GET',
    path: '/v1/files/:id/content',
    authMode: 'api-key',
    summary: 'Descargar copia limpia reconstruida',
    description:
      'Solo responde 200 cuando el estado es "limpio" (copia reconstruida sin EXIF ni JS). En cualquier otro estado responde 409 Conflict.',
    summaryEn: 'Download the reconstructed clean copy',
    descriptionEn:
      'Only responds 200 when the status is "limpio" (clean copy rebuilt without EXIF or JS). Any other status responds 409 Conflict.',
    responseExample: {
      nota: 'En 200 OK devuelve el binario reconstruido (Content-Disposition: attachment). En otro estado devuelve 409 Conflict.',
    },
    latencyMs: 18,
  },
  {
    id: 'quarantine-list',
    title: 'Ver la cuarentena',
    titleEn: 'View quarantine',
    name: 'list.get',
    folder: 'quarantine',
    method: 'GET',
    path: '/v1/admin/files?estado=en_cuarentena',
    authMode: 'jwt',
    summary: 'Listar archivos en cuarentena (JWT dashboard)',
    description:
      'Consulta archivos aislados por ClamAV o VirusTotal con nombre original, SHA-256, caducidad (30 días) y detalle de capas (K20).',
    summaryEn: 'List quarantined files (dashboard JWT)',
    descriptionEn:
      'Lists files isolated by ClamAV or VirusTotal with original name, SHA-256, expiry (30 days) and per-layer detail (K20).',
    responseExample: {
      elementos: [],
      pagina: 1,
      tamano_pagina: 25,
      total: 0,
    },
    latencyMs: 15,
  },
  {
    id: 'quarantine-release',
    title: 'Liberar de cuarentena',
    titleEn: 'Release from quarantine',
    name: 'release.post',
    folder: 'quarantine',
    method: 'POST',
    path: '/v1/admin/files/:id/release',
    authMode: 'jwt',
    summary: 'Liberar archivo de cuarentena (solo admin, re-CDR)',
    description:
      'Exige motivo de 20 a 500 caracteres (K18), registra en bitácora inmutable y reencola en el CDR antes de marcar limpio.',
    summaryEn: 'Release a file from quarantine (admin only, re-CDR)',
    descriptionEn:
      'Requires a reason of 20 to 500 characters (K18), records it in the immutable audit log and requeues the file in the CDR before marking it clean.',
    requestBody: JSON.stringify(
      {
        motivo: 'Falso positivo verificado manualmente por SecOps #ticket-01',
      },
      null,
      2,
    ),
    responseExample: {
      id: '3c7b078b-47f5-475e-a6f5-d0fc32c30b16',
      estado: 'en_cuarentena',
      reencolado: true,
    },
    responseStatus: { code: 202, text: 'Accepted' },
    latencyMs: 25,
  },
  {
    id: 'admin-files-list',
    title: 'Listar archivos',
    titleEn: 'List files',
    name: 'files.get',
    folder: 'admin',
    method: 'GET',
    path: '/v1/admin/files',
    authMode: 'jwt',
    summary: 'Listado de archivos del dashboard (K20)',
    description:
      'Devuelve metadatos mínimos en archivos sin malware y detalle completo únicamente en archivos en cuarentena o con detección maliciosa.',
    summaryEn: 'Dashboard file list (K20)',
    descriptionEn:
      'Returns minimal metadata for files without malware and full detail only for quarantined files or files with a malicious detection.',
    responseExample: {
      elementos: [],
      pagina: 1,
      tamano_pagina: 25,
      total: 0,
    },
    latencyMs: 14,
  },
  {
    id: 'admin-metrics',
    title: 'Ver métricas',
    titleEn: 'View metrics',
    name: 'metrics.get',
    folder: 'admin',
    method: 'GET',
    path: '/v1/admin/metrics?periodo=7d',
    authMode: 'jwt',
    summary: 'Métricas de inspecciones y amenazas (7 días)',
    description:
      'Totales por estado, amenazas agrupadas por día, bloqueos por capa y top aplicaciones.',
    summaryEn: 'Inspection and threat metrics (7 days)',
    descriptionEn:
      'Totals by status, threats grouped by day, blocks by layer and top applications.',
    responseExample: {
      periodo: '7d',
      totales: { pendiente: 0, limpio: 0, en_cuarentena: 0, rechazado: 0, error: 0, procesados: 0 },
    },
    latencyMs: 16,
  },
  {
    id: 'admin-api-keys',
    title: 'Listar claves API',
    titleEn: 'List API keys',
    name: 'api-keys.get',
    folder: 'admin',
    method: 'GET',
    path: '/v1/admin/api-keys',
    authMode: 'jwt',
    summary: 'Listado de API keys activas y revocadas (solo admin)',
    description: 'Devuelve el prefijo y estado de cada API key sin exponer nunca el secreto.',
    summaryEn: 'Active and revoked API keys (admin only)',
    descriptionEn:
      'Returns the prefix and status of each API key without ever exposing the secret.',
    responseExample: {
      nota: 'Devuelve la lista JSON de API keys registradas.',
    },
    latencyMs: 11,
  },
  {
    id: 'system-health',
    title: 'Estado de la API',
    titleEn: 'API health',
    name: 'health.get',
    folder: 'system',
    method: 'GET',
    path: '/health',
    authMode: 'none',
    summary: 'Estado de disponibilidad de la API',
    description: 'Endpoint público de salud que responde 200 {"estado": "ok"}.',
    summaryEn: 'API availability status',
    descriptionEn: 'Public health endpoint that responds 200 {"estado": "ok"}.',
    responseExample: {
      estado: 'ok',
    },
    latencyMs: 5,
  },
];

export interface EndpointGroup {
  readonly folder: string;
  readonly items: readonly ApiEndpoint[];
}

/** Agrupa los endpoints por carpeta, conservando el orden del catálogo. */
/** Nombre de cada grupo en la lista de la consola. */
export const FOLDER_LABELS: Record<string, { es: string; en: string }> = {
  files: { es: 'Archivos', en: 'Files' },
  quarantine: { es: 'Cuarentena', en: 'Quarantine' },
  admin: { es: 'Administración', en: 'Administration' },
  system: { es: 'Sistema', en: 'System' },
};

export function groupEndpoints(folder?: string): EndpointGroup[] {
  const groups = new Map<string, ApiEndpoint[]>();
  for (const endpoint of API_ENDPOINTS) {
    if (folder && endpoint.folder !== folder) continue;
    groups.set(endpoint.folder, [...(groups.get(endpoint.folder) ?? []), endpoint]);
  }
  return [...groups].map(([name, items]) => ({ folder: name, items }));
}
