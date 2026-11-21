// Modelos del front para archivos (05-api-contratos.md). Los valores están en inglés;
// core/api/backend-adapter.ts los traduce desde el backend.

/** `unknown`: el backend mandó un estado que el front no conoce. Se trata como restringido. */
export type FileStatus = 'pending' | 'clean' | 'quarantined' | 'rejected' | 'error' | 'unknown';

/** Valores de estado que el usuario puede usar como filtro (no incluye `unknown`). */
export type FilterableFileStatus = Exclude<FileStatus, 'unknown'>;

export type DetectionLayer =
  | 'signature'
  | 'whitelist'
  | 'cdr'
  | 'clamav'
  | 'virustotal'
  | 'size_limit'
  | 'pixel_limit'
  | 'rate_limit'
  | 'encrypted_pdf'
  | 'unknown';

export type LayerOutcome =
  'passed' | 'failed' | 'skipped' | 'running' | 'not_evaluated' | 'unknown';

/** Motivo de rechazo o error de una capa, traducido de `detalle.motivo`. */
export type RejectionReason =
  | 'type_not_allowed'
  | 'pixel_limit'
  | 'page_limit'
  | 'encrypted'
  | 'decompression_limit'
  | 'output_too_large'
  | 'scan_limit'
  | 'invalid_stream'
  | 'invalid_image'
  | 'invalid_pdf'
  | 'timeout'
  | 'internal'
  | 'unknown';

export interface LayerResult {
  layer: DetectionLayer;
  outcome: LayerOutcome;
  reason: RejectionReason | null;
  /** Nombre de la firma de malware (ClamAV), validado; nunca texto libre. */
  signature: string | null;
  durationMs: number | null;
  vtDetections: { positives: number; total: number } | null;
}

/** Metadatos mínimos que K20 permite ver de cualquier archivo. */
interface FileMetadata {
  id: string; // UUID validado
  appId: string;
  appName: string | null;
  status: FileStatus;
  /** MIME validado; `unknown` si el backend mandó algo que no es un MIME. */
  detectedType: string | null;
  sizeBytes: number | null;
  createdAt: string | null; // ISO 8601
  analyzedAt: string | null;
}

/**
 * K20: archivo limpio, rechazado, pendiente o en error sin detección de malware.
 * Solo metadatos mínimos: el compilador no deja leer `originalName`, `sha256` ni `layers`.
 */
export interface RestrictedFile extends FileMetadata {
  readonly disclosure: 'restricted';
}

/** K20: archivo en cuarentena o con malware detectado por alguna capa. Detalle completo. */
export interface DisclosedFile extends FileMetadata {
  readonly disclosure: 'full';
  originalName: string | null; // HOSTIL: solo interpolación
  sha256: string | null;
  malwareDetected: boolean;
  blockedBy: DetectionLayer | null;
  reason: RejectionReason | null;
  quarantineExpiresAt: string | null;
  layers: readonly LayerResult[];
}

/** Unión discriminada por `disclosure`. Narrowing obligatorio antes de leer el detalle. */
export type FileRecord = RestrictedFile | DisclosedFile;

export type FileSortField = 'createdAt' | 'sizeBytes' | 'status';

export interface FileQuery {
  status?: readonly FilterableFileStatus[];
  appId?: string;
  from?: string;
  to?: string;
  /** Busca por prefijo de id; por nombre o SHA-256 solo entre archivos con detalle (K20). */
  q?: string;
  sort?: FileSortField;
  dir?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

/** Motivo de liberación: mínimo 20 caracteres. Va en el cuerpo, nunca en la URL (S10). */
export interface ReleaseRequest {
  reason: string;
}

export const RELEASE_REASON_MIN_LENGTH = 20;
