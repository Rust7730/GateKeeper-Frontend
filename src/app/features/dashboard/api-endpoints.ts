// Catálogo de endpoints de la API de Gatekeeper que usa la consola de pruebas.
export interface ApiEndpoint {
  id: string;
  name: string;
  folder: string;
  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
  path: string;
  summary: string;
  description: string;
  requestBody?: string;
  responseExample: Record<string, unknown>;
  latencyMs: number;
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'files-scan',
    name: 'scan.post',
    folder: 'files',
    method: 'POST',
    path: '/api/v1/files/scan',
    summary: 'Inspección de tipo real y desinfección CDR',
    description:
      'Analiza el archivo contra firmas binarias reales, desmantela scripts incrustados (JavaScript, macros, acciones automáticas) y genera una copia higienizada lista para almacenamiento.',
    requestBody: JSON.stringify(
      {
        filename: 'contrato_firmado.pdf',
        mime_declared: 'application/pdf',
        cdr_profile: 'strict_disarm',
        quarantine_on_threat: true,
      },
      null,
      2,
    ),
    responseExample: {
      status: 'success',
      scan_id: 'scan_8f93a12d',
      verdict: 'CLEAN',
      real_mime: 'application/pdf',
      declared_mime: 'application/pdf',
      active_content_found: ['embedded_js_stream', 'open_action'],
      cdr_action: 'RECONSTRUCTED',
      reconstructed_file_url: 'https://cdn.gatekeeper.dev/clean/scan_8f93a12d_clean.pdf',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      latency_ms: 18,
    },
    latencyMs: 18,
  },
  {
    id: 'files-upload',
    name: 'upload.post',
    folder: 'files',
    method: 'POST',
    path: '/api/v1/files/upload',
    summary: 'Subida directa multipart para procesamiento asíncrono',
    description:
      'Recibe archivos pesados por stream binario y entrega un token de seguimiento para notificaciones vía Webhook.',
    requestBody: JSON.stringify(
      {
        file: '<binary_stream>',
        webhook_url: 'https://mi-app.com/api/gatekeeper-hook',
        max_size_mb: 25,
      },
      null,
      2,
    ),
    responseExample: {
      status: 'queued',
      file_id: 'file_77a90b1c',
      estimated_duration_ms: 45,
      notification_channel: 'webhook',
    },
    latencyMs: 12,
  },
  {
    id: 'files-download',
    name: 'download.get',
    folder: 'files',
    method: 'GET',
    path: '/api/v1/files/:scan_id/download',
    summary: 'Descarga del archivo seguro reconstruido',
    description:
      'Obtiene la copia sanitizada con encabezados seguros Content-Disposition y Content-Security-Policy.',
    responseExample: {
      status: 'ready',
      download_url: 'https://api.gatekeeper.dev/v1/download/token_33fa81bc',
      expires_in_seconds: 3600,
    },
    latencyMs: 8,
  },
  {
    id: 'files-status',
    name: 'status.get',
    folder: 'files',
    method: 'GET',
    path: '/api/v1/files/:scan_id',
    summary: 'Consulta de estado y dictamen de inspección',
    description:
      'Retorna el dictamen (CLEAN, REJECTED, QUARANTINED), metadatos desinfectados y log detallado de sanitización.',
    responseExample: {
      scan_id: 'scan_8f93a12d',
      status: 'completed',
      verdict: 'CLEAN',
      disinfected_elements_count: 2,
    },
    latencyMs: 6,
  },
  {
    id: 'quarantine-list',
    name: 'records.get',
    folder: 'quarantine',
    method: 'GET',
    path: '/api/v1/quarantine/records',
    summary: 'Listado de archivos aislados y retención forense',
    description:
      'Consulta archivos bloqueados por polimorfismo o malware de día cero retenidos de forma segura.',
    responseExample: {
      total_quarantined: 3412,
      page: 1,
      items: [
        {
          id: 'quarantine_01',
          filename: 'factura_marzo.exe',
          threat_type: 'EXECUTABLE_IN_DISGUISE',
        },
      ],
    },
    latencyMs: 14,
  },
  {
    id: 'cdr-profiles',
    name: 'profiles.get',
    folder: 'cdr-engine',
    method: 'GET',
    path: '/api/v1/cdr-engine/profiles',
    summary: 'Perfiles activos de sanitización y reconstrucción',
    description:
      'Configuración de reglas para PDFs, hojas de cálculo de Office, imágenes SVG y archivos comprimidos.',
    responseExample: {
      profiles: ['strict_disarm', 'balance_enterprise', 'audit_preserve'],
      default: 'strict_disarm',
    },
    latencyMs: 9,
  },
  {
    id: 'webhooks-subscribe',
    name: 'endpoints.post',
    folder: 'webhooks',
    method: 'POST',
    path: '/api/v1/webhooks/endpoints',
    summary: 'Registro de webhook para eventos de inspección',
    description:
      'Recibe notificaciones inmediatas en cuanto un archivo grande termine su higienización en lote.',
    requestBody: JSON.stringify(
      {
        url: 'https://mi-empresa.com/secops/gatekeeper-hook',
        secret: 'whsec_99a8b7c6d5e4',
        events: ['file.clean', 'file.blocked', 'file.quarantined'],
      },
      null,
      2,
    ),
    responseExample: {
      id: 'webhook_55a2',
      status: 'active',
      verified: true,
    },
    latencyMs: 21,
  },
  {
    id: 'api-keys-list',
    name: 'tokens.get',
    folder: 'api-keys',
    method: 'GET',
    path: '/api/v1/api-keys/tokens',
    summary: 'Gestión y rotación de claves de acceso API',
    description:
      'Permite auditar el uso de tokens por entorno (Production / Sandbox) y definir políticas de revocación.',
    responseExample: {
      keys_count: 2,
      active_keys: [
        { id: 'key_prod_01', label: 'Production Ingestion API', prefix: 'gk_live_8f92' },
        { id: 'key_sand_02', label: 'Staging & Tests', prefix: 'gk_test_14a0' },
      ],
    },
    latencyMs: 11,
  },
];

export interface EndpointGroup {
  readonly folder: string;
  readonly items: readonly ApiEndpoint[];
}

/** Agrupa los endpoints por carpeta, conservando el orden del catálogo. */
export function groupEndpoints(folder?: string): EndpointGroup[] {
  const groups = new Map<string, ApiEndpoint[]>();
  for (const endpoint of API_ENDPOINTS) {
    if (folder && endpoint.folder !== folder) continue;
    groups.set(endpoint.folder, [...(groups.get(endpoint.folder) ?? []), endpoint]);
  }
  return [...groups].map(([name, items]) => ({ folder: name, items }));
}
