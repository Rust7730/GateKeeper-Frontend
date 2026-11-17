import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { AdminFilesApi } from '../../../core/api/admin-files.api';
import {
  DetectionLayer,
  FileRecord,
  FileStatus,
  FilterableFileStatus,
} from '../../../core/models/file.model';

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<FileStatus, string> = {
  pending: 'Pendiente',
  clean: 'Limpio',
  quarantined: 'En cuarentena',
  rejected: 'Rechazado',
  error: 'Error',
  unknown: 'Desconocido',
};

const LAYER_LABEL: Record<DetectionLayer, string> = {
  signature: 'Firma',
  whitelist: 'Lista blanca',
  cdr: 'CDR',
  clamav: 'ClamAV',
  virustotal: 'VirusTotal',
  size_limit: 'Límite de tamaño',
  pixel_limit: 'Límite de píxeles',
  rate_limit: 'Límite de peticiones',
  encrypted_pdf: 'PDF cifrado',
  unknown: 'Desconocida',
};

interface Row {
  file: FileRecord;
  status: string;
  name: string | null;
  sha256: string | null;
  blockedBy: string | null;
}

/**
 * Solo desarrollo (`/dev/api`): lista los archivos del backend simulado con paginación.
 * Cubre la aceptación de M04 mientras no exista el styleguide de M02–M03.
 */
@Component({
  selector: 'gk-dev-api',
  templateUrl: './dev-api.html',
  styleUrl: './dev-api.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevApi {
  private readonly api = inject(AdminFilesApi);

  protected readonly statusOptions = (
    ['quarantined', 'clean', 'rejected', 'pending', 'error'] as const
  ).map((value) => ({ value, label: STATUS_LABEL[value] }));

  protected readonly page = signal(1);
  protected readonly status = signal<FilterableFileStatus | null>(null);

  protected readonly files = rxResource({
    params: () => ({ page: this.page(), status: this.status() }),
    stream: ({ params }) =>
      this.api.list({
        page: params.page,
        pageSize: PAGE_SIZE,
        status: params.status ? [params.status] : undefined,
      }),
  });

  protected readonly rows = computed<Row[]>(() => {
    const items = this.files.hasValue() ? this.files.value().items : [];
    return items.map((file) => ({
      file,
      status: STATUS_LABEL[file.status],
      // K20: solo un archivo con detalle completo tiene nombre, hash y capa.
      name: file.disclosure === 'full' ? file.originalName : null,
      sha256: file.disclosure === 'full' ? file.sha256 : null,
      blockedBy: file.disclosure === 'full' && file.blockedBy ? LAYER_LABEL[file.blockedBy] : null,
    }));
  });

  protected readonly total = computed(() => (this.files.hasValue() ? this.files.value().total : 0));
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / PAGE_SIZE)));
  protected readonly pageLabel = computed(() => `Página ${this.page()} de ${this.pageCount()}`);

  protected setStatus(value: string): void {
    const option = this.statusOptions.find((o) => o.value === value);
    this.status.set(option ? option.value : null);
    this.page.set(1);
  }

  protected previous(): void {
    this.page.update((p) => Math.max(1, p - 1));
  }

  protected next(): void {
    this.page.update((p) => Math.min(this.pageCount(), p + 1));
  }
}
