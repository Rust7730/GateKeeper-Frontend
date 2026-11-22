import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { WorkspacePreferences } from '../overview/workspace-preferences';
import { ENDPOINT_RESPONSES, ExampleResponse } from './api-responses';

type Lang = 'curl' | 'ts' | 'python';

interface DocSection {
  readonly id: string;
  readonly es: string;
  readonly en: string;
}

/** Secciones de la guía, en orden (alimentan el índice lateral). */
const SECTIONS: readonly DocSection[] = [
  { id: 'doc-inicio', es: 'Inicio rápido', en: 'Quick start' },
  { id: 'doc-autenticacion', es: 'Autenticación', en: 'Authentication' },
  { id: 'doc-flujo', es: 'Ciclo de un archivo', en: 'File lifecycle' },
  { id: 'doc-subir', es: 'POST /v1/files', en: 'POST /v1/files' },
  { id: 'doc-consultar', es: 'GET /v1/files/{id}', en: 'GET /v1/files/{id}' },
  { id: 'doc-descargar', es: 'GET /v1/files/{id}/content', en: 'GET /v1/files/{id}/content' },
  { id: 'doc-estados', es: 'Estados', en: 'Statuses' },
  { id: 'doc-limites', es: 'Tipos y límites', en: 'Types and limits' },
  { id: 'doc-errores', es: 'Errores y reintentos', en: 'Errors and retries' },
  { id: 'doc-cdr', es: 'Qué hace la reconstrucción', en: 'What reconstruction does' },
  { id: 'doc-ejemplo', es: 'Ejemplo completo', en: 'Full example' },
  { id: 'doc-practicas', es: 'Buenas prácticas', en: 'Best practices' },
  { id: 'doc-admin', es: 'API del dashboard', en: 'Dashboard API' },
];

/**
 * Guía de integración completa de la API pública de Gatekeeper.
 * Los códigos de respuesta salen del mismo catálogo que la consola (api-responses.ts),
 * así la documentación y la consola no pueden contradecirse.
 */
@Component({
  selector: 'gk-docs-page',
  imports: [NgTemplateOutlet, RouterLink],
  templateUrl: './docs-page.html',
  styleUrl: './docs-page.scss',
})
export class DocsPage {
  private readonly preferences = inject(WorkspacePreferences);
  readonly t = (spanish: string, english: string) => this.preferences.text(spanish, english);
  readonly english = computed(() => this.preferences.language() === 'en');

  readonly sections = SECTIONS;
  /** La API vive en el mismo dominio que el dashboard (detrás de Nginx). */
  readonly baseUrl = `${typeof location === 'undefined' ? '' : location.origin}/v1`;

  readonly lang = signal<Lang>('curl');
  readonly copied = signal<string | null>(null);

  readonly uploadResponses = ENDPOINT_RESPONSES['files-upload'] ?? [];
  readonly statusResponses = ENDPOINT_RESPONSES['files-status'] ?? [];
  readonly downloadResponses = ENDPOINT_RESPONSES['files-download'] ?? [];

  when(response: ExampleResponse): string {
    return this.english() ? response.whenEn : response.when;
  }

  json(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }

  tone(code: number): 'ok' | 'warn' | 'error' {
    if (code >= 200 && code < 300) return 'ok';
    if (code >= 400 && code < 500) return 'warn';
    return 'error';
  }

  /** Lleva a la sección sin cambiar de ruta (un href="#…" recargaría la SPA). */
  goTo(id: string): void {
    const target = document.getElementById(id);
    if (!target) return;
    const still =
      this.preferences.reducedMotion() ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  }

  async copy(id: string, text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(id);
      setTimeout(() => this.copied.set(null), 1800);
    } catch {
      this.copied.set(null);
    }
  }

  readonly quickUpload = computed(
    () => `curl -X POST ${this.baseUrl}/files \\
  -H "Authorization: Bearer $GATEKEEPER_API_KEY" \\
  -F "file=@foto.jpg"`,
  );

  readonly quickStatus = computed(
    () => `curl ${this.baseUrl}/files/$ID \\
  -H "Authorization: Bearer $GATEKEEPER_API_KEY"`,
  );

  readonly quickDownload = computed(
    () => `curl ${this.baseUrl}/files/$ID/content \\
  -H "Authorization: Bearer $GATEKEEPER_API_KEY" \\
  -o foto-limpia.jpg`,
  );

  /** Ejemplo completo: subir, esperar el veredicto y descargar solo si quedó limpio. */
  readonly fullExample = computed(() => {
    const base = this.baseUrl;
    const en = this.english();
    switch (this.lang()) {
      case 'ts':
        return `// Node 18+ (fetch y FormData nativos)
import { readFile, writeFile } from 'node:fs/promises';

const API = '${base}';
const headers = { Authorization: \`Bearer \${process.env.GATEKEEPER_API_KEY}\` };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

${en ? '// 1. Upload' : '// 1. Subir'}
const form = new FormData();
form.append('file', new Blob([await readFile('foto.jpg')]), 'foto.jpg');
const upload = await fetch(\`\${API}/files\`, { method: 'POST', headers, body: form });
if (upload.status !== 202) throw new Error(\`${en ? 'Upload failed' : 'Subida fallida'}: \${upload.status}\`);
const { id } = await upload.json();

${en ? '// 2. Wait for the verdict (2 s, then up to 10 s between checks)' : '// 2. Esperar el veredicto (2 s y hasta 10 s entre consultas)'}
let estado = 'pendiente';
for (let wait = 2000; estado === 'pendiente'; wait = Math.min(wait * 1.5, 10000)) {
  await sleep(wait);
  const res = await fetch(\`\${API}/files/\${id}\`, { headers });
  if (res.status === 429) {
    await sleep(Number(res.headers.get('Retry-After') ?? 5) * 1000);
    continue;
  }
  ({ estado } = await res.json());
}

${en ? '// 3. Download only the reconstructed copy' : '// 3. Descargar solo la copia reconstruida'}
if (estado === 'limpio') {
  const copy = await fetch(\`\${API}/files/\${id}/content\`, { headers });
  await writeFile('foto-limpia.jpg', Buffer.from(await copy.arrayBuffer()));
} else {
  console.warn(\`${en ? 'File not delivered' : 'Archivo no entregado'}: \${estado}\`);
}`;
      case 'python':
        return `# pip install requests
import os, time, requests

API = "${base}"
headers = {"Authorization": f"Bearer {os.environ['GATEKEEPER_API_KEY']}"}

${en ? '# 1. Upload' : '# 1. Subir'}
with open("foto.jpg", "rb") as f:
    upload = requests.post(f"{API}/files", headers=headers, files={"file": f}, timeout=70)
upload.raise_for_status()  # ${en ? 'expects 202' : 'espera 202'}
file_id = upload.json()["id"]

${en ? '# 2. Wait for the verdict (2 s, then up to 10 s between checks)' : '# 2. Esperar el veredicto (2 s y hasta 10 s entre consultas)'}
estado, wait = "pendiente", 2.0
while estado == "pendiente":
    time.sleep(wait)
    wait = min(wait * 1.5, 10)
    res = requests.get(f"{API}/files/{file_id}", headers=headers, timeout=10)
    if res.status_code == 429:
        time.sleep(int(res.headers.get("Retry-After", 5)))
        continue
    res.raise_for_status()
    estado = res.json()["estado"]

${en ? '# 3. Download only the reconstructed copy' : '# 3. Descargar solo la copia reconstruida'}
if estado == "limpio":
    copy = requests.get(f"{API}/files/{file_id}/content", headers=headers, timeout=30)
    copy.raise_for_status()
    with open("foto-limpia.jpg", "wb") as out:
        out.write(copy.content)
else:
    print(f"${en ? 'File not delivered' : 'Archivo no entregado'}: {estado}")`;
      default:
        return `# ${en ? 'Requires curl and jq' : 'Requiere curl y jq'}
API="${base}"
AUTH="Authorization: Bearer $GATEKEEPER_API_KEY"

${en ? '# 1. Upload' : '# 1. Subir'}
ID=$(curl -sf -X POST "$API/files" -H "$AUTH" -F "file=@foto.jpg" | jq -r .id)

${en ? '# 2. Wait for the verdict' : '# 2. Esperar el veredicto'}
ESTADO=pendiente
while [ "$ESTADO" = pendiente ]; do
  sleep 2
  ESTADO=$(curl -sf "$API/files/$ID" -H "$AUTH" | jq -r .estado)
done

${en ? '# 3. Download only the reconstructed copy' : '# 3. Descargar solo la copia reconstruida'}
if [ "$ESTADO" = limpio ]; then
  curl -sf "$API/files/$ID/content" -H "$AUTH" -o foto-limpia.jpg
else
  echo "${en ? 'File not delivered' : 'Archivo no entregado'}: $ESTADO"
fi`;
    }
  });
}
