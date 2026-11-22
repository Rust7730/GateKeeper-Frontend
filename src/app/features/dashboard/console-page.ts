import { Component, computed, inject, input, signal } from '@angular/core';

import { isUuid } from '../../core/api/backend-adapter';
import { TokenStore } from '../../core/auth/token-store';
import { WorkspacePreferences } from '../overview/workspace-preferences';
import { API_ENDPOINTS, ApiEndpoint, groupEndpoints } from './api-endpoints';

interface RequestResult {
  readonly status: number;
  readonly statusText: string;
  readonly contentType: string;
  readonly body: unknown;
  readonly latency: number;
}

/**
 * Consola interactiva real contra la API de Gatekeeper:
 * - Rutas `/v1/files*` usan la API key (`gk_...`) ingresada por el usuario y permiten subir archivos reales.
 * - Rutas `/v1/admin/*` usan automáticamente el JWT de sesión actual (`TokenStore`).
 */
@Component({
  selector: 'gk-console-page',
  templateUrl: './console-page.html',
  styleUrl: './console-page.scss',
})
export class ConsolePage {
  private readonly tokens = inject(TokenStore);
  private readonly preferences = inject(WorkspacePreferences);
  /** Texto en el idioma elegido en Ajustes (la consola siempre trae las dos versiones). */
  readonly t = (spanish: string, english: string) => this.preferences.text(spanish, english);
  readonly english = computed(() => this.preferences.language() === 'en');

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
  readonly apiKeyInput = signal('');
  readonly parameter = signal('');
  readonly customBody = signal('');
  readonly selectedFile = signal<File | null>(null);
  readonly isRunningRequest = signal(false);

  readonly body = computed(() => this.customBody() || this.selectedEndpoint().requestBody || '');
  readonly responseStatusCode = computed(
    () => this.result()?.status ?? this.selectedEndpoint().responseStatus?.code ?? 200,
  );
  readonly responseStatusText = computed(
    () => this.result()?.statusText ?? this.selectedEndpoint().responseStatus?.text ?? 'OK',
  );
  readonly responseContentType = computed(() => this.result()?.contentType ?? 'application/json');
  readonly actualLatency = computed(
    () => this.result()?.latency ?? this.selectedEndpoint().latencyMs,
  );
  readonly currentResponse = computed<unknown>(
    () => this.result()?.body ?? this.selectedEndpoint().responseExample,
  );
  readonly formattedResponse = computed(() => {
    const resp = this.currentResponse();
    return typeof resp === 'string' ? resp : JSON.stringify(resp, null, 2);
  });

  readonly summary = computed(() =>
    this.english() ? this.selectedEndpoint().summaryEn : this.selectedEndpoint().summary,
  );
  readonly description = computed(() =>
    this.english() ? this.selectedEndpoint().descriptionEn : this.selectedEndpoint().description,
  );

  /** El :id va en la URL: si no es un UUID se avisa aquí, sin mandar la petición. */
  readonly parameterInvalid = computed(() => {
    const value = this.parameter().trim();
    return this.parameterName() !== null && value !== '' && !isUuid(value);
  });

  readonly parameterName = computed<string | null>(() => {
    const match = this.selectedEndpoint().path.match(/:(\w+)/);
    return match ? match[1] : null;
  });

  readonly requestPath = computed<string>(() => {
    const endpoint = this.selectedEndpoint();
    const param = this.parameterName();
    if (!param) return endpoint.path;
    return endpoint.path.replace(
      `:${param}`,
      encodeURIComponent(this.parameter().trim()) || `:${param}`,
    );
  });

  endpointLabel(endpoint: ApiEndpoint): string {
    return endpoint.name.replace(/\.(get|post|put|delete)$/, '');
  }

  selectEndpoint(endpoint: ApiEndpoint): void {
    this.selectedId.set(endpoint.id);
    this.customBody.set(endpoint.requestBody ?? '');
    this.result.set(null);
  }

  setSnippetLang(lang: 'curl' | 'ts' | 'python'): void {
    this.selectedSnippetLang.set(lang);
  }

  onFileSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement | null;
    this.selectedFile.set(inputEl?.files?.[0] ?? null);
  }

  async executeRequest(): Promise<void> {
    if (this.isRunningRequest()) return;

    const endpoint = this.selectedEndpoint();
    const param = this.parameterName();
    if (param && !this.parameter().trim()) {
      this.localError(
        this.t(
          `Falta el parámetro :${param} (UUID del archivo).`,
          `Missing the :${param} parameter (file UUID).`,
        ),
      );
      return;
    }

    if (param && this.parameterInvalid()) {
      this.localError(
        this.t(
          `El parámetro :${param} debe ser un UUID (p. ej. 3c7b078b-47f5-475e-a6f5-d0fc32c30b16). No se envió la petición.`,
          `The :${param} parameter must be a UUID (e.g. 3c7b078b-47f5-475e-a6f5-d0fc32c30b16). The request was not sent.`,
        ),
      );
      return;
    }

    if (endpoint.isMultipart && !this.selectedFile()) {
      this.localError(
        this.t(
          'Selecciona un archivo antes de ejecutar POST /v1/files.',
          'Choose a file before running POST /v1/files.',
        ),
      );
      return;
    }

    const headers: Record<string, string> = {};
    if (endpoint.authMode === 'api-key') {
      const key = this.apiKeyInput().trim();
      if (key) {
        headers['Authorization'] = `Bearer ${key}`;
      }
    } else if (endpoint.authMode === 'jwt') {
      const jwt = this.tokens.accessToken();
      if (jwt) {
        headers['Authorization'] = `Bearer ${jwt}`;
      }
    }

    let requestBody: BodyInit | undefined;
    if (endpoint.isMultipart) {
      const form = new FormData();
      const file = this.selectedFile();
      if (file) form.append('file', file, file.name);
      requestBody = form;
    } else if (endpoint.requestBody !== undefined) {
      const rawBody = this.body();
      if (!this.isJsonObject(rawBody)) {
        this.localError(
          this.t(
            'El cuerpo debe ser un objeto JSON válido.',
            'The body must be a valid JSON object.',
          ),
        );
        return;
      }
      headers['Content-Type'] = 'application/json';
      requestBody = rawBody;
    }

    this.isRunningRequest.set(true);
    const start = performance.now();
    try {
      const response = await fetch(this.requestPath(), {
        method: endpoint.method,
        headers,
        body: requestBody,
      });
      const latency = Math.max(1, Math.round(performance.now() - start));
      const contentType = response.headers.get('content-type') ?? 'application/octet-stream';

      let parsedBody: unknown;
      if (contentType.includes('application/json')) {
        parsedBody = await response.json();
        // Auto-rellena :id con el UUID recién subido para probar GET /v1/files/:id enseguida.
        if (
          endpoint.id === 'files-upload' &&
          response.ok &&
          typeof parsedBody === 'object' &&
          parsedBody !== null &&
          'id' in parsedBody &&
          typeof (parsedBody as Record<string, unknown>)['id'] === 'string'
        ) {
          this.parameter.set((parsedBody as Record<string, string>)['id']);
        }
      } else if (contentType.startsWith('text/')) {
        parsedBody = await response.text();
      } else {
        const buf = await response.arrayBuffer();
        parsedBody = {
          archivo_binario: true,
          content_type: contentType,
          tamano_bytes: buf.byteLength,
          content_disposition: response.headers.get('content-disposition'),
        };
      }

      this.result.set({
        status: response.status,
        statusText: response.statusText || '',
        contentType,
        latency,
        body: parsedBody,
      });
    } catch {
      this.result.set({
        status: 0,
        statusText: 'Network Error',
        contentType: 'application/json',
        latency: Math.max(1, Math.round(performance.now() - start)),
        body: {
          detail: this.t(
            'No se pudo completar la petición HTTP.',
            'The HTTP request could not be completed.',
          ),
        },
      });
    } finally {
      this.isRunningRequest.set(false);
    }
  }

  /** Error de validación local: se muestra como 422 y no sale ninguna petición. */
  private localError(detail: string): void {
    this.result.set({
      status: 422,
      statusText: 'Unprocessable Entity',
      contentType: 'application/json',
      latency: 0,
      body: { detail },
    });
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
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://35-168-228-65.sslip.io';
    const url = JSON.stringify(`${origin}${this.requestPath()}`);
    const tokenPlaceholder = endpoint.authMode === 'jwt' ? 'YOUR_JWT_TOKEN' : 'YOUR_API_KEY';
    const body = endpoint.requestBody !== undefined ? this.body() : null;

    switch (this.selectedSnippetLang()) {
      case 'curl': {
        const lines = [`curl -X ${endpoint.method} ${url}`];
        if (endpoint.authMode !== 'none') {
          lines.push(`  -H 'Authorization: Bearer ${tokenPlaceholder}'`);
        }
        if (endpoint.isMultipart) {
          const name = this.selectedFile()?.name ?? 'foto.png';
          lines.push(`  -F 'file=@${name.replaceAll("'", "'\\''")}'`);
        } else if (body !== null) {
          lines.push("  -H 'Content-Type: application/json'");
          lines.push(`  --data-raw '${body.replaceAll("'", "'\\''")}'`);
        }
        return lines.join(' \\' + '\n');
      }
      case 'ts':
        if (endpoint.isMultipart) {
          return `const form = new FormData();
form.append('file', fileInput.files[0]);
const response = await fetch(${url}, {
  method: 'POST',
  headers: { Authorization: 'Bearer ${tokenPlaceholder}' },
  body: form,
});
console.log(await response.json());`;
        }
        return `const response = await fetch(${url}, {
  method: '${endpoint.method}'${
    endpoint.authMode === 'none' && body === null
      ? ''
      : `,
  headers: {${endpoint.authMode !== 'none' ? `\n    Authorization: 'Bearer ${tokenPlaceholder}'` : ''}${body === null ? '' : `${endpoint.authMode !== 'none' ? ',' : ''}\n    'Content-Type': 'application/json'`}
  }${body === null ? '' : `,\n  body: ${JSON.stringify(body)}`}`
  }
});
console.log(await response.json());`;
      case 'python':
        if (endpoint.isMultipart) {
          const name = this.selectedFile()?.name ?? 'foto.png';
          return `import httpx

with open(${JSON.stringify(name)}, "rb") as f:
    r = httpx.post(
        ${url},
        headers={"Authorization": "Bearer ${tokenPlaceholder}"},
        files={"file": f},
    )
print(r.status_code, r.json())`;
        }
        return `import httpx

r = httpx.request(
    "${endpoint.method}",
    ${url}${
      endpoint.authMode === 'none' && body === null
        ? ''
        : `,
    headers={${endpoint.authMode !== 'none' ? `\n        "Authorization": "Bearer ${tokenPlaceholder}"` : ''}${body === null ? '' : `${endpoint.authMode !== 'none' ? ',' : ''}\n        "Content-Type": "application/json"`}
    }${body === null ? '' : `,\n    content=${JSON.stringify(body)}`}`
    }
)
print(r.status_code, r.json())`;
    }
  }
}
