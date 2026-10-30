import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { Terminal } from '../terminal/terminal';
import { Shell } from '../terminal/shell-tokens';

interface Session {
  command: readonly string[];
  output: readonly string[];
}

interface Step {
  id: string;
  title: string;
  detail: string;
  sessions: Record<Shell, Session>;
}

const ID = '3f2b9c1e-7a41-4c0e-9d2b-5e8f1a6c0d47';
const URL = 'https://gatekeeper.example/v1/files';

/**
 * Integración en su forma de trabajo: las tres llamadas del contrato, en Bash y PowerShell.
 * Dominio, encabezado de la API key e IDs son de ejemplo (lo dice la nota de la sección).
 */
@Component({
  selector: 'gk-integration',
  imports: [Terminal],
  templateUrl: './integration.html',
  styleUrl: './integration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Integration {
  protected readonly shell = signal<Shell>('bash');
  protected readonly shells: readonly { id: Shell; label: string }[] = [
    { id: 'bash', label: 'Bash' },
    { id: 'powershell', label: 'PowerShell' },
  ];

  protected readonly steps: readonly Step[] = [
    {
      id: 'upload',
      title: 'Envía el archivo',
      detail: 'La API responde al instante con un ID. El análisis corre en segundo plano.',
      sessions: {
        bash: {
          command: [
            `curl -i -X POST ${URL} \\`,
            '  -H "X-API-Key: $GATEKEEPER_API_KEY" \\',
            '  -F "file=@foto.jpg"',
          ],
          output: [
            'HTTP/1.1 202 Accepted',
            'content-type: application/json',
            '',
            `{"id":"${ID}","status":"pending"}`,
          ],
        },
        powershell: {
          command: [
            `Invoke-RestMethod -Method Post -Uri ${URL} \``,
            '  -Headers @{ "X-API-Key" = $env:GATEKEEPER_API_KEY } `',
            '  -Form @{ file = Get-Item .\\foto.jpg }',
          ],
          output: [
            '',
            'id                                   status',
            '--                                   ------',
            `${ID} pending`,
            '',
          ],
        },
      },
    },
    {
      id: 'status',
      title: 'Consulta el dictamen',
      detail: 'El estado pasa de pendiente a limpio, en cuarentena o rechazado.',
      sessions: {
        bash: {
          command: [`curl -s ${URL}/${ID} \\`, '  -H "X-API-Key: $GATEKEEPER_API_KEY" | jq'],
          output: [
            '{',
            `  "id": "${ID}",`,
            '  "status": "clean",',
            '  "detectedType": "image/jpeg"',
            '}',
          ],
        },
        powershell: {
          command: [
            `Invoke-RestMethod -Uri ${URL}/${ID} \``,
            '  -Headers @{ "X-API-Key" = $env:GATEKEEPER_API_KEY }',
          ],
          output: [
            '',
            'id                                   status detectedType',
            '--                                   ------ ------------',
            `${ID} clean  image/jpeg`,
            '',
          ],
        },
      },
    },
    {
      id: 'content',
      title: 'Descarga la copia reconstruida',
      detail: 'Solo existe cuando el estado es limpio. El original nunca se entrega.',
      sessions: {
        bash: {
          command: [
            `curl -s ${URL}/${ID}/content \\`,
            '  -H "X-API-Key: $GATEKEEPER_API_KEY" \\',
            '  -o foto-limpia.jpg -w "%{http_code}\\n"',
          ],
          output: ['200'],
        },
        powershell: {
          command: [
            `Invoke-WebRequest -Uri ${URL}/${ID}/content \``,
            '  -Headers @{ "X-API-Key" = $env:GATEKEEPER_API_KEY } `',
            '  -OutFile foto-limpia.jpg',
          ],
          output: [],
        },
      },
    },
  ];
}
