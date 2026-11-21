// Base de datos del backend simulado. Guarda las filas como las tendría el servidor
// (todos los campos, en español) y las proyecta a DTO aplicando K20 en `toArchivoDto`,
// igual que lo haría el módulo de lectura de admin del backend.
// La generación es determinista (semilla fija) para que las pruebas sean reproducibles.

import {
  ApiKeyDto,
  ArchivoDto,
  AuditoriaDto,
  EstadoArchivoDto,
  EventoDto,
  MotivoDto,
  ResultadoAnalisisDto,
  RolDto,
} from '../api/backend.dto';
import { HOSTILE_FILENAMES, HOSTILE_REASONS } from './hostile-filenames';

export const MOCK_NOW = Date.parse('2026-11-17T12:00:00Z');
export const MOCK_FILE_COUNT = 250;
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const QUARANTINE_DAYS = 30;
const MAX_SIZE = 10 * 1024 * 1024; // tamano_bytes BETWEEN 1 AND 10485760
const VT_ENGINES = 70;

export interface MockApp {
  id: string;
  nombre: string;
}

/** Fila de `archivo` + sus `resultado_analisis`, como en el servidor. */
export interface ArchivoRow {
  id: string;
  aplicacion_id: string;
  nombre_original: string;
  tipo_detectado: string | null;
  tamano_bytes: number;
  sha256: string;
  estado: EstadoArchivoDto;
  creado_en: string;
  analizado_en: string | null;
  cuarentena_expira_en: string | null;
  resultados: ResultadoAnalisisDto[];
}

export interface MockUser {
  id: string;
  correo: string;
  rol: RolDto;
}

/** Registro(s) mock que representan cada vector de la matriz de 15. */
export interface VectorCase {
  vector: number;
  title: string;
  fileIds: string[];
  eventIds: string[];
  /** Vectores que nunca llegan a la API (no dejan fila): respuesta simulada del borde. */
  edge?: { status: number; note: string };
}

export interface MockDb {
  apps: MockApp[];
  /** Aplicación fuera del ámbito de la sesión: sus archivos existen pero responden 404. */
  foreignApp: MockApp;
  files: ArchivoRow[];
  foreignFiles: ArchivoRow[];
  audit: AuditoriaDto[];
  events: EventoDto[];
  apiKeys: ApiKeyDto[];
  users: MockUser[];
  vectors: VectorCase[];
}

// ---------------------------------------------------------------------------
// K20: proyección servidor -> DTO
// ---------------------------------------------------------------------------

export function hasMalware(row: ArchivoRow): boolean {
  return row.resultados.some((r) => r.veredicto === 'malicioso');
}

/** K20: detalle completo solo de archivos en cuarentena o con malware detectado. */
export function isDisclosedRow(row: ArchivoRow): boolean {
  return row.estado === 'en_cuarentena' || hasMalware(row);
}

export function toArchivoDto(row: ArchivoRow, appName: string): ArchivoDto {
  const minimal: ArchivoDto = {
    id: row.id,
    aplicacion_id: row.aplicacion_id,
    aplicacion_nombre: appName,
    estado: row.estado,
    tipo_detectado: row.tipo_detectado,
    tamano_bytes: row.tamano_bytes,
    creado_en: row.creado_en,
    analizado_en: row.analizado_en,
  };
  if (!isDisclosedRow(row)) return minimal;
  return {
    ...minimal,
    nombre_original: row.nombre_original,
    sha256: row.sha256,
    cuarentena_expira_en: row.cuarentena_expira_en,
    resultados: row.resultados.map((r) => ({ ...r, detalle: { ...r.detalle } })),
  };
}

// ---------------------------------------------------------------------------
// Generador
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Gen {
  constructor(private readonly rng: () => number) {}

  int(min: number, max: number): number {
    return min + Math.floor(this.rng() * (max - min + 1));
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)];
  }

  hex(length: number): string {
    let out = '';
    for (let i = 0; i < length; i++) out += this.int(0, 15).toString(16);
    return out;
  }

  uuid(): string {
    const variant = this.pick(['8', '9', 'a', 'b']);
    return `${this.hex(8)}-${this.hex(4)}-4${this.hex(3)}-${variant}${this.hex(3)}-${this.hex(12)}`;
  }

  /** Instante entre `minMinutes` y `maxMinutes` antes de MOCK_NOW. */
  ago(minMinutes: number, maxMinutes: number): number {
    return MOCK_NOW - this.int(minMinutes, maxMinutes) * MINUTE;
  }
}

const iso = (ms: number) => new Date(ms).toISOString();

const TYPE_BY_EXT: Readonly<Record<string, string>> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
};

const NAMES_BY_APP: readonly (readonly string[])[] = [
  [
    'tarea_matematicas.pdf',
    'boleta_3B.pdf',
    'foto_credencial.jpg',
    'constancia_estudios.pdf',
    'dibujo_clase.png',
  ],
  [
    'factura_A-1029.pdf',
    'comprobante_spei.png',
    'recibo_luz.pdf',
    'estado_cuenta_oct.pdf',
    'ticket_compra.jpg',
  ],
  [
    'cv_ana_lopez.pdf',
    'carta_recomendacion.pdf',
    'foto_perfil.png',
    'acta_nacimiento.pdf',
    'ine_frente.jpg',
  ],
];

const MALWARE_SIGNATURES = [
  'Win.Trojan.Agent-1234567',
  'Pdf.Exploit.CVE_2018_4993-1',
  'Js.Downloader.Agent-6789',
  'Doc.Dropper.Emotet-9876',
  'Html.Phishing.Bank-4321',
] as const;

const CDR_REJECTIONS: readonly { ext: string; motivo: MotivoDto }[] = [
  { ext: 'png', motivo: 'pixeles' },
  { ext: 'jpg', motivo: 'escaneos' },
  { ext: 'jpg', motivo: 'imagen_invalida' },
  { ext: 'pdf', motivo: 'pdf_cifrado' },
  { ext: 'pdf', motivo: 'paginas' },
  { ext: 'pdf', motivo: 'descompresion' },
  { ext: 'pdf', motivo: 'salida_grande' },
  { ext: 'pdf', motivo: 'flujo_invalido' },
  { ext: 'pdf', motivo: 'pdf_invalido' },
];

const NOT_ALLOWED_TYPES = [
  'image/svg+xml',
  'application/zip',
  'application/x-dosexec',
  'text/html',
  'text/x-shellscript',
  'image/gif',
] as const;

const extOf = (name: string) => name.slice(name.lastIndexOf('.') + 1).toLowerCase();
const hasExt = (name: string) => Object.hasOwn(TYPE_BY_EXT, extOf(name));
const typeOfName = (name: string) =>
  hasExt(name) ? TYPE_BY_EXT[extOf(name)] : 'application/octet-stream';

// Resultados por capa con la forma real de api/app/analisis.py.
const firma = (tipo: string, ok: boolean, ms = 3): ResultadoAnalisisDto => ({
  capa: 'firma',
  veredicto: ok ? 'limpio' : 'rechazado',
  detalle: { tipo },
  duracion_ms: ms,
});
const cdr = (
  veredicto: ResultadoAnalisisDto['veredicto'],
  motivo: MotivoDto | 'ok' | null,
  ms: number | null,
): ResultadoAnalisisDto => ({
  capa: 'cdr',
  veredicto,
  detalle: motivo === null ? {} : { motivo },
  duracion_ms: ms,
});
const clamav = (signature: string | null, ms: number): ResultadoAnalisisDto => ({
  capa: 'clamav',
  veredicto: signature ? 'malicioso' : 'limpio',
  detalle: signature ? { firma: signature } : {},
  duracion_ms: ms,
});
const virustotal = (positives: number, ms: number): ResultadoAnalisisDto => ({
  capa: 'virustotal',
  veredicto: positives > 0 ? 'malicioso' : 'limpio',
  detalle: { positivos: positives, total: VT_ENGINES },
  duracion_ms: ms,
});

export function createMockDb(seed = 7730): MockDb {
  const g = new Gen(mulberry32(seed));
  const apps: MockApp[] = [
    { id: g.uuid(), nombre: 'Portal Escolar' },
    { id: g.uuid(), nombre: 'App Pagos PyME' },
    { id: g.uuid(), nombre: 'RH Reclutamiento' },
  ];
  const foreignApp: MockApp = { id: g.uuid(), nombre: 'Aplicación de otro cliente' };
  const users: MockUser[] = [
    { id: g.uuid(), correo: 'analista@gatekeeper.test', rol: 'analista' },
    { id: g.uuid(), correo: 'admin@gatekeeper.test', rol: 'admin' },
  ];

  const files: ArchivoRow[] = [];
  const vectors = new Map<number, VectorCase>();
  const mark = (vector: number, title: string, row: ArchivoRow) => {
    const entry = vectors.get(vector) ?? { vector, title, fileIds: [], eventIds: [] };
    entry.fileIds.push(row.id);
    vectors.set(vector, entry);
  };

  const row = (
    appIndex: number,
    name: string,
    estado: EstadoArchivoDto,
    tipo: string | null,
    resultados: ResultadoAnalisisDto[],
    createdAt: number,
    appId?: string,
  ): ArchivoRow => {
    const created = createdAt;
    const analyzed = estado === 'pendiente' ? null : created + g.int(1, 20) * 1000;
    return {
      id: g.uuid(),
      aplicacion_id: appId ?? apps[appIndex].id,
      nombre_original: name,
      tipo_detectado: estado === 'pendiente' ? null : tipo,
      tamano_bytes: g.int(1024, MAX_SIZE),
      sha256: g.hex(64),
      estado,
      creado_en: iso(created),
      analizado_en: analyzed === null ? null : iso(analyzed),
      cuarentena_expira_en:
        estado === 'en_cuarentena' ? iso(created + QUARANTINE_DAYS * DAY) : null,
      resultados,
    };
  };

  const cleanFlow = (tipo: string) => [
    firma(tipo, true),
    clamav(null, g.int(40, 400)),
    virustotal(0, g.int(150, 900)),
    cdr('limpio', 'ok', g.int(80, 1500)),
  ];
  const malwareFlow = (tipo: string, signature: string | null, positives: number) => [
    firma(tipo, Object.values(TYPE_BY_EXT).includes(tipo)),
    clamav(signature, g.int(40, 400)),
    virustotal(positives, g.int(150, 900)),
    cdr('no_evaluada', null, null),
  ];

  // 1) Fixtures hostiles: cada nombre en dos archivos con detalle (K20), recientes para
  //    que se vean en la primera página. Uno en cuarentena y otro liberado o rechazado
  //    tras la liberación (sigue teniendo malware en su historial).
  HOSTILE_FILENAMES.forEach((name, i) => {
    const appIndex = i % apps.length;
    const tipo = typeOfName(name);
    const q = row(
      appIndex,
      name,
      'en_cuarentena',
      tipo,
      malwareFlow(tipo, g.pick(MALWARE_SIGNATURES), g.int(3, 40)),
      g.ago(5, 3 * 24 * 60),
    );
    files.push(q);

    // Solo un tipo de la lista blanca puede terminar limpio (CHECK limpio_en_lista_blanca).
    const released = hasExt(name) && i % 2 === 0;
    const second = row(
      (appIndex + 1) % apps.length,
      name,
      released ? 'limpio' : 'rechazado',
      tipo,
      released
        ? [...malwareFlow(tipo, null, g.int(1, 3)).slice(0, 3), cdr('limpio', 'ok', g.int(80, 900))]
        : [
            ...malwareFlow(tipo, g.pick(MALWARE_SIGNATURES), g.int(5, 30)).slice(0, 3),
            cdr('no_evaluada', 'tipo_no_permitido', null),
          ],
      g.ago(3 * 24 * 60, 7 * 24 * 60),
    );
    files.push(second);

    if (name.includes('..') || name.includes('\u0000')) mark(3, 'Nombre con ../ o byte nulo', q);
    if (name.includes('<') || name.includes('{{')) mark(12, 'Nombre de archivo con HTML/JS', q);
  });

  // 2) Un registro por vector de la matriz (los que dejan fila en la API).
  const policy = (
    vector: number,
    title: string,
    appIndex: number,
    name: string,
    tipo: string,
    resultados: ResultadoAnalisisDto[],
    estado: EstadoArchivoDto = 'rechazado',
  ) => {
    const r = row(appIndex, name, estado, tipo, resultados, g.ago(60, 10 * 24 * 60));
    files.push(r);
    mark(vector, title, r);
  };
  policy(1, 'Script con extensión de imagen', 0, 'avatar.jpg', 'text/x-shellscript', [
    firma('text/x-shellscript', false),
    cdr('no_evaluada', 'tipo_no_permitido', null),
  ]);
  policy(2, 'Doble extensión', 1, 'nomina_octubre.pdf.exe', 'application/x-dosexec', [
    firma('application/x-dosexec', false),
    cdr('no_evaluada', 'tipo_no_permitido', null),
  ]);
  policy(
    4,
    'Imagen polyglot',
    2,
    'foto_perfil_polyglot.jpg',
    'image/jpeg',
    cleanFlow('image/jpeg'),
    'limpio',
  );
  policy(
    5,
    'PDF con JavaScript',
    0,
    'tarea_con_js.pdf',
    'application/pdf',
    cleanFlow('application/pdf'),
    'limpio',
  );
  policy(6, 'PDF cifrado', 1, 'estado_cuenta_protegido.pdf', 'application/pdf', [
    firma('application/pdf', true),
    cdr('rechazado', 'pdf_cifrado', 12),
  ]);
  policy(7, 'SVG', 2, 'logo.svg', 'image/svg+xml', [
    firma('image/svg+xml', false),
    cdr('no_evaluada', 'tipo_no_permitido', null),
  ]);
  policy(8, 'ZIP', 0, 'tareas.zip', 'application/zip', [
    firma('application/zip', false),
    cdr('no_evaluada', 'tipo_no_permitido', null),
  ]);
  policy(9, 'Bomba de píxeles', 2, 'foto_gigante.png', 'image/png', [
    firma('image/png', true),
    cdr('rechazado', 'pixeles', 4),
  ]);
  policy(
    11,
    'Archivo de prueba EICAR',
    1,
    'eicar.com.txt',
    'text/plain',
    [
      firma('text/plain', false),
      clamav('Eicar-Test-Signature', 35),
      virustotal(62, 420),
      cdr('no_evaluada', null, null),
    ],
    'en_cuarentena',
  );
  for (let i = 0; i < 3; i++) {
    policy(
      15,
      'Descarga de archivo en estado pendiente',
      i,
      g.pick(NAMES_BY_APP[i]),
      'image/jpeg',
      [],
      'pendiente',
    );
  }

  // 3) Relleno aleatorio hasta MOCK_FILE_COUNT.
  while (files.length < MOCK_FILE_COUNT) {
    const appIndex = g.int(0, apps.length - 1);
    const created = g.ago(1, 30 * 24 * 60);
    const roll = g.int(1, 100);
    let name = g.pick(NAMES_BY_APP[appIndex]);
    let tipo = typeOfName(name);
    if (roll <= 62) {
      files.push(row(appIndex, name, 'limpio', tipo, cleanFlow(tipo), created));
    } else if (roll <= 72) {
      const bad = g.pick(NOT_ALLOWED_TYPES);
      files.push(
        row(
          appIndex,
          name,
          'rechazado',
          bad,
          [firma(bad, false), cdr('no_evaluada', 'tipo_no_permitido', null)],
          created,
        ),
      );
    } else if (roll <= 80) {
      const rejection = g.pick(CDR_REJECTIONS);
      name = `${name.slice(0, name.lastIndexOf('.'))}.${rejection.ext}`;
      tipo = typeOfName(name);
      files.push(
        row(
          appIndex,
          name,
          'rechazado',
          tipo,
          [firma(tipo, true), cdr('rechazado', rejection.motivo, g.int(3, 900))],
          created,
        ),
      );
    } else if (roll <= 87) {
      files.push(row(appIndex, name, 'pendiente', tipo, [], g.ago(0, 30)));
    } else if (roll <= 92) {
      const motivo = g.pick(['timeout', 'interno'] as const);
      files.push(
        row(
          appIndex,
          name,
          'error',
          tipo,
          [firma(tipo, true), cdr('error', motivo, 30_000)],
          created,
        ),
      );
    } else {
      files.push(
        row(
          appIndex,
          name,
          'en_cuarentena',
          tipo,
          malwareFlow(tipo, g.pick(MALWARE_SIGNATURES), g.int(1, 50)),
          created,
        ),
      );
    }
  }

  // 4) IDOR (vector 13): archivos de una aplicación ajena a la sesión.
  const foreignFiles = [
    row(
      0,
      'nomina_confidencial.pdf',
      'en_cuarentena',
      'application/pdf',
      malwareFlow('application/pdf', 'Pdf.Exploit.CVE_2018_4993-1', 12),
      g.ago(60, 600),
      foreignApp.id,
    ),
    row(
      0,
      'contrato.pdf',
      'limpio',
      'application/pdf',
      cleanFlow('application/pdf'),
      g.ago(60, 600),
      foreignApp.id,
    ),
  ];
  foreignFiles.forEach((f) => mark(13, 'Acceso a archivo de otra aplicación (IDOR)', f));

  // 5) Eventos de seguridad (M11 los consumirá por SSE). Nombre solo con malware (K20).
  const events: EventoDto[] = [];
  const appName = (id: string) => apps.find((a) => a.id === id)?.nombre ?? null;
  files
    .filter((f) => f.estado === 'en_cuarentena')
    .slice(0, 14)
    .forEach((f) =>
      events.push({
        id: g.uuid(),
        severidad: 'critica',
        tipo: 'malware_detectado',
        archivo_id: f.id,
        aplicacion_nombre: appName(f.aplicacion_id),
        nombre_archivo: f.nombre_original,
        en: f.analizado_en ?? f.creado_en,
      }),
    );
  files
    .filter((f) => f.estado === 'rechazado' && !hasMalware(f))
    .slice(0, 4)
    .forEach((f) =>
      events.push({
        id: g.uuid(),
        severidad: 'media',
        tipo: 'rechazo_politica',
        archivo_id: f.id,
        aplicacion_nombre: appName(f.aplicacion_id),
        en: f.analizado_en ?? f.creado_en,
      }),
    );
  const rateLimited: EventoDto = {
    id: g.uuid(),
    severidad: 'alta',
    tipo: 'limite_tasa',
    archivo_id: null,
    aplicacion_nombre: apps[1].nombre,
    en: iso(g.ago(10, 120)),
  };
  events.push(rateLimited);
  vectors.set(14, {
    vector: 14,
    title: '200 subidas en un minuto',
    fileIds: [],
    eventIds: [rateLimited.id],
  });
  events.push({
    id: g.uuid(),
    severidad: 'alta',
    tipo: 'inicio_fallido',
    archivo_id: null,
    aplicacion_nombre: null,
    en: iso(g.ago(30, 300)),
  });
  vectors.set(10, {
    vector: 10,
    title: 'Archivo de 500 MB',
    fileIds: [],
    eventIds: [],
    edge: {
      status: 413,
      note: 'Nginx corta la petición antes de la API (413): no deja fila ni evento en la base.',
    },
  });

  // 6) Bitácora de auditoría: 40 entradas. Las liberaciones apuntan a archivos liberados.
  const admin = users[1];
  const analyst = users[0];
  const releasedFiles = files.filter((f) => f.estado !== 'en_cuarentena' && hasMalware(f));
  const audit: AuditoriaDto[] = [];
  const ips = ['10.0.4.21', '10.0.4.37', '192.168.10.8', '2001:db8::17'];
  for (let i = 0; i < 40; i++) {
    const kind = i % 8;
    const at = iso(g.ago(i * 60 + 1, i * 60 + 59));
    const base = { id: g.uuid(), ip: g.pick(ips), en: at };
    if (kind === 0 || kind === 4) {
      const target = releasedFiles[i % releasedFiles.length];
      audit.push({
        ...base,
        actor: { ...admin },
        accion: 'liberar_archivo',
        recurso: target.id,
        motivo:
          kind === 0
            ? HOSTILE_REASONS[(i / 8) % HOSTILE_REASONS.length]
            : 'Falso positivo confirmado con el proveedor del archivo',
      });
    } else if (kind === 1 || kind === 5) {
      audit.push({
        ...base,
        actor: { ...(kind === 1 ? analyst : admin) },
        accion: 'inicio_sesion',
        recurso: null,
        motivo: null,
      });
    } else if (kind === 2) {
      audit.push({
        ...base,
        actor: { ...analyst },
        accion: 'cierre_sesion',
        recurso: null,
        motivo: null,
      });
    } else if (kind === 3) {
      audit.push({
        ...base,
        actor: { ...analyst },
        accion: 'inicio_fallido',
        recurso: null,
        motivo: null,
      });
    } else if (kind === 6) {
      audit.push({
        ...base,
        actor: { ...admin },
        accion: 'crear_api_key',
        recurso: apps[i % apps.length].id,
        motivo: null,
      });
    } else {
      audit.push({
        ...base,
        actor: { ...admin },
        accion: 'revocar_api_key',
        recurso: apps[i % apps.length].id,
        motivo: null,
      });
    }
  }

  // 7) API keys: dos por aplicación, una revocada.
  const apiKeys: ApiKeyDto[] = apps.flatMap((app, i) =>
    [0, 1].map((k) => ({
      id: g.uuid(),
      aplicacion_id: app.id,
      aplicacion_nombre: app.nombre,
      prefijo: `gk_${g.hex(12)}`,
      creada_en: iso(g.ago(20 * 24 * 60, 90 * 24 * 60)),
      ultimo_uso_en: iso(g.ago(1, 3 * 24 * 60)),
      revocada_en: i === 2 && k === 1 ? iso(g.ago(24 * 60, 5 * 24 * 60)) : null,
    })),
  );

  return {
    apps,
    foreignApp,
    files,
    foreignFiles,
    audit,
    events,
    apiKeys,
    users,
    vectors: [...vectors.values()].sort((a, b) => a.vector - b.vector),
  };
}
