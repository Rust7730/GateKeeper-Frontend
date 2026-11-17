// Backend simulado. Solo se registra con `environment.useMocks` (ver provide-api.ts).
// Responde las rutas de la API con DTO del backend (en español), así el adaptador de
// core/api se ejercita siempre. Latencia aleatoria, paginación, filtros y errores.

import {
  HttpErrorResponse,
  HttpEvent,
  HttpHeaders,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, mergeMap, throwError, timer, map } from 'rxjs';

import { API_BASE_URL } from '../api/api-config';
import {
  ApiKeyCreadaDto,
  ApiKeyDto,
  ArchivoDto,
  AuditoriaDto,
  EstadoArchivoDto,
  MetricasDto,
  PaginaDto,
  PeriodoDto,
} from '../api/backend.dto';
import { MOCK_BACKEND_STATE, MockBackendState } from '../mocks/mock-backend-state';
import { ArchivoRow, MOCK_NOW, MockDb, isDisclosedRow, toArchivoDto } from '../mocks/mock-db';

interface MockReply {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

const PHRASES: Readonly<Record<number, string>> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Content Too Large',
  423: 'Locked',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

const RETRY_AFTER_S = '30';
const MAX_PAGE_SIZE = 100;
const RELEASE_MIN = 20;
const ESTADOS: ReadonlySet<string> = new Set<EstadoArchivoDto>([
  'pendiente',
  'limpio',
  'en_cuarentena',
  'rechazado',
  'error',
]);
const PERIOD_DAYS: Readonly<Record<PeriodoDto, number>> = { '24h': 1, '7d': 7, '30d': 30 };
const WHITELIST: ReadonlySet<string> = new Set(['image/jpeg', 'image/png', 'application/pdf']);

const ok = (body: unknown, status = 200): MockReply => ({ status, body });

/** Error con la frase HTTP estándar, como el backend (K29). 404 es idéntico exista o no. */
function fail(status: number): MockReply {
  const headers: Record<string, string> = status === 429 ? { 'Retry-After': RETRY_AFTER_S } : {};
  return { status, body: { detail: PHRASES[status] ?? 'Error' }, headers };
}

/** Latencia aleatoria uniforme entre min y max (ms). */
export function randomLatency(range: { min: number; max: number }, rng = Math.random): number {
  const span = Math.max(0, range.max - range.min);
  return range.min + Math.floor(rng() * (span + 1));
}

/** Ruta relativa a la raíz de la API, o `null` si la petición no va a la API. */
export function relativePath(url: string, base: string): string | null {
  const root = base.replace(/\/+$/, '');
  if (url !== root && !url.startsWith(`${root}/`)) return null;
  const path = url.slice(root.length).split('?')[0];
  return path === '' ? '/' : path;
}

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const path = relativePath(req.url, inject(API_BASE_URL));
  if (path === null) return next(req);
  const state = inject(MOCK_BACKEND_STATE);
  const reply = route(state, req, path);
  return respond(req, reply, randomLatency(state.latency));
};

function respond(
  req: HttpRequest<unknown>,
  reply: MockReply,
  delayMs: number,
): Observable<HttpEvent<unknown>> {
  const headers = new HttpHeaders(reply.headers ?? {});
  const statusText = PHRASES[reply.status] ?? '';
  if (reply.status >= 400) {
    return timer(delayMs).pipe(
      mergeMap(() =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: reply.status,
              statusText,
              error: reply.body,
              headers,
              url: req.url,
            }),
        ),
      ),
    );
  }
  return timer(delayMs).pipe(
    map(
      () =>
        new HttpResponse({
          status: reply.status,
          statusText,
          body: reply.body,
          headers,
          url: req.url,
        }),
    ),
  );
}

function segmentsOf(path: string): string[] | null {
  try {
    return path
      .split('/')
      .filter((s) => s !== '')
      .map((s) => decodeURIComponent(s));
  } catch {
    return null;
  }
}

function route(state: MockBackendState, req: HttpRequest<unknown>, path: string): MockReply {
  const forced = state.takeForcedError(path);
  if (forced) return fail(forced.status);

  const seg = segmentsOf(path);
  if (seg === null || seg[0] !== 'admin') return fail(404);
  if (state.sessionExpired) return fail(401);

  const isAdmin = state.role === 'admin';
  const db = state.db;
  const [, resource, id, action] = seg;
  const method = req.method;

  if (resource === 'files') {
    if (method === 'GET' && seg.length === 2) return listFiles(db, req);
    if (method === 'GET' && seg.length === 3) {
      const row = findOwnFile(db, id);
      return row ? ok(dto(db, row)) : fail(404);
    }
    if (method === 'POST' && seg.length === 4 && action === 'release') {
      if (!isAdmin) return fail(403);
      return release(db, id, req.body);
    }
  }
  if (resource === 'metrics' && method === 'GET' && seg.length === 2) return metrics(db, req);
  if (resource === 'audit' && method === 'GET' && seg.length === 2) {
    return isAdmin ? listAudit(db, req) : fail(403);
  }
  if (resource === 'api-keys') {
    if (!isAdmin) return fail(403);
    if (method === 'GET' && seg.length === 2)
      return ok(page(db.apiKeys, 1, db.apiKeys.length || 1));
    if (method === 'POST' && seg.length === 2) return createKey(db, req.body);
    if (method === 'DELETE' && seg.length === 3) return revokeKey(db, id);
  }
  return fail(404);
}

// ---------------------------------------------------------------------------
// Archivos
// ---------------------------------------------------------------------------

const appNameOf = (db: MockDb, appId: string) => db.apps.find((a) => a.id === appId)?.nombre ?? '';
const dto = (db: MockDb, row: ArchivoRow): ArchivoDto =>
  toArchivoDto(row, appNameOf(db, row.aplicacion_id));

/**
 * Solo archivos de las aplicaciones de la sesión. Uno de otra aplicación (IDOR, vector
 * 13) da `undefined` y responde 404, igual que uno inexistente.
 */
function findOwnFile(db: MockDb, id: string | undefined): ArchivoRow | undefined {
  return id === undefined ? undefined : db.files.find((f) => f.id === id.toLowerCase());
}

function page<T>(items: readonly T[], pagina: number, tamano: number): PaginaDto<T> {
  const start = (pagina - 1) * tamano;
  return {
    elementos: items.slice(start, start + tamano),
    pagina,
    tamano_pagina: tamano,
    total: items.length,
  };
}

function intParam(value: string | null, fallback: number, max: number): number | null {
  if (value === null) return fallback;
  if (!/^\d{1,6}$/.test(value)) return null;
  const n = Number(value);
  return n >= 1 && n <= max ? n : null;
}

function listFiles(db: MockDb, req: HttpRequest<unknown>): MockReply {
  const p = req.params;
  const pagina = intParam(p.get('pagina'), 1, 100_000);
  const tamano = intParam(p.get('tamano_pagina'), 25, MAX_PAGE_SIZE);
  if (pagina === null || tamano === null) return fail(400);

  const estados = (p.getAll('estado') ?? []).flatMap((e) => e.split(','));
  if (estados.some((e) => !ESTADOS.has(e))) return fail(400);
  const appId = p.get('aplicacion_id');
  const from = p.get('desde') ? Date.parse(p.get('desde') ?? '') : null;
  const to = p.get('hasta') ? Date.parse(p.get('hasta') ?? '') : null;
  if ((from !== null && Number.isNaN(from)) || (to !== null && Number.isNaN(to))) return fail(400);
  const q = (p.get('q') ?? '').trim().toLowerCase();

  let rows = db.files.filter((f) => {
    if (estados.length && !estados.includes(f.estado)) return false;
    if (appId && f.aplicacion_id !== appId) return false;
    const created = Date.parse(f.creado_en);
    if (from !== null && created < from) return false;
    if (to !== null && created > to) return false;
    if (q) {
      // K20: por nombre o hash solo se busca entre archivos con detalle; si no, la
      // búsqueda revelaría que existe un nombre en un archivo restringido.
      const byId = f.id.startsWith(q);
      const byDetail =
        isDisclosedRow(f) &&
        (f.nombre_original.toLowerCase().includes(q) || f.sha256.startsWith(q));
      if (!byId && !byDetail) return false;
    }
    return true;
  });

  const orden = p.get('orden') ?? 'creado_en';
  const dir = p.get('dir') === 'asc' ? 1 : -1;
  if (!['creado_en', 'tamano_bytes', 'estado'].includes(orden)) return fail(400);
  rows = [...rows].sort((a, b) => {
    const key = orden as 'creado_en' | 'tamano_bytes' | 'estado';
    const av = a[key];
    const bv = b[key];
    return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
  });

  return ok(
    page(
      rows.map((r) => dto(db, r)),
      pagina,
      tamano,
    ),
  );
}

function release(db: MockDb, id: string | undefined, body: unknown): MockReply {
  const row = findOwnFile(db, id);
  if (!row) return fail(404);
  const motivo =
    typeof body === 'object' && body !== null && 'motivo' in body
      ? (body as { motivo: unknown }).motivo
      : null;
  if (typeof motivo !== 'string' || motivo.trim().length < RELEASE_MIN) return fail(400);
  if (row.estado !== 'en_cuarentena') return fail(409);

  // Tras liberar, el archivo pasa por el CDR: solo un tipo de la lista blanca queda limpio.
  const allowed = row.tipo_detectado !== null && WHITELIST.has(row.tipo_detectado);
  row.estado = allowed ? 'limpio' : 'rechazado';
  row.cuarentena_expira_en = null;
  row.analizado_en = new Date().toISOString();
  row.resultados = [
    ...row.resultados.filter((r) => r.capa !== 'cdr'),
    allowed
      ? { capa: 'cdr', veredicto: 'limpio', detalle: { motivo: 'ok' }, duracion_ms: 240 }
      : {
          capa: 'cdr',
          veredicto: 'no_evaluada',
          detalle: { motivo: 'tipo_no_permitido' },
          duracion_ms: null,
        },
  ];
  db.audit.unshift(auditEntry(db, 'liberar_archivo', row.id, motivo));
  return ok(dto(db, row));
}

// ---------------------------------------------------------------------------
// Métricas
// ---------------------------------------------------------------------------

function decisive(row: ArchivoRow) {
  for (const v of ['malicioso', 'rechazado', 'error'] as const) {
    const hit = row.resultados.find((r) => r.veredicto === v);
    if (hit) return hit;
  }
  return null;
}

function metrics(db: MockDb, req: HttpRequest<unknown>): MockReply {
  const raw = req.params.get('periodo') ?? '7d';
  if (!Object.hasOwn(PERIOD_DAYS, raw)) return fail(400);
  const periodo = raw as PeriodoDto;
  const days = PERIOD_DAYS[periodo];
  const since = MOCK_NOW - days * 86_400_000;
  const rows = db.files.filter((f) => Date.parse(f.creado_en) >= since);

  const totales: MetricasDto['totales'] = {
    pendiente: 0,
    limpio: 0,
    en_cuarentena: 0,
    rechazado: 0,
    error: 0,
    procesados: 0,
  };
  const byDay = new Map<string, { bloqueados: number; en_cuarentena: number }>();
  const byLayer = new Map<string, MetricasDto['por_capa'][number]>();
  const byApp = new Map<string, number>();

  for (const f of rows) {
    totales[f.estado]++;
    if (f.estado !== 'pendiente') totales.procesados++;
    const blocked = f.estado === 'rechazado' || f.estado === 'en_cuarentena';
    if (!blocked) continue;
    const date = f.creado_en.slice(0, 10);
    const day = byDay.get(date) ?? { bloqueados: 0, en_cuarentena: 0 };
    if (f.estado === 'rechazado') day.bloqueados++;
    else day.en_cuarentena++;
    byDay.set(date, day);
    byApp.set(f.aplicacion_id, (byApp.get(f.aplicacion_id) ?? 0) + 1);
    const hit = decisive(f);
    if (hit) {
      const motivo = hit.veredicto === 'malicioso' ? null : (hit.detalle.motivo ?? null);
      const key = `${hit.capa}|${motivo ?? ''}`;
      const entry = byLayer.get(key) ?? {
        capa: hit.capa,
        motivo: motivo === 'ok' ? null : motivo,
        total: 0,
      };
      entry.total++;
      byLayer.set(key, entry);
    }
  }

  const body: MetricasDto = {
    periodo,
    totales,
    amenazas_por_dia: [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, v]) => ({ fecha, ...v })),
    por_capa: [...byLayer.values()].sort((a, b) => b.total - a.total),
    top_apps: [...byApp.entries()]
      .map(([aplicacion_id, bloqueados]) => ({
        aplicacion_id,
        aplicacion_nombre: appNameOf(db, aplicacion_id),
        bloqueados,
      }))
      .sort((a, b) => b.bloqueados - a.bloqueados),
  };
  return ok(body);
}

// ---------------------------------------------------------------------------
// Auditoría y API keys
// ---------------------------------------------------------------------------

const ACCIONES: ReadonlySet<string> = new Set([
  'inicio_sesion',
  'cierre_sesion',
  'liberar_archivo',
  'crear_api_key',
  'revocar_api_key',
  'inicio_fallido',
]);

function listAudit(db: MockDb, req: HttpRequest<unknown>): MockReply {
  const pagina = intParam(req.params.get('pagina'), 1, 100_000);
  const tamano = intParam(req.params.get('tamano_pagina'), 25, MAX_PAGE_SIZE);
  const accion = req.params.get('accion');
  if (pagina === null || tamano === null || (accion !== null && !ACCIONES.has(accion)))
    return fail(400);
  const rows = db.audit
    .filter((a) => accion === null || a.accion === accion)
    .sort((a, b) => b.en.localeCompare(a.en));
  return ok(page(rows, pagina, tamano));
}

function mockId(): string {
  const hex = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`;
}

function auditEntry(
  db: MockDb,
  accion: AuditoriaDto['accion'],
  recurso: string,
  motivo: string | null,
): AuditoriaDto {
  const admin = db.users.find((u) => u.rol === 'admin') ?? db.users[0];
  return {
    id: mockId(),
    actor: { id: admin.id, correo: admin.correo, rol: admin.rol },
    accion,
    recurso,
    motivo,
    ip: '10.0.4.21',
    en: new Date().toISOString(),
  };
}

function createKey(db: MockDb, body: unknown): MockReply {
  const appId =
    typeof body === 'object' && body !== null && 'aplicacion_id' in body
      ? (body as { aplicacion_id: unknown }).aplicacion_id
      : null;
  const app = db.apps.find((a) => a.id === appId);
  if (!app) return fail(404);
  const prefijo = `gk_${mockId().replace(/-/g, '').slice(0, 12)}`;
  const key: ApiKeyDto = {
    id: mockId(),
    aplicacion_id: app.id,
    aplicacion_nombre: app.nombre,
    prefijo,
    creada_en: new Date().toISOString(),
    ultimo_uso_en: null,
    revocada_en: null,
  };
  db.apiKeys.push(key);
  db.audit.unshift(auditEntry(db, 'crear_api_key', app.id, null));
  const created: ApiKeyCreadaDto = { ...key, secreto: `${prefijo}.${mockId().replace(/-/g, '')}` };
  return ok(created, 201);
}

function revokeKey(db: MockDb, id: string | undefined): MockReply {
  const key = db.apiKeys.find((k) => k.id === id);
  if (!key) return fail(404);
  if (key.revocada_en !== null) return fail(409);
  key.revocada_en = new Date().toISOString();
  db.audit.unshift(auditEntry(db, 'revocar_api_key', key.aplicacion_id, null));
  return ok(null, 204);
}
