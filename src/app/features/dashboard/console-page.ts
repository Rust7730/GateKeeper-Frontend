import { Component, computed, inject, input, signal } from '@angular/core';
import { WorkspaceDemo } from '../overview/workspace-demo';
import { API_ENDPOINTS, ApiEndpoint, groupEndpoints } from './api-endpoints';

interface RequestResult {
  readonly status: number;
  readonly body: Record<string, unknown>;
  readonly latency: number;
}

/**
 * Consola de pruebas de la API. Cada sección del menú (Playground, Archivos, Cuarentena...)
 * es una ruta distinta que reutiliza esta página y recibe su carpeta y textos como datos de ruta.
 */
@Component({
  selector: 'gk-console-page',
  templateUrl: './console-page.html',
  styleUrl: './console-page.scss',
})
export class ConsolePage {
  private readonly demo = inject(WorkspaceDemo);

  // Datos de la ruta (se enlazan por withComponentInputBinding).
  readonly folder = input<string | undefined>(undefined);
  readonly eyebrow = input('Gatekeeper Console');
  readonly heading = input('');
  readonly accent = input('');
  readonly tail = input('.');
  readonly lead = input('');
  readonly showHead = input(true);

  readonly groups = computed(() => groupEndpoints(this.folder()));
  private readonly scoped = computed(() => this.groups().flatMap((group) => [...group.items]));

  private readonly selectedId = signal<string | null>(null);
  private readonly result = signal<RequestResult | null>(null);

  readonly selectedEndpoint = computed<ApiEndpoint>(
    () =>
      this.scoped().find((endpoint) => endpoint.id === this.selectedId()) ??
      this.scoped()[0] ??
      API_ENDPOINTS[0],
  );
  readonly selectedSnippetLang = signal<'curl' | 'ts' | 'python'>('curl');
  readonly parameter = signal('demo-001');
  readonly isRunningRequest = signal(false);

  readonly body = computed(() => this.selectedEndpoint().requestBody ?? '');
  readonly responseStatusCode = computed(() => this.result()?.status ?? 200);
  readonly actualLatency = computed(
    () => this.result()?.latency ?? this.selectedEndpoint().latencyMs,
  );
  readonly currentResponse = computed<Record<string, unknown>>(
    () => this.result()?.body ?? this.selectedEndpoint().responseExample,
  );
  readonly formattedResponse = computed(() => JSON.stringify(this.currentResponse(), null, 2));

  readonly key = computed<string>(() => {
    const first = this.demo.keys().find((k) => !k.revoked);
    return first ? this.demo.tokenFor(first.id) : 'gk_live_demo_key';
  });

  readonly parameterName = computed<string | null>(() => {
    const match = this.selectedEndpoint().path.match(/:(\w+)/);
    return match ? match[1] : null;
  });

  readonly requestPath = computed<string>(() => {
    const endpoint = this.selectedEndpoint();
    const param = this.parameterName();
    if (!param) return endpoint.path;
    return endpoint.path.replace(`:${param}`, this.parameter().trim() || `:${param}`);
  });

  endpointLabel(endpoint: ApiEndpoint): string {
    return endpoint.name.replace(/\.(get|post|put|delete)$/, '');
  }

  selectEndpoint(endpoint: ApiEndpoint): void {
    this.selectedId.set(endpoint.id);
    this.result.set(null);
  }

  setSnippetLang(lang: 'curl' | 'ts' | 'python'): void {
    this.selectedSnippetLang.set(lang);
  }

  executeRequest(): void {
    if (this.isRunningRequest()) return;

    const endpoint = this.selectedEndpoint();
    const key = this.key().trim();
    const body = this.body();
    const missingParameter = this.parameterName() && !this.parameter().trim();
    this.isRunningRequest.set(true);
    setTimeout(() => {
      if (this.selectedEndpoint() === endpoint) {
        const latency = endpoint.latencyMs;
        if (key && !this.demo.acceptsKey(key)) {
          this.result.set({ status: 401, latency, body: { error: 'invalid_demo_key' } });
        } else if (missingParameter || (endpoint.requestBody && !this.isJsonObject(body))) {
          this.result.set({
            status: 422,
            latency,
            body: { error: missingParameter ? 'missing_path_parameter' : 'invalid_json_object' },
          });
        } else {
          this.result.set({ status: 200, latency, body: endpoint.responseExample });
        }
      }
      this.isRunningRequest.set(false);
    }, 380);
  }

  private isJsonObject(body: string): boolean {
    try {
      const value: unknown = JSON.parse(body);
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    } catch {
      return false;
    }
  }

  getSnippetCode(): string {
    const endpoint = this.selectedEndpoint();
    const domain = 'api.gatekeeper.dev';
    const url = JSON.stringify(`https://${domain}${this.requestPath()}`);
    const body = endpoint.requestBody ? this.body() : null;

    switch (this.selectedSnippetLang()) {
      case 'curl':
        return [
          `curl -X ${endpoint.method} ${url}`,
          "  -H 'Authorization: Bearer YOUR_API_KEY'",
          ...(body === null
            ? []
            : [
                "  -H 'Content-Type: application/json'",
                `  --data-raw '${body.replaceAll("'", "'\\''")}'`,
              ]),
        ].join(' \\' + '\n');
      case 'ts':
        return `const response = await fetch(${url}, {
  method: '${endpoint.method}',
  headers: {
    Authorization: 'Bearer YOUR_API_KEY'${body === null ? '' : `,\n    'Content-Type': 'application/json'`}
  }${body === null ? '' : `,\n  body: ${JSON.stringify(body)}`}
});
console.log(await response.json());`;
      case 'python':
        return `import requests

response = requests.request(
    "${endpoint.method}",
    ${url},
    headers={
        "Authorization": "Bearer YOUR_API_KEY"${body === null ? '' : ',\n        "Content-Type": "application/json"'}
    }${body === null ? '' : `,\n    data=${JSON.stringify(body)}`}
)
print(response.json())`;
    }
  }
}
