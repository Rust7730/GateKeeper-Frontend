import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { ConsolePage } from '../dashboard/console-page';
import { ThreatChart, type ThreatPoint } from './threat-chart';
import { WorkspaceDemo } from './workspace-demo';
import { WorkspacePreferences } from './workspace-preferences';
import { WorkspaceSettings } from './workspace-settings';
import {
  SAMPLE_FILES,
  THREAT_SERIES,
  WORKSPACE_NAV,
  WORKSPACE_PAGES,
  type DemoKey,
  type FileStatus,
  type WorkspaceView,
} from './workspace-data';

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
export class Workspace {
  private readonly route = inject(ActivatedRoute);
  private readonly demo = inject(WorkspaceDemo);
  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  readonly preferences = inject(WorkspacePreferences);
  readonly t = (text: string, english?: string) => this.preferences.text(text, english);

  readonly view = this.route.snapshot.data['view'] as WorkspaceView;
  readonly page = WORKSPACE_PAGES[this.view];
  readonly nav = WORKSPACE_NAV;
  readonly series = THREAT_SERIES;
  readonly totals = THREAT_SERIES.reduce(
    (sum, day) => ({
      quarantined: sum.quarantined + day.quarantined,
      rejected: sum.rejected + day.rejected,
    }),
    { quarantined: 0, rejected: 0 },
  );
  readonly chartLabels = computed(() => ({
    quarantine: this.t('Cuarentena'),
    rejected: this.t('Rechazos'),
    total: this.t('Total'),
  }));
  readonly describeDay = (point: ThreatPoint): string =>
    `${this.t(point.day)}: ${point.quarantined}${this.t(' en cuarentena y ', ' quarantined and ')}${point.rejected}${this.t(' rechazos', ' rejections')}`;
  readonly statuses: readonly FileStatus[] = [
    'Limpio',
    'En cuarentena',
    'Rechazado',
    'Pendiente',
    'Liberado',
  ];
  readonly collapsed = signal(this.readCollapsed());
  readonly query = signal('');
  readonly status = signal('');
  readonly files = this.demo.files;
  readonly keys = this.demo.keys;
  readonly audit = this.demo.audit;
  readonly administrator = this.demo.administrator;
  readonly notice = signal('');
  readonly releaseTarget = signal('');
  readonly revokeTarget = signal<DemoKey | null>(null);
  readonly secret = signal('');
  readonly copyStatus = signal('');

  readonly selectedFile = computed(() =>
    this.files().find((file) => file.id === this.params().get('id')),
  );
  readonly quarantine = computed(() =>
    this.files().filter((file) => file.status === 'En cuarentena'),
  );
  readonly alerts = SAMPLE_FILES.filter(
    (file) => file.status === 'En cuarentena' || file.status === 'Rechazado',
  );
  readonly visibleFiles = computed(() => {
    const query = this.query().trim().toLowerCase();
    const status = this.status();
    return this.files().filter(
      (file) =>
        (!status || file.status === status) &&
        `${file.name} ${file.id} ${file.type}`.toLowerCase().includes(query),
    );
  });

  releaseFile(reason: string): void {
    const id = this.releaseTarget();
    if (
      !this.administrator() ||
      !reason.trim() ||
      !this.quarantine().some((file) => file.id === id)
    )
      return;

    this.files.update((files) =>
      files.map((file) =>
        file.id === id && file.status === 'En cuarentena' ? { ...file, status: 'Liberado' } : file,
      ),
    );
    this.record('Liberación de ejemplo', id, reason.trim());
    this.notice.set('Archivo liberado en la demostración.');
  }

  createKey(name: string): void {
    if (!name.trim() || this.secret()) return;

    const id = crypto.randomUUID();
    const prefix = `gk_demo_${id.slice(0, 8)}`;
    this.keys.update((keys) => [...keys, { id, name: name.trim(), prefix, revoked: false }]);
    this.secret.set(this.demo.tokenFor(id));
    this.record('Clave de ejemplo creada', name.trim());
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

  private readCollapsed(): boolean {
    try {
      return localStorage.getItem('gatekeeper-sidebar') === 'collapsed';
    } catch {
      return false;
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

  revokeKey(): void {
    const target = this.revokeTarget();
    if (!this.administrator() || !target || target.revoked) return;

    this.keys.update((keys) =>
      keys.map((key) => (key.id === target.id ? { ...key, revoked: true } : key)),
    );
    this.record('Clave de ejemplo revocada', target.name);
    this.notice.set('Clave revocada en la demostración.');
  }

  private record(action: string, resource: string, note?: string): void {
    this.audit.update((events) => [
      {
        action,
        resource,
        note,
        actor: this.administrator() ? 'Administrador de ejemplo' : 'Analista de ejemplo',
        time: 'Ahora',
      },
      ...events,
    ]);
  }
}
