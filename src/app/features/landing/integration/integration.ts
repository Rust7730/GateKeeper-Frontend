import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface Step {
  id: string;
  title: string;
  detail: string;
  request: string;
  response: string;
}

/**
 * Integración en su forma de trabajo: las tres llamadas reales del contrato.
 * Los valores (encabezado de la API key, IDs, hashes) son de ejemplo.
 */
@Component({
  selector: 'gk-integration',
  templateUrl: './integration.html',
  styleUrl: './integration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Integration {
  protected readonly copiedId = signal<string | null>(null);
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly steps: readonly Step[] = [
    {
      id: 'upload',
      title: 'Envía el archivo',
      detail: 'La API responde de inmediato con un ID; el análisis corre en segundo plano.',
      request: `curl -X POST https://gatekeeper.example/v1/files \\
  -H "X-API-Key: $GATEKEEPER_API_KEY" \\
  -F "file=@foto.jpg"`,
      response: `202 Accepted
{ "id": "3f2b9c1e-7a41-4c0e-9d2b-5e8f1a6c0d47", "status": "pending" }`,
    },
    {
      id: 'status',
      title: 'Consulta el dictamen',
      detail: 'El estado pasa de pendiente a limpio, en cuarentena o rechazado.',
      request: `curl https://gatekeeper.example/v1/files/3f2b9c1e-7a41-4c0e-9d2b-5e8f1a6c0d47 \\
  -H "X-API-Key: $GATEKEEPER_API_KEY"`,
      response: `200 OK
{ "id": "3f2b9c1e-…", "status": "clean", "detectedType": "image/jpeg" }`,
    },
    {
      id: 'content',
      title: 'Descarga la copia reconstruida',
      detail: 'Solo existe cuando el estado es limpio. El original nunca se entrega.',
      request: `curl https://gatekeeper.example/v1/files/3f2b9c1e-7a41-4c0e-9d2b-5e8f1a6c0d47/content \\
  -H "X-API-Key: $GATEKEEPER_API_KEY" -o foto-limpia.jpg`,
      response: `200 OK
(imagen recodificada desde los píxeles, sin EXIF)`,
    },
  ];

  protected async copy(step: Step): Promise<void> {
    try {
      await navigator.clipboard.writeText(step.request);
      this.copiedId.set(step.id);
      clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => this.copiedId.set(null), 2000);
    } catch {
      this.copiedId.set(null);
    }
  }
}
