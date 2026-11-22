import { NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';

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
  error: 'Rechazado',
  unknown: 'Pendiente',
};

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

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-MX', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Ventana de la gráfica de amenazas (coincide con `metricsApi.get('7d')`). */
const CHART_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * El backend agrupa por día calendario en UTC y manda `YYYY-MM-DD`. Se formatea en UTC:
 * con la zona local, `2026-11-20T00:00Z` en México (UTC-6) se mostraría como el día 19.
 */
export function formatDayLabel(day: string, language: 'es' | 'en'): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day.slice(5, 10);
  return date.toLocaleDateString(language === 'en' ? 'en-US' : 'es-MX', {
    weekday: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  });
}

/** Últimos `CHART_DAYS` días (UTC), con ceros en los días sin actividad. */
export function fillThreatDays(
  rows: readonly { date: string; blocked: number; quarantined: number }[],
  now = Date.now(),
): { day: string; blocked: number; quarantined: number }[] {
  const byDay = new Map(rows.map((row) => [row.date.slice(0, 10), row]));
  const today = Math.floor(now / DAY_MS) * DAY_MS;
  return Array.from({ length: CHART_DAYS }, (_, index) => {
    const day = new Date(today - (CHART_DAYS - 1 - index) * DAY_MS).toISOString().slice(0, 10);
    const row = byDay.get(day);
    return { day, blocked: row?.blocked ?? 0, quarantined: row?.quarantined ?? 0 };
  });
}

function mapFile(record: FileRecord): FileDetailView {
  const isFull = record.disclosure === 'full';
  const name = isFull
    ? (record.originalName ?? `Archivo ${record.id.slice(0, 8)}`)
    : `Archivo ${record.id.slice(0, 8)} (K20)`;
  let reason = 'Metadatos restringidos por política de privacidad K20.';
  if (isFull) {
    const mal = record.layers.find((l) => l.signature !== null || l.vtDetections !== null);
    if (mal?.signature) {
      reason = `ClamAV detectó la firma ${mal.signature}.`;
    } else if (mal?.vtDetections) {
      reason = `VirusTotal reportó ${mal.vtDetections.positives}/${mal.vtDetections.total} motores maliciosos.`;
    } else if (record.reason) {
      reason = `Motivo: ${record.reason}.`;
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
    time: formatTime(record.createdAt),
    reason,
    disclosure: record.disclosure,
    appName: record.appName ?? '—',
    sha256: isFull ? record.sha256 : null,
    quarantineExpiresAt: isFull ? formatTime(record.quarantineExpiresAt) : null,
    layers: isFull ? record.layers : [],
  };
}

function mapAudit(entry: AuditEntry): AuditEvent {
  return {
    action: AUDIT_ACTION_LABEL[entry.action] ?? entry.action,
    resource: entry.resource ?? '—',
    actor: entry.actor.email || 'Sistema',
    time: formatTime(entry.at),
    note: entry.reason ?? (entry.ip ? `IP: ${entry.ip}` : undefined),
  };
}

function mapKey(key: ApiKey): DemoKey {
  return {
    id: key.id,
    name: key.appName ?? key.appId.slice(0, 8),
    prefix: key.prefix ?? 'gk_',
    revoked: key.status === 'revoked',
  };
}

@Component({
  selector: 'gk-workspace',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet,
    ConsolePage,
    ThreatChart,
    WorkspaceSettings,
  ],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
  host: {
    '[attr.data-theme]': 'preferences.theme()',
    '[attr.data-motion]': 'preferences.reducedMotion() ? "reduce" : null',
  },
})
export class Workspace implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);
  private readonly filesApi = inject(AdminFilesApi);
  private readonly metricsApi = inject(MetricsApi);
  private readonly auditApi = inject(AuditApi);
  private readonly keysApi = inject(ApiKeysApi);
  private readonly eventsApi = inject(EventsApi);
  private readonly params = toSignal(this.route.paramMap, { requireSync: true });

  readonly preferences = inject(WorkspacePreferences);
  readonly t = (text: string, english?: string) => this.preferences.text(text, english);

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

  readonly series = computed<readonly ThreatPoint[]>(() => {
    const m = this.metrics();
    if (!m) return [];
    const language = this.preferences.language();
    return fillThreatDays(m.threatsByDay).map((d) => ({
      day: formatDayLabel(d.day, language),
      quarantined: d.quarantined,
      rejected: Math.max(0, d.blocked - d.quarantined),
    }));
  });

  readonly totals = computed(() => {
    const m = this.metrics();
    return {
      totalFiles: m ? m.totals.processed + m.totals.pending : this.files().length,
      quarantined: m ? m.totals.quarantined : this.quarantine().length,
      rejected: m ? m.totals.rejected : 0,
      alertsCount: m ? m.totals.quarantined + m.totals.rejected : this.alerts().length,
    };
  });

  readonly chartLabels = computed(() => ({
    quarantine: this.t('Cuarentena'),
    rejected: this.t('Rechazos'),
    total: this.t('Total'),
  }));

  readonly describeDay = (point: ThreatPoint): string =>
    `${point.day}: ${point.quarantined}${this.t(' en cuarentena y ', ' quarantined and ')}${point.rejected}${this.t(' rechazos', ' rejections')}`;

  readonly statuses: readonly FileStatus[] = ['Limpio', 'En cuarentena', 'Rechazado', 'Pendiente'];

  readonly collapsed = signal(this.readCollapsed());
  readonly query = signal('');
  readonly status = signal('');
  readonly notice = signal('');
  readonly releaseTarget = signal('');
  readonly revokeTarget = signal<DemoKey | null>(null);
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
      time: formatTime(ev.at),
      reason: EVENT_LABEL[ev.type] ?? 'Evento de seguridad',
    }));
    const fromFiles = this.files().filter(
      (file) => file.status === 'En cuarentena' || file.status === 'Rechazado',
    );
    return [...fromSse, ...fromFiles];
  });

  readonly visibleFiles = computed(() => {
    const query = this.query().trim().toLowerCase();
    const status = this.status();
    return this.files().filter(
      (file) =>
        (!status || file.status === status) &&
        `${file.name} ${file.id} ${file.type}`.toLowerCase().includes(query),
    );
  });

  ngOnInit(): void {
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
          this.notice.set('Clave API revocada de inmediato.');
        },
        error: (err: unknown) => {
          this.notice.set(this.describeApiError(err, 'No se pudo revocar la clave API.'));
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

  private loadFiles(opts?: { status?: readonly Exclude<ApiFileStatus, 'unknown'>[] }): void {
    this.loading.set(true);
    this.filesApi
      .list({ page: 1, pageSize: 50, status: opts?.status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.files.set(page.items.map(mapFile));
          this.loading.set(false);
        },
        error: (err: unknown) => {
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
