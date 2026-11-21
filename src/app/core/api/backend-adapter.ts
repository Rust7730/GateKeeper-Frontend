// Adaptador puro: respuesta del backend (DTO, en español) -> modelos del front (en inglés).
//
// Reglas:
// - Lee todo como `unknown` y valida campo por campo: nunca confía en la forma del DTO.
// - Un valor desconocido cae en `unknown` (o `null`), nunca en el texto crudo.
// - K20 falla cerrado: si un archivo no está en cuarentena ni tiene malware detectado,
//   se descartan nombre original, SHA-256, caducidad de cuarentena y resultados por capa,
//   aunque el DTO los traiga.
// - Las búsquedas en tablas usan `Map`, así que claves como `constructor` o `__proto__`
//   no resuelven a nada del prototipo.

import { ApiKey, ApiKeyCreated } from '../models/api-key.model';
import { AuditAction, AuditEntry, AuditQuery } from '../models/audit.model';
import {
  DetectionLayer,
  DisclosedFile,
  FileQuery,
  FileRecord,
  FileSortField,
  FileStatus,
  FilterableFileStatus,
  LayerOutcome,
  LayerResult,
  RejectionReason,
  RestrictedFile,
} from '../models/file.model';
import { Metrics, MetricsPeriod } from '../models/metrics.model';
import { Page } from '../models/page.model';
import { SecurityEvent, SecurityEventType, Severity } from '../models/security-event.model';
import { LoginResult, Role, Session } from '../models/session.model';
import {
  AccionAuditoriaDto,
  CapaDto,
  EstadoArchivoDto,
  LiberacionDto,
  MotivoDto,
  RolDto,
  SeveridadDto,
  TipoEventoDto,
  VeredictoDto,
} from './backend.dto';

/** La respuesta no tiene la forma mínima para construir el modelo (p. ej. sin id válido). */
export class InvalidDtoError extends Error {
  constructor(what: string) {
    super(`Respuesta del backend inválida: ${what}`);
    this.name = 'InvalidDtoError';
  }
}

// ---------------------------------------------------------------------------
// Tablas de mapeo. `Record<…Dto, …>` obliga a cubrir todos los valores del backend.
// ---------------------------------------------------------------------------

const STATUS_BY_ESTADO: Record<EstadoArchivoDto, FilterableFileStatus> = {
  pendiente: 'pending',
  limpio: 'clean',
  en_cuarentena: 'quarantined',
  rechazado: 'rejected',
  error: 'error',
};

const LAYER_BY_CAPA: Record<CapaDto, DetectionLayer> = {
  firma: 'signature',
  cdr: 'cdr',
  clamav: 'clamav',
  virustotal: 'virustotal',
};

const OUTCOME_BY_VEREDICTO: Record<VeredictoDto, LayerOutcome> = {
  limpio: 'passed',
  malicioso: 'failed',
  rechazado: 'failed',
  error: 'failed',
  no_evaluada: 'not_evaluated',
};

const REASON_BY_MOTIVO: Record<MotivoDto, RejectionReason> = {
  tipo_no_permitido: 'type_not_allowed',
  pixeles: 'pixel_limit',
  imagen_invalida: 'invalid_image',
  paginas: 'page_limit',
  cifrado: 'encrypted',
  pdf_cifrado: 'encrypted',
  pdf_invalido: 'invalid_pdf',
  descompresion: 'decompression_limit',
  salida_grande: 'output_too_large',
  escaneos: 'scan_limit',
  flujo_invalido: 'invalid_stream',
  timeout: 'timeout',
  interno: 'internal',
};

/**
 * Motivo -> capa que bloqueó (`blockedBy`). `null`: el motivo no apunta a una capa de
 * política y se usa la capa del resultado (p. ej. un timeout del CDR bloquea en `cdr`).
 */
const BLOCKED_BY_MOTIVO: Record<MotivoDto, DetectionLayer | null> = {
  tipo_no_permitido: 'whitelist',
  pixeles: 'pixel_limit',
  imagen_invalida: 'cdr',
  paginas: 'size_limit',
  cifrado: 'encrypted_pdf',
  pdf_cifrado: 'encrypted_pdf',
  pdf_invalido: 'cdr',
  descompresion: 'size_limit',
  salida_grande: 'size_limit',
  escaneos: 'cdr',
  flujo_invalido: 'cdr',
  timeout: null,
  interno: null,
};

/** `ok` es el motivo que el CDR manda con un veredicto limpio: no es un rechazo. */
const MOTIVO_OK = 'ok';

const ROLE_BY_ROL: Record<RolDto, Role> = { analista: 'analyst', admin: 'admin' };

const ACTION_BY_ACCION: Record<AccionAuditoriaDto, Exclude<AuditAction, 'unknown'>> = {
  inicio_sesion: 'login',
  cierre_sesion: 'logout',
  liberar_archivo: 'release_file',
  crear_api_key: 'create_api_key',
  revocar_api_key: 'revoke_api_key',
  inicio_fallido: 'login_failed',
};

const SEVERITY_BY_SEVERIDAD: Record<SeveridadDto, Severity> = {
  baja: 'low',
  media: 'medium',
  alta: 'high',
  critica: 'critical',
};

const EVENT_TYPE_BY_TIPO: Record<TipoEventoDto, SecurityEventType> = {
  malware_detectado: 'malware_detected',
  rechazo_politica: 'policy_rejected',
  limite_tasa: 'rate_limited',
  archivo_liberado: 'file_released',
  inicio_fallido: 'login_failed',
};

/** Eventos cuyo archivo tuvo malware o cuarentena: los únicos que pueden traer nombre (K20). */
const EVENTS_WITH_FILE_NAME: ReadonlySet<SecurityEventType> = new Set([
  'malware_detected',
  'file_released',
]);

const SORT_FIELD: Record<FileSortField, string> = {
  createdAt: 'creado_en',
  sizeBytes: 'tamano_bytes',
  status: 'estado',
};

const PERIODS: ReadonlySet<string> = new Set<MetricsPeriod>(['24h', '7d', '30d']);

/** Tablas expuestas para pruebas y documentación (solo lectura). */
export const MAPPINGS = {
  status: STATUS_BY_ESTADO,
  layer: LAYER_BY_CAPA,
  outcome: OUTCOME_BY_VEREDICTO,
  reason: REASON_BY_MOTIVO,
  blockedBy: BLOCKED_BY_MOTIVO,
  role: ROLE_BY_ROL,
  action: ACTION_BY_ACCION,
  severity: SEVERITY_BY_SEVERIDAD,
  eventType: EVENT_TYPE_BY_TIPO,
} as const;

const toMap = <V>(table: Readonly<Record<string, V>>): ReadonlyMap<string, V> =>
  new Map(Object.entries(table));

const STATUS = toMap(STATUS_BY_ESTADO);
const ESTADO_BY_STATUS: ReadonlyMap<string, string> = new Map(
  Object.entries(STATUS_BY_ESTADO).map(([estado, status]) => [status, estado]),
);
const LAYER = toMap(LAYER_BY_CAPA);
const OUTCOME = toMap(OUTCOME_BY_VEREDICTO);
const REASON = toMap(REASON_BY_MOTIVO);
const BLOCKED_BY = toMap(BLOCKED_BY_MOTIVO);
const ROLE = toMap(ROLE_BY_ROL);
const ACTION = toMap(ACTION_BY_ACCION);
const SEVERITY = toMap(SEVERITY_BY_SEVERIDAD);
const EVENT_TYPE = toMap(EVENT_TYPE_BY_TIPO);

// ---------------------------------------------------------------------------
// Validadores
// ---------------------------------------------------------------------------

type Raw = Readonly<Record<string, unknown>>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA256_RE = /^[0-9a-f]{64}$/;
const MIME_RE = /^[a-z0-9][a-z0-9.+-]{0,63}\/[a-z0-9][a-z0-9.+-]{0,63}$/;
const SIGNATURE_RE = /^[A-Za-z0-9._:-]{1,128}$/;
const API_KEY_PREFIX_RE = /^gk_[0-9a-f]{12}$/;
const IP_RE = /^[0-9a-fA-F:.]{2,45}$/;

function asObject(value: unknown): Raw | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Raw)
    : null;
}

function lookup<V>(table: ReadonlyMap<string, V>, value: unknown, fallback: V): V {
  if (typeof value !== 'string') return fallback;
  const found = table.get(value);
  return found === undefined ? fallback : found;
}

/** `true` si es un UUID: los servicios lo exigen antes de poner un id en la URL. */
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

const uuid = (v: unknown): string | null => (isUuid(v) ? v.toLowerCase() : null);

const text = (v: unknown): string | null => (typeof v === 'string' ? v : null);

/**
 * Fecha normalizada a ISO 8601 (UTC). Nunca devuelve el texto recibido: `Date.parse`
 * acepta cosas como `"2026-01-01 (<img src=x onerror=alert(1)>)"`.
 */
function isoDate(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const ms = Date.parse(v);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

const count = (v: unknown): number | null =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : null;

function mime(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return typeof v === 'string' && MIME_RE.test(v) ? v : 'unknown';
}

function requireUuid(v: unknown, what: string): string {
  const id = uuid(v);
  if (id === null) throw new InvalidDtoError(what);
  return id;
}

function requireObject(v: unknown, what: string): Raw {
  const o = asObject(v);
  if (o === null) throw new InvalidDtoError(what);
  return o;
}

// ---------------------------------------------------------------------------
// Archivos
// ---------------------------------------------------------------------------

/** K20: solo cuarentena o malware detectado por alguna capa abren el detalle. */
export function isDisclosable(status: FileStatus, malwareDetected: boolean): boolean {
  return status === 'quarantined' || malwareDetected;
}

interface ParsedResult {
  result: LayerResult;
  verdict: VeredictoDto | null;
  motivo: string | null;
}

function toLayerResult(input: unknown): ParsedResult | null {
  const o = asObject(input);
  if (o === null) return null;
  const veredicto = typeof o['veredicto'] === 'string' ? o['veredicto'] : null;
  const verdict = veredicto !== null && OUTCOME.has(veredicto) ? (veredicto as VeredictoDto) : null;
  const detalle = asObject(o['detalle']) ?? {};
  const motivo = typeof detalle['motivo'] === 'string' ? detalle['motivo'] : null;

  const positives = count(detalle['positivos']);
  const total = count(detalle['total']);
  const firma = detalle['firma'];

  return {
    verdict,
    motivo,
    result: {
      layer: lookup(LAYER, o['capa'], 'unknown'),
      outcome: lookup(OUTCOME, o['veredicto'], 'unknown'),
      reason: motivo === null || motivo === MOTIVO_OK ? null : lookup(REASON, motivo, 'unknown'),
      signature:
        verdict === 'malicioso' && typeof firma === 'string' && SIGNATURE_RE.test(firma)
          ? firma
          : null,
      durationMs: count(o['duracion_ms']),
      vtDetections:
        positives !== null && total !== null && total > 0 && positives <= total
          ? { positives, total }
          : null,
    },
  };
}

/** Capa que bloqueó el archivo: primero malware, luego rechazo de política, luego error. */
function blockingResult(results: readonly ParsedResult[]): ParsedResult | null {
  for (const verdict of ['malicioso', 'rechazado', 'error'] as const) {
    const hit = results.find((r) => r.verdict === verdict);
    if (hit) return hit;
  }
  return null;
}

function blockedByOf(hit: ParsedResult): DetectionLayer {
  if (hit.verdict !== 'malicioso' && hit.motivo !== null) {
    const byReason = lookup<DetectionLayer | null>(BLOCKED_BY, hit.motivo, null);
    if (byReason !== null) return byReason;
  }
  return hit.result.layer;
}

export function toFileRecord(input: unknown): FileRecord {
  const o = requireObject(input, 'archivo');
  const status: FileStatus = lookup<FileStatus>(STATUS, o['estado'], 'unknown');
  const metadata = {
    id: requireUuid(o['id'], 'archivo.id'),
    appId: requireUuid(o['aplicacion_id'], 'archivo.aplicacion_id'),
    appName: text(o['aplicacion_nombre']),
    status,
    detectedType: mime(o['tipo_detectado']),
    sizeBytes: count(o['tamano_bytes']),
    createdAt: isoDate(o['creado_en']),
    analyzedAt: isoDate(o['analizado_en']),
  };

  const rawResults = Array.isArray(o['resultados']) ? (o['resultados'] as unknown[]) : [];
  const parsed = rawResults.map(toLayerResult).filter((r): r is ParsedResult => r !== null);
  const malwareDetected = parsed.some((r) => r.verdict === 'malicioso');

  if (!isDisclosable(status, malwareDetected)) {
    // Falla cerrado: lo que el DTO traiga de más se descarta aquí.
    const restricted: RestrictedFile = { disclosure: 'restricted', ...metadata };
    return restricted;
  }

  const hit = blockingResult(parsed);
  // El backend guarda el motivo en el resultado del CDR aunque bloquee la firma
  // (firma: rechazado sin motivo; cdr: no_evaluada con `tipo_no_permitido`).
  const reason = hit
    ? (hit.result.reason ?? parsed.find((r) => r.result.reason !== null)?.result.reason ?? null)
    : null;
  const sha = o['sha256'];
  const disclosed: DisclosedFile = {
    disclosure: 'full',
    ...metadata,
    originalName: text(o['nombre_original']),
    sha256: typeof sha === 'string' && SHA256_RE.test(sha) ? sha : null,
    malwareDetected,
    blockedBy: hit ? blockedByOf(hit) : null,
    reason,
    quarantineExpiresAt: isoDate(o['cuarentena_expira_en']),
    layers: parsed.map((r) => r.result),
  };
  return disclosed;
}

/** Página del backend. Los elementos inválidos se omiten en vez de romper la lista. */
export function toPage<T>(input: unknown, mapItem: (item: unknown) => T): Page<T> {
  const o = requireObject(input, 'página');
  const raw = Array.isArray(o['elementos']) ? (o['elementos'] as unknown[]) : [];
  const items: T[] = [];
  for (const item of raw) {
    try {
      items.push(mapItem(item));
    } catch (error) {
      if (!(error instanceof InvalidDtoError)) throw error;
    }
  }
  return {
    items,
    page: Math.max(1, count(o['pagina']) ?? 1),
    pageSize: count(o['tamano_pagina']) ?? items.length,
    total: count(o['total']) ?? items.length,
  };
}

/** FileQuery del front -> query params del backend. Nada sensible va aquí (S10). */
export function toFileQueryParams(query: FileQuery): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {
    pagina: String(query.page),
    tamano_pagina: String(query.pageSize),
  };
  const estados = (query.status ?? [])
    .map((s) => ESTADO_BY_STATUS.get(s))
    .filter((e): e is string => e !== undefined);
  if (estados.length) params['estado'] = estados;
  if (query.appId) params['aplicacion_id'] = query.appId;
  if (query.from) params['desde'] = query.from;
  if (query.to) params['hasta'] = query.to;
  if (query.q) params['q'] = query.q;
  if (query.sort) params['orden'] = SORT_FIELD[query.sort];
  if (query.dir) params['dir'] = query.dir;
  return params;
}

export function toReleaseBody(reason: string): LiberacionDto {
  return { motivo: reason };
}

// ---------------------------------------------------------------------------
// Métricas, auditoría, eventos y API keys
// ---------------------------------------------------------------------------

export function toMetrics(input: unknown): Metrics {
  const o = requireObject(input, 'métricas');
  const totales = asObject(o['totales']) ?? {};
  const n = (k: string) => count(totales[k]) ?? 0;
  const list = (k: string) =>
    (Array.isArray(o[k]) ? (o[k] as unknown[]) : [])
      .map(asObject)
      .filter((x): x is Raw => x !== null);
  const periodo = o['periodo'];

  return {
    period: typeof periodo === 'string' && PERIODS.has(periodo) ? (periodo as MetricsPeriod) : '7d',
    totals: {
      pending: n('pendiente'),
      clean: n('limpio'),
      quarantined: n('en_cuarentena'),
      rejected: n('rechazado'),
      error: n('error'),
      processed: n('procesados'),
    },
    threatsByDay: list('amenazas_por_dia').flatMap((d) => {
      const date = isoDate(d['fecha']);
      return date === null
        ? []
        : [
            {
              date,
              blocked: count(d['bloqueados']) ?? 0,
              quarantined: count(d['en_cuarentena']) ?? 0,
            },
          ];
    }),
    byLayer: list('por_capa').map((c) => {
      const byReason =
        typeof c['motivo'] === 'string'
          ? lookup<DetectionLayer | null>(BLOCKED_BY, c['motivo'], null)
          : null;
      return {
        layer: byReason ?? lookup<DetectionLayer>(LAYER, c['capa'], 'unknown'),
        count: count(c['total']) ?? 0,
      };
    }),
    topApps: list('top_apps').flatMap((a) => {
      const appId = uuid(a['aplicacion_id']);
      return appId === null
        ? []
        : [{ appId, appName: text(a['aplicacion_nombre']), blocked: count(a['bloqueados']) ?? 0 }];
    }),
  };
}

export function toAuditEntry(input: unknown): AuditEntry {
  const o = requireObject(input, 'auditoría');
  const actor = requireObject(o['actor'], 'auditoría.actor');
  const ip = o['ip'];
  const rawId = o['id'];
  const entryId =
    uuid(rawId) ?? (typeof rawId === 'string' && /^\d{1,20}$/.test(rawId) ? rawId : null);
  if (entryId === null) throw new InvalidDtoError('auditoría.id');
  const rawActorId = actor['id'];
  const actorId =
    rawActorId === '' || rawActorId === null ? '' : requireUuid(rawActorId, 'auditoría.actor.id');
  return {
    id: entryId,
    actor: {
      id: actorId,
      email: text(actor['correo']) ?? '',
      role: lookup<Role | 'unknown'>(ROLE, actor['rol'], 'unknown'),
    },
    action: lookup<AuditAction>(ACTION, o['accion'], 'unknown'),
    resource: text(o['recurso']),
    reason: text(o['motivo']),
    ip: typeof ip === 'string' && IP_RE.test(ip) ? ip : null,
    at: isoDate(o['en']),
  };
}

export function toAuditQueryParams(query: AuditQuery): Record<string, string> {
  const params: Record<string, string> = {
    pagina: String(query.page),
    tamano_pagina: String(query.pageSize),
  };
  if (query.action) {
    const accion = Object.entries(ACTION_BY_ACCION).find(([, a]) => a === query.action)?.[0];
    if (accion) params['accion'] = accion;
  }
  return params;
}

export function toSecurityEvent(input: unknown): SecurityEvent {
  const o = requireObject(input, 'evento');
  const type = lookup<SecurityEventType>(EVENT_TYPE, o['tipo'], 'unknown');
  return {
    id: requireUuid(o['id'], 'evento.id'),
    severity: lookup<Severity>(SEVERITY, o['severidad'], 'unknown'),
    type,
    fileId: uuid(o['archivo_id']),
    appName: text(o['aplicacion_nombre']),
    // K20: el nombre solo se conserva en eventos de malware o liberación.
    fileName: EVENTS_WITH_FILE_NAME.has(type) ? text(o['nombre_archivo']) : null,
    at: isoDate(o['en']),
  };
}

export function toApiKey(input: unknown): ApiKey {
  const o = requireObject(input, 'api key');
  const prefix = o['prefijo'];
  return {
    id: requireUuid(o['id'], 'api key.id'),
    appId: requireUuid(o['aplicacion_id'], 'api key.aplicacion_id'),
    appName: text(o['aplicacion_nombre']),
    prefix: typeof prefix === 'string' && API_KEY_PREFIX_RE.test(prefix) ? prefix : null,
    createdAt: isoDate(o['creada_en']),
    lastUsedAt: isoDate(o['ultimo_uso_en']),
    // Falla cerrado: si la fecha de revocación existe pero no se entiende, se trata como revocada.
    status: o['revocada_en'] === null || o['revocada_en'] === undefined ? 'active' : 'revoked',
  };
}

export function toApiKeyCreated(input: unknown): ApiKeyCreated {
  const o = requireObject(input, 'api key creada');
  const secret = o['secreto'];
  if (typeof secret !== 'string' || secret.length === 0) {
    throw new InvalidDtoError('api key creada.secreto');
  }
  return { ...toApiKey(o), secret };
}

// ---------------------------------------------------------------------------
// Sesión (F5.01–F5.03). Falla cerrado: sin token, expiración o rol válidos no hay sesión.
// ---------------------------------------------------------------------------

/** Máximo que el front acepta para `expira_en` (el backend fija 15 min, F5.02). */
const MAX_SESSION_S = 60 * 60;
/** Token opaco para el front: base64url y puntos (JWT), sin espacios ni comillas. */
const ACCESS_TOKEN_RE = /^[A-Za-z0-9._~+/=-]{16,4096}$/;
const CHALLENGE_RE = /^[A-Za-z0-9_-]{8,128}$/;

export function toSession(input: unknown, now: number = Date.now()): Session {
  const o = requireObject(input, 'sesión');
  const accessToken = o['token_acceso'];
  if (typeof accessToken !== 'string' || !ACCESS_TOKEN_RE.test(accessToken)) {
    throw new InvalidDtoError('sesión.token_acceso');
  }
  const expiresIn = count(o['expira_en']);
  if (expiresIn === null || expiresIn < 1 || expiresIn > MAX_SESSION_S) {
    throw new InvalidDtoError('sesión.expira_en');
  }
  const u = requireObject(o['usuario'], 'sesión.usuario');
  // Un rol desconocido no abre sesión: nunca se adivina un rol.
  const role = lookup<Role | null>(ROLE, u['rol'], null);
  const email = text(u['correo']);
  if (role === null || email === null) throw new InvalidDtoError('sesión.usuario');
  return {
    accessToken,
    expiresAt: now + expiresIn * 1000,
    user: {
      id: requireUuid(u['id'], 'sesión.usuario.id'),
      email,
      role,
      mfaEnabled: u['mfa_activo'] === true,
    },
  };
}

/** Paso 1 del login: desafío TOTP o sesión directa. */
export function toLoginResult(input: unknown, now: number = Date.now()): LoginResult {
  const o = requireObject(input, 'login');
  if (o['mfa_requerido'] === true) {
    const challengeId = o['desafio_id'];
    if (typeof challengeId !== 'string' || !CHALLENGE_RE.test(challengeId)) {
      throw new InvalidDtoError('login.desafio_id');
    }
    return { kind: 'mfa', challengeId };
  }
  return { kind: 'session', session: toSession(o, now) };
}
