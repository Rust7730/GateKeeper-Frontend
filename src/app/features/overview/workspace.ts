import { NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';

import { environment } from '../../../environments/environment';
import { AdminFilesApi } from '../../core/api/admin-files.api';
import { ApiKeysApi } from '../../core/api/api-keys.api';
import { AuditApi } from '../../core/api/audit.api';
import { EventsApi } from '../../core/api/events.api';
import { MetricsApi } from '../../core/api/metrics.api';
import { AuthService } from '../../core/auth/auth.service';
import { ApiKey } from '../../core/models/api-key.model';
import { AuditEntry } from '../../core/models/audit.model';
import { FileRecord, FileStatus as ApiFileStatus, LayerResult } from '../../core/models/file.model';
import { Metrics } from '../../core/models/metrics.model';
import { SecurityEvent } from '../../core/models/security-event.model';
import { ConsolePage } from '../dashboard/console-page';
import { DocsPage } from '../dashboard/docs-page';
import { ThreatChart, type ThreatPoint } from './threat-chart';
import { WorkspacePreferences } from './workspace-preferences';
import { WorkspaceSettings } from './workspace-settings';
import {
  WORKSPACE_NAV,
  WORKSPACE_PAGES,
  type AuditEvent,
  type DemoKey,
  type FileStatus,
  type InspectedFile,
  type KeyActivity,
  type WorkspaceView,
} from './workspace-data';

interface FileDetailView extends InspectedFile {
  disclosure: 'restricted' | 'full';
  appName: string;
  sha256: string | null;
  quarantineExpiresAt: string | null;
  layers: readonly LayerResult[];
}

const STATUS_LABEL: Record<ApiFileStatus, FileStatus> = {
  clean: 'Limpio',
  quarantined: 'En cuarentena',
  rejected: 'Rechazado',
  pending: 'Pendiente',
  error: 'Error',
  unknown: 'Pendiente',
};

/** Opción del filtro de Estado -> valor que entiende `GET /v1/admin/files`. */
const STATUS_FILTER: ReadonlyMap<string, Exclude<ApiFileStatus, 'unknown'>> = new Map<
  string,
  Exclude<ApiFileStatus, 'unknown'>
>([
  ['Limpio', 'clean'],
  ['En cuarentena', 'quarantined'],
  ['Rechazado', 'rejected'],
  ['Error', 'error'],
  ['Pendiente', 'pending'],
]);

const AUDIT_ACTION_LABEL: Record<string, string> = {
  login: 'Inicio de sesión',
  logout: 'Cierre de sesión',
  release_file: 'Archivo liberado',
  create_api_key: 'Clave API creada',
  revoke_api_key: 'Clave API revocada',
  login_failed: 'Inicio fallido',
  unknown: 'Evento de sistema',
};

const EVENT_LABEL: Record<string, string> = {
  malware_detectado: 'Malware detectado',
  malware_detected: 'Malware detectado',
  policy_rejected: 'Rechazo de política',
  rate_limited: 'Límite de tasa alcanzado',
  file_released: 'Archivo liberado de cuarentena',
  login_failed: 'Intento de acceso fallido',
  unknown: 'Evento de seguridad',
};

const ADMIN_ONLY_PATHS = new Set<string>(['/app/auditoria', '/app/claves']);

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type Language = 'es' | 'en';
const LOCALE: Record<Language, string> = { es: 'es-MX', en: 'en-US' };

/** Fecha y hora en la zona local del navegador (la misma que usa la gráfica para agrupar). */
export function formatTime(iso: string | null, language: Language = 'es'): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(LOCALE[language], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Días que muestra la gráfica de amenazas. */
export const CHART_DAYS = 7;
/** Tope de páginas al leer los archivos bloqueados de la semana (100 por página). */
const THREAT_PAGES = 10;

/** `YYYY-MM-DD` del día en la zona local. */
function localDayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Medianoche local de hace `CHART_DAYS - 1` días: inicio de la ventana de la gráfica. */
export function chartWindowStart(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - (CHART_DAYS - 1));
}

export interface ThreatDay {
  readonly key: string;
  readonly date: Date;
  readonly quarantined: number;
  readonly rejected: number;
  readonly errors: number;
}

/**
 * Agrupa los archivos por día local de recepción: la misma zona horaria que la columna
 * «Hora» de la lista, así un archivo de las 23:45 cuenta en el día que se ve en la lista.
 * El último día es hoy (local); los días sin archivos quedan en cero.
 */
export function groupThreatDays(
  files: readonly { status: ApiFileStatus; createdAt: string | null }[],
  now = new Date(),
): ThreatDay[] {
  const start = chartWindowStart(now);
  const days = Array.from({ length: CHART_DAYS }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return { key: localDayKey(date), date, quarantined: 0, rejected: 0, errors: 0 };
  });
  const byKey = new Map(days.map((day) => [day.key, day]));
  for (const file of files) {
    if (!file.createdAt) continue;
    const day = byKey.get(localDayKey(new Date(file.createdAt)));
    if (!day) continue;
    if (file.status === 'quarantined') day.quarantined++;
    else if (file.status === 'rejected') day.rejected++;
    else if (file.status === 'error') day.errors++;
  }
  return days;
}

export function formatDayLabel(date: Date, language: Language): string {
  return date.toLocaleDateString(LOCALE[language], { weekday: 'short', day: '2-digit' });
}

const LAYER_LABEL: Record<string, string> = {
  signature: 'Firma de tipo',
  whitelist: 'Lista de tipos permitidos',
  cdr: 'Reconstrucción (CDR)',
  clamav: 'ClamAV',
  virustotal: 'VirusTotal',
  size_limit: 'Límite de tamaño',
  pixel_limit: 'Límite de píxeles',
  rate_limit: 'Límite de tasa',
  encrypted_pdf: 'PDF cifrado',
  unknown: 'Capa desconocida',
};

const OUTCOME_LABEL: Record<string, string> = {
  passed: 'Superada',
  failed: 'Bloqueó',
  skipped: 'Omitida',
  running: 'En curso',
  not_evaluated: 'No evaluada',
  unknown: 'Sin resultado',
};

const REASON_LABEL: Record<string, string> = {
  type_not_allowed: 'Tipo de archivo no permitido',
  pixel_limit: 'Supera el límite de píxeles',
  page_limit: 'Supera el límite de páginas',
  encrypted: 'Archivo cifrado',
  decompression_limit: 'Supera el límite de descompresión',
  output_too_large: 'La copia reconstruida es demasiado grande',
  scan_limit: 'Supera el límite de escaneos',
  invalid_stream: 'Flujo de datos inválido',
  invalid_image: 'Imagen inválida',
  invalid_pdf: 'PDF inválido',
  timeout: 'Tiempo de análisis agotado',
  internal: 'Error interno del analizador',
  unknown: 'Motivo desconocido',
};

function mapFile(record: FileRecord): FileDetailView {
  const isFull = record.disclosure === 'full';
  const name = isFull
    ? (record.originalName ?? `Archivo ${record.id.slice(0, 8)}`)
    : `Archivo ${record.id.slice(0, 8)} (K20)`;
  let reason = 'Metadatos restringidos por política de privacidad K20.';
  let reasonEn: string | undefined;
  if (isFull) {
    const mal = record.layers.find((l) => l.signature !== null || l.vtDetections !== null);
    if (mal?.signature) {
      reason = `ClamAV detectó la firma ${mal.signature}.`;
      reasonEn = `ClamAV detected the signature ${mal.signature}.`;
    } else if (mal?.vtDetections) {
      const { positives, total } = mal.vtDetections;
      reason = `VirusTotal reportó ${positives}/${total} motores maliciosos.`;
      reasonEn = `VirusTotal reported ${positives}/${total} engines as malicious.`;
    } else if (record.reason) {
      reason = REASON_LABEL[record.reason] ?? REASON_LABEL['unknown'];
    } else {
      reason = 'Inspección registrada con detalle completo.';
    }
  } else if (record.status === 'clean') {
    reason = 'Archivo reconstruido y verificado como limpio (detalle restringido por K20).';
  } else if (record.status === 'pending') {
    reason = 'El archivo está en análisis.';
  } else if (record.status === 'rejected') {
    reason = 'Archivo rechazado por política de validación (detalle restringido por K20).';
  }

  return {
    id: record.id,
    name,
    type: record.detectedType ?? 'desconocido',
    status: STATUS_LABEL[record.status],
    size: formatBytes(record.sizeBytes),
    time: record.createdAt ?? '',
    reason,
    reasonEn,
    disclosure: record.disclosure,
    appName: record.appName ?? '—',
    sha256: isFull ? record.sha256 : null,
    quarantineExpiresAt: isFull ? record.quarantineExpiresAt : null,
    layers: isFull ? record.layers : [],
  };
}

function mapAudit(entry: AuditEntry): AuditEvent {
  return {
    action: AUDIT_ACTION_LABEL[entry.action] ?? entry.action,
    resource: entry.resource ?? '—',
    actor: entry.actor.email || 'Sistema',
    time: entry.at ?? '',
    note: entry.reason ?? (entry.ip ? `IP: ${entry.ip}` : undefined),
  };
}

function mapKey(key: ApiKey): DemoKey {
  return {
    id: key.id,
    name: key.appName ?? key.appId.slice(0, 8),
    prefix: key.prefix ?? 'gk_',
    revoked: key.status === 'revoked',
    appId: key.appId,
    createdAt: key.createdAt,
    lastUsedAt: key.lastUsedAt,
  };
}

@Component({
  selector: 'gk-workspace',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet,
    ConsolePage,
    DocsPage,
    ThreatChart,
    WorkspaceSettings,
  ],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
  host: {
    '[attr.data-theme]': 'preferences.theme()',
    '[attr.data-motion]': 'preferences.reducedMotion() ? "reduce" : null',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class Workspace implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly auth = inject(AuthService);
  private readonly filesApi = inject(AdminFilesApi);
  private readonly metricsApi = inject(MetricsApi);
  private readonly auditApi = inject(AuditApi);
  private readonly keysApi = inject(ApiKeysApi);
  private readonly eventsApi = inject(EventsApi);
  private readonly params = toSignal(this.route.paramMap, { requireSync: true });

  readonly preferences = inject(WorkspacePreferences);
  readonly t = (text: string, english?: string) => this.preferences.text(text, english);

  readonly landingUrl = environment.landingUrl;
  readonly view = this.route.snapshot.data['view'] as WorkspaceView;
  readonly page = WORKSPACE_PAGES[this.view];

  // Sesión real
  readonly user = this.auth.user;
  readonly administrator = this.auth.isAdmin;
  readonly nav = computed(() =>
    WORKSPACE_NAV.filter((item) => this.administrator() || !ADMIN_ONLY_PATHS.has(item.path)),
  );

  // Estado de login / TOTP
  readonly authBusy = signal(false);
  readonly authError = signal('');
  readonly mfaChallengeId = signal<string | null>(null);

  // Datos reales del backend
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly files = signal<FileDetailView[]>([]);
  readonly selectedFile = signal<FileDetailView | null>(null);
  readonly metrics = signal<Metrics | null>(null);
  readonly audit = signal<AuditEvent[]>([]);
  readonly keys = signal<DemoKey[]>([]);
  readonly liveEvents = signal<SecurityEvent[]>([]);

  /** Archivos bloqueados o con error de los últimos `CHART_DAYS` días locales (gráfica). */
  readonly threatDays = signal<ThreatDay[] | null>(null);

  readonly series = computed<readonly ThreatPoint[]>(() => {
    const days = this.threatDays();
    if (!days) return [];
    const language = this.preferences.language();
    return days.map((d) => ({
      day: formatDayLabel(d.date, language),
      quarantined: d.quarantined,
      rejected: d.rejected,
      errors: d.errors,
    }));
  });

  /** Totales de la leyenda: salen de la misma serie que se dibuja. */
  readonly chartTotals = computed(() =>
    this.series().reduce(
      (sum, day) => ({
        quarantined: sum.quarantined + day.quarantined,
        rejected: sum.rejected + day.rejected,
        errors: sum.errors + day.errors,
      }),
      { quarantined: 0, rejected: 0, errors: 0 },
    ),
  );

  readonly totals = computed(() => {
    const m = this.metrics();
    return {
      totalFiles: m ? m.totals.processed + m.totals.pending : this.files().length,
      quarantined: m ? m.totals.quarantined : this.quarantine().length,
      alertsCount: m ? m.totals.quarantined + m.totals.rejected : this.alerts().length,
    };
  });

  readonly chartLabels = computed(() => ({
    quarantine: this.t('Cuarentena'),
    rejected: this.t('Rechazos'),
    errors: this.t('Errores de análisis', 'Scan errors'),
    total: this.t('Total'),
  }));

  /** Hora en el idioma actual; los textos fijos (datos de ejemplo) se traducen tal cual. */
  readonly when = (value: string | null): string =>
    value && !Number.isNaN(Date.parse(value))
      ? formatTime(value, this.preferences.language())
      : this.t(value || '—');

  /** El backend guarda la nota de una clave nueva como «Aplicación: nombre (prefijo)». */
  readonly auditNote = (note: string): string =>
    note.startsWith('Aplicación: ') ? `${this.t('Aplicación')}: ${note.slice(12)}` : note;

  readonly describeDay = (point: ThreatPoint): string =>
    `${point.day}: ${point.quarantined}${this.t(' en cuarentena y ', ' quarantined and ')}${point.rejected}${this.t(' rechazos', ' rejections')}${point.errors ? `${this.t(' y ', ' and ')}${point.errors}${this.t(' errores de análisis', ' scan errors')}` : ''}`;

  readonly statuses: readonly FileStatus[] = [
    'Limpio',
    'En cuarentena',
    'Rechazado',
    'Error',
    'Pendiente',
  ];

  readonly layerLabel = (layer: LayerResult): string =>
    this.t(LAYER_LABEL[layer.layer] ?? LAYER_LABEL['unknown']);
  readonly outcomeLabel = (layer: LayerResult): string =>
    this.t(OUTCOME_LABEL[layer.outcome] ?? OUTCOME_LABEL['unknown']);
  /** Detalle de una capa. Solo una capa superada se muestra como «OK». */
  readonly layerDetail = (layer: LayerResult): string => {
    if (layer.signature) return layer.signature;
    if (layer.vtDetections) {
      return `${layer.vtDetections.positives}/${layer.vtDetections.total} ${this.t('motores', 'engines')}`;
    }
    if (layer.reason) return this.t(REASON_LABEL[layer.reason] ?? REASON_LABEL['unknown']);
    if (layer.outcome === 'passed') return 'OK';
    if (layer.outcome === 'failed') return this.t('Sin detalle del motivo', 'No reason given');
    return '—';
  };

  readonly collapsed = signal(this.readCollapsed());
  readonly query = signal('');
  readonly status = signal('');
  readonly notice = signal('');
  readonly releaseTarget = signal('');
  readonly revokeTarget = signal<DemoKey | null>(null);

  // Panel lateral de una clave: resumen del cliente y su actividad.
  readonly selectedKey = signal<DemoKey | null>(null);
  readonly keyActivity = signal<KeyActivity | null>(null);
  readonly keyActivityError = signal(false);
  readonly prefixCopied = signal(false);
  // Panel lateral de una fila de archivos o de auditoría.
  readonly previewFile = signal<FileDetailView | null>(null);
  readonly previewAudit = signal<AuditEvent | null>(null);
  private activityRequest = 0;
  readonly secret = signal('');
  readonly copyStatus = signal('');

  readonly quarantine = computed(() =>
    this.files().filter((file) => file.status === 'En cuarentena'),
  );

  readonly alerts = computed(() => {
    const fromSse: InspectedFile[] = this.liveEvents().map((ev) => ({
      id: ev.fileId ?? ev.id,
      name: ev.fileName ?? ev.appName ?? EVENT_LABEL[ev.type] ?? 'Evento en vivo',
      type: ev.severity,
      status: ev.type === 'malware_detected' ? 'En cuarentena' : 'Rechazado',
      size: '—',
      time: ev.at ?? '',
      reason: EVENT_LABEL[ev.type] ?? 'Evento de seguridad',
    }));
    const fromFiles = this.files().filter(
      (file) => file.status === 'En cuarentena' || file.status === 'Rechazado',
    );
    return [...fromSse, ...fromFiles];
  });

  /** Lo filtra el backend (búsqueda y estado sobre todos los archivos, no solo la 1.ª página). */
  readonly visibleFiles = computed(() => this.files());
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private filesRequest = 0;

  setQuery(value: string): void {
    this.query.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.reloadFileSearch(), 300);
  }

  setStatusFilter(value: string): void {
    this.status.set(value);
    clearTimeout(this.searchTimer);
    this.reloadFileSearch();
  }

  private reloadFileSearch(): void {
    const status = STATUS_FILTER.get(this.status());
    this.loadFiles({ status: status ? [status] : undefined, q: this.query().trim() || undefined });
  }

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => clearTimeout(this.searchTimer));
    if (
      this.view === 'login' ||
      this.view === 'docs' ||
      this.view === 'explorer' ||
      this.view === 'missing'
    ) {
      return;
    }
    this.loadViewData();
  }

  submitLogin(email: string, password: string): void {
    if (!email.trim() || !password || this.authBusy()) return;
    this.authBusy.set(true);
    this.authError.set('');
    this.auth
      .login(email, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.authBusy.set(false);
          if (result.kind === 'mfa') {
            this.mfaChallengeId.set(result.challengeId);
          } else {
            void this.router.navigateByUrl('/app');
          }
        },
        error: (err: unknown) => {
          this.authBusy.set(false);
          this.authError.set(this.describeAuthError(err));
        },
      });
  }

  submitTotp(code: string): void {
    const challengeId = this.mfaChallengeId();
    if (!challengeId || code.trim().length !== 6 || this.authBusy()) return;
    this.authBusy.set(true);
    this.authError.set('');
    this.auth
      .verifyTotp(challengeId, code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.authBusy.set(false);
          this.mfaChallengeId.set(null);
          void this.router.navigateByUrl('/app');
        },
        error: (err: unknown) => {
          this.authBusy.set(false);
          this.authError.set(this.describeAuthError(err, true));
        },
      });
  }

  cancelMfa(): void {
    this.mfaChallengeId.set(null);
    this.authError.set('');
  }

  logout(): void {
    this.auth.logout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  releaseFile(reason: string): void {
    const id = this.releaseTarget();
    const trimmed = reason.trim();
    if (!this.administrator() || trimmed.length < 20 || !id) {
      this.notice.set('El motivo debe tener al menos 20 caracteres.');
      return;
    }

    this.filesApi
      .release(id, trimmed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeDrawer();
          this.notice.set('Archivo reencolado en el CDR para reconstrucción y liberación.');
          this.loadFiles({ status: ['quarantined'] });
        },
        error: (err: unknown) => {
          this.notice.set(this.describeApiError(err, 'No se pudo liberar el archivo.'));
        },
      });
  }

  createKey(name: string): void {
    if (!this.administrator() || !name.trim() || this.secret()) return;
    this.keysApi
      .createByName(name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.secret.set(created.secret);
          this.keys.update((items) => [mapKey(created), ...items]);
          this.notice.set('Clave API creada correctamente.');
        },
        error: (err: unknown) => {
          this.notice.set(this.describeApiError(err, 'No se pudo crear la clave API.'));
        },
      });
  }

  revokeKey(): void {
    const target = this.revokeTarget();
    if (!this.administrator() || !target || target.revoked) return;
    this.keysApi
      .revoke(target.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.keys.update((keys) =>
            keys.map((key) => (key.id === target.id ? { ...key, revoked: true } : key)),
          );
          if (this.selectedKey()?.id === target.id) {
            this.selectedKey.update((key) => (key ? { ...key, revoked: true } : key));
          }
          this.notice.set('Clave API revocada de inmediato.');
        },
        error: (err: unknown) => {
          this.notice.set(this.describeApiError(err, 'No se pudo revocar la clave API.'));
        },
      });
  }

  openKey(key: DemoKey): void {
    if (this.selectedKey()?.id === key.id) {
      this.closeKey();
      return;
    }
    this.closeDrawer();
    this.selectedKey.set(key);
    this.prefixCopied.set(false);
    this.loadKeyActivity(key);
    this.focusDrawer();
  }

  openFile(file: FileDetailView): void {
    if (this.previewFile()?.id === file.id) {
      this.closeDrawer();
      return;
    }
    this.closeDrawer();
    this.previewFile.set(file);
    this.focusDrawer();
  }

  openAudit(event: AuditEvent): void {
    if (this.previewAudit() === event) {
      this.closeDrawer();
      return;
    }
    this.closeDrawer();
    this.previewAudit.set(event);
    this.focusDrawer();
  }

  /** Escape cierra el panel lateral, salvo que haya un diálogo abierto encima. */
  onEscape(): void {
    if (document.querySelector('dialog[open]')) return;
    if (this.selectedKey() || this.previewFile() || this.previewAudit()) this.closeDrawer();
  }

  closeKey(): void {
    this.closeDrawer();
  }

  /** Cierra cualquier panel lateral abierto (solo hay uno a la vez). */
  closeDrawer(): void {
    this.selectedKey.set(null);
    this.previewFile.set(null);
    this.previewAudit.set(null);
    this.activityRequest++;
  }

  /** El foco va al título del panel para que el lector de pantalla anuncie el resumen. */
  private focusDrawer(): void {
    afterNextRender(() => document.getElementById('drawer-title')?.focus({ preventScroll: true }), {
      injector: this.injector,
    });
  }

  async copyPrefix(prefix: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(prefix);
      this.prefixCopied.set(true);
    } catch {
      this.prefixCopied.set(false);
    }
  }

  /** Archivos recibidos y bloqueados de la aplicación (solo totales: piden 1 elemento). */
  private loadKeyActivity(key: DemoKey): void {
    const request = ++this.activityRequest;
    this.keyActivity.set(null);
    this.keyActivityError.set(false);
    if (!key.appId) {
      this.keyActivityError.set(true);
      return;
    }
    const base = { page: 1, pageSize: 1, appId: key.appId } as const;
    forkJoin({
      all: this.filesApi.list({ ...base, sort: 'createdAt', dir: 'desc' }),
      blocked: this.filesApi.list({ ...base, status: ['quarantined', 'rejected'] }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ all, blocked }) => {
          if (request !== this.activityRequest) return;
          this.keyActivity.set({
            received: all.total,
            blocked: blocked.total,
            lastFileAt: all.items[0]?.createdAt ?? null,
          });
        },
        error: () => {
          if (request === this.activityRequest) this.keyActivityError.set(true);
        },
      });
  }

  async copyKey(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.secret());
      this.copyStatus.set('Clave copiada.');
    } catch {
      this.copyStatus.set('Selecciona la clave para copiarla manualmente.');
    }
  }

  toggleSidebar(): void {
    this.collapsed.update((value) => !value);
    try {
      localStorage.setItem('gatekeeper-sidebar', this.collapsed() ? 'collapsed' : 'open');
    } catch {
      // El menú sigue funcionando en esta sesión aunque no se pueda guardar.
    }
  }

  backToTop(): void {
    window.scrollTo({
      top: 0,
      behavior:
        this.preferences.reducedMotion() ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
    });
  }

  private loadViewData(): void {
    this.loadError.set('');
    switch (this.view) {
      case 'summary':
        this.loadMetrics();
        this.loadThreats();
        this.loadFiles();
        break;
      case 'files':
        this.loadFiles();
        break;
      case 'quarantine':
        this.loadFiles({ status: ['quarantined'] });
        break;
      case 'detail': {
        const id = this.params().get('id');
        if (id) this.loadDetail(id);
        break;
      }
      case 'alerts':
        this.loadFiles({ status: ['quarantined', 'rejected'] });
        this.eventsApi
          .stream()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((ev) => this.liveEvents.update((prev) => [ev, ...prev].slice(0, 50)));
        break;
      case 'audit':
        this.loadAudit();
        break;
      case 'keys':
        this.loadKeys();
        break;
    }
  }

  private loadFiles(opts?: {
    status?: readonly Exclude<ApiFileStatus, 'unknown'>[];
    q?: string;
  }): void {
    const request = ++this.filesRequest;
    this.loading.set(true);
    this.loadError.set('');
    this.filesApi
      .list({ page: 1, pageSize: 50, status: opts?.status, q: opts?.q })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          if (request !== this.filesRequest) return; // llegó una búsqueda más reciente
          this.files.set(page.items.map(mapFile));
          this.loading.set(false);
        },
        error: (err: unknown) => {
          if (request !== this.filesRequest) return;
          this.loading.set(false);
          this.loadError.set(this.describeApiError(err, 'No se pudieron cargar los archivos.'));
        },
      });
  }

  private loadDetail(id: string): void {
    this.loading.set(true);
    this.filesApi
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (record) => {
          this.selectedFile.set(mapFile(record));
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.selectedFile.set(null);
          this.loading.set(false);
          this.loadError.set(this.describeApiError(err, 'Archivo no encontrado.'));
        },
      });
  }

  private loadMetrics(): void {
    this.metricsApi
      .get('7d')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (m) => this.metrics.set(m),
        error: () => undefined,
      });
  }

  /**
   * La gráfica se arma con los archivos (no con `amenazas_por_dia` de /metrics): el backend
   * agrupa ese campo por día UTC y no da errores por día. Aquí se agrupa por día local.
   */
  private loadThreats(): void {
    const from = chartWindowStart().toISOString();
    const collected: FileRecord[] = [];
    const fetchPage = (page: number): void => {
      this.filesApi
        .list({
          page,
          pageSize: 100,
          status: ['quarantined', 'rejected', 'error'],
          from,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result) => {
            collected.push(...result.items);
            const more = page * result.pageSize < result.total && result.items.length > 0;
            if (more && page < THREAT_PAGES) fetchPage(page + 1);
            else this.threatDays.set(groupThreatDays(collected));
          },
          error: () => this.threatDays.set(groupThreatDays(collected)),
        });
    };
    fetchPage(1);
  }

  private loadAudit(): void {
    this.loading.set(true);
    this.auditApi
      .list({ page: 1, pageSize: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.audit.set(page.items.map(mapAudit));
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.loadError.set(this.describeApiError(err, 'No se pudo cargar la bitácora.'));
        },
      });
  }

  private loadKeys(): void {
    this.loading.set(true);
    this.keysApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.keys.set(list.map(mapKey));
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.loadError.set(this.describeApiError(err, 'No se pudieron cargar las claves API.'));
        },
      });
  }

  private describeAuthError(err: unknown, isTotp = false): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 429) return 'Demasiados intentos. Espera un minuto y vuelve a intentar.';
      if (err.status === 401) {
        return isTotp ? 'Código TOTP inválido o expirado.' : 'Correo o contraseña incorrectos.';
      }
      if (err.status === 503) return 'Servicio temporalmente no disponible.';
    }
    return 'No se pudo conectar con el servidor de autenticación.';
  }

  private describeApiError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 403) return 'No tienes permisos de administrador para esta acción.';
      if (err.status === 404) return 'Recurso no encontrado.';
      if (err.status === 409) return 'El archivo ya no está en cuarentena.';
      if (err.status === 429) return 'Límite de peticiones alcanzado. Intenta en unos segundos.';
    }
    return fallback;
  }

  private readCollapsed(): boolean {
    try {
      return localStorage.getItem('gatekeeper-sidebar') === 'collapsed';
    } catch {
      return false;
    }
  }
}
