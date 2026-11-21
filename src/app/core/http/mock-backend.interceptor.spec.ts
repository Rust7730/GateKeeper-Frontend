import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';

import { AdminFilesApi } from '../api/admin-files.api';
import { ApiKeysApi } from '../api/api-keys.api';
import { AuditApi } from '../api/audit.api';
import { MetricsApi } from '../api/metrics.api';
import { HOSTILE_FILENAMES } from '../mocks/hostile-filenames';
import { MOCK_BACKEND_STATE, MockBackendState } from '../mocks/mock-backend-state';
import { randomLatency, relativePath } from './mock-backend.interceptor';
import { provideApi } from './provide-api';

async function httpError(source: Observable<unknown>): Promise<HttpErrorResponse> {
  try {
    await firstValueFrom(source);
  } catch (error) {
    if (error instanceof HttpErrorResponse) return error;
    throw error;
  }
  throw new Error('se esperaba un error HTTP');
}

describe('mockBackendInterceptor', () => {
  let files: AdminFilesApi;
  let state: MockBackendState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideApi({ useMocks: true, apiBaseUrl: '/v1' }), provideHttpClientTesting()],
    });
    files = TestBed.inject(AdminFilesApi);
    state = TestBed.inject(MOCK_BACKEND_STATE);
    state.reset();
    state.latency = { min: 0, max: 0 };
  });

  describe('paginación y filtros', () => {
    it('pagina los 250 archivos', async () => {
      const first = await firstValueFrom(files.list({ page: 1, pageSize: 20 }));
      expect(first.items.length).toBe(20);
      expect(first.total).toBe(250);
      const last = await firstValueFrom(files.list({ page: 13, pageSize: 20 }));
      expect(last.items.length).toBe(10);
      const beyond = await firstValueFrom(files.list({ page: 14, pageSize: 20 }));
      expect(beyond.items.length).toBe(0);
    });

    it('ordena por fecha de creación descendente por defecto', async () => {
      const page = await firstValueFrom(files.list({ page: 1, pageSize: 50 }));
      const dates = page.items.map((f) => f.createdAt ?? '');
      expect(dates).toEqual([...dates].sort().reverse());
    });

    it('filtra por estado y por aplicación', async () => {
      const quarantined = await firstValueFrom(
        files.list({ page: 1, pageSize: 100, status: ['quarantined'] }),
      );
      expect(quarantined.total).toBe(
        state.db.files.filter((f) => f.estado === 'en_cuarentena').length,
      );
      expect(
        quarantined.items.every((f) => f.status === 'quarantined' && f.disclosure === 'full'),
      ).toBe(true);

      const app = state.db.apps[1];
      const byApp = await firstValueFrom(files.list({ page: 1, pageSize: 100, appId: app.id }));
      expect(byApp.items.every((f) => f.appId === app.id && f.appName === app.nombre)).toBe(true);
    });

    it('la primera página de cuarentena muestra todos los fixtures hostiles', async () => {
      const page = await firstValueFrom(
        files.list({ page: 1, pageSize: 50, status: ['quarantined'] }),
      );
      const names = page.items.map((f) => (f.disclosure === 'full' ? f.originalName : null));
      for (const name of HOSTILE_FILENAMES) expect(names, name).toContain(name);
    });

    it('la búsqueda por nombre solo encuentra archivos con detalle (K20)', async () => {
      const restricted = state.db.files.find((f) => f.nombre_original === 'avatar.jpg');
      expect(restricted).toBeDefined();
      const page = await firstValueFrom(files.list({ page: 1, pageSize: 100, q: 'avatar.jpg' }));
      expect(page.items.some((f) => f.id === restricted?.id)).toBe(false);

      const byId = await firstValueFrom(
        files.list({ page: 1, pageSize: 100, q: restricted?.id.slice(0, 8) }),
      );
      expect(byId.items.some((f) => f.id === restricted?.id)).toBe(true);
    });

    it('rechaza un tamaño de página fuera de rango con 400', async () => {
      const error = await httpError(files.list({ page: 1, pageSize: 1000 }));
      expect(error.status).toBe(400);
    });
  });

  describe('detalle e IDOR (vector 13)', () => {
    it('devuelve el detalle completo de un archivo en cuarentena', async () => {
      const row = state.db.files.find((f) => f.estado === 'en_cuarentena');
      const file = await firstValueFrom(files.get(row?.id ?? ''));
      expect(file.disclosure).toBe('full');
    });

    it('un archivo de otra aplicación responde 404 igual que uno inexistente', async () => {
      const foreign = state.db.foreignFiles[0];
      const idor = await httpError(files.get(foreign.id));
      const missing = await httpError(files.get('00000000-0000-4000-8000-000000000000'));
      expect(idor.status).toBe(404);
      expect(missing.status).toBe(404);
      expect(idor.error).toEqual(missing.error);
    });

    it('un archivo de otra aplicación no aparece en la lista', async () => {
      const page = await firstValueFrom(
        files.list({ page: 1, pageSize: 100, appId: state.db.foreignApp.id }),
      );
      expect(page.items.length).toBe(0);
    });
  });

  describe('liberación', () => {
    const reason = 'Falso positivo confirmado con el proveedor';

    it('libera un archivo en cuarentena y lo registra en auditoría', async () => {
      const row = state.db.files.find(
        (f) => f.estado === 'en_cuarentena' && f.tipo_detectado === 'application/pdf',
      );
      const before = state.db.audit.length;
      const file = await firstValueFrom(files.release(row?.id ?? '', reason));
      expect(file.status).toBe('clean');
      expect(state.db.audit.length).toBe(before + 1);
      expect(state.db.audit[0]).toMatchObject({ accion: 'liberar_archivo', motivo: reason });
    });

    it('409 si el archivo ya no está en cuarentena', async () => {
      const row = state.db.files.find((f) => f.estado === 'limpio');
      expect((await httpError(files.release(row?.id ?? '', reason))).status).toBe(409);
    });

    it('400 si el motivo tiene menos de 20 caracteres', async () => {
      const row = state.db.files.find((f) => f.estado === 'en_cuarentena');
      expect((await httpError(files.release(row?.id ?? '', 'corto'))).status).toBe(400);
    });

    it('403 para un analista', async () => {
      state.role = 'analyst';
      const row = state.db.files.find((f) => f.estado === 'en_cuarentena');
      expect((await httpError(files.release(row?.id ?? '', reason))).status).toBe(403);
    });
  });

  describe('errores simulados', () => {
    it('401 con la sesión expirada', async () => {
      state.sessionExpired = true;
      expect((await httpError(files.list({ page: 1, pageSize: 10 }))).status).toBe(401);
    });

    it('403 en auditoría y API keys para un analista', async () => {
      state.role = 'analyst';
      expect(
        (await httpError(TestBed.inject(AuditApi).list({ page: 1, pageSize: 10 }))).status,
      ).toBe(403);
      expect((await httpError(TestBed.inject(ApiKeysApi).list())).status).toBe(403);
    });

    for (const status of [401, 423, 500]) {
      it(`fuerza un ${status} en la siguiente petición y luego se recupera`, async () => {
        state.failNext({ status });
        expect((await httpError(files.list({ page: 1, pageSize: 10 }))).status).toBe(status);
        expect((await firstValueFrom(files.list({ page: 1, pageSize: 10 }))).items.length).toBe(10);
      });
    }

    it('429 trae Retry-After', async () => {
      state.failNext({ status: 429, pathPrefix: '/admin/files' });
      const error = await httpError(files.list({ page: 1, pageSize: 10 }));
      expect(error.status).toBe(429);
      expect(error.headers.get('Retry-After')).toBe('30');
    });

    it('un error forzado con prefijo no afecta otras rutas', async () => {
      state.failNext({ status: 500, pathPrefix: '/admin/audit' });
      await expect(firstValueFrom(files.list({ page: 1, pageSize: 5 }))).resolves.toBeTruthy();
      expect(
        (await httpError(TestBed.inject(AuditApi).list({ page: 1, pageSize: 5 }))).status,
      ).toBe(500);
    });

    it('una ruta desconocida responde 404', async () => {
      const error = await httpError(TestBed.inject(HttpClient).get('/v1/admin/no-existe'));
      expect(error.status).toBe(404);
    });
  });

  describe('otros recursos', () => {
    it('métricas por periodo', async () => {
      const metrics = await firstValueFrom(TestBed.inject(MetricsApi).get('30d'));
      expect(metrics.period).toBe('30d');
      expect(metrics.totals.processed).toBeGreaterThan(0);
      expect(metrics.byLayer.length).toBeGreaterThan(0);
      expect(metrics.byLayer.some((l) => l.layer === 'unknown')).toBe(false);
    });

    it('auditoría paginada con motivos hostiles como texto', async () => {
      const page = await firstValueFrom(TestBed.inject(AuditApi).list({ page: 1, pageSize: 40 }));
      expect(page.total).toBe(40);
      expect(page.items.some((e) => e.reason?.startsWith('='))).toBe(true);
    });

    it('API keys: crea (secreto una vez) y revoca; revocar dos veces da 409', async () => {
      const keys = TestBed.inject(ApiKeysApi);
      expect((await firstValueFrom(keys.list())).length).toBe(6);
      const created = await firstValueFrom(keys.create(state.db.apps[0].id));
      expect(created.secret.length).toBeGreaterThan(0);
      expect(created.prefix).toMatch(/^gk_[0-9a-f]{12}$/);
      await firstValueFrom(keys.revoke(created.id));
      expect((await httpError(keys.revoke(created.id))).status).toBe(409);
      expect((await httpError(keys.create(state.db.foreignApp.id))).status).toBe(404);
    });
  });

  it('deja pasar las peticiones que no van a la API', () => {
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    http.get('/assets/datos.json').subscribe();
    controller.expectOne('/assets/datos.json').flush({});
    controller.verify();
  });
});

describe('utilidades del mock', () => {
  it('la latencia queda entre 200 y 800 ms', () => {
    const range = { min: 200, max: 800 };
    expect(randomLatency(range, () => 0)).toBe(200);
    expect(randomLatency(range, () => 0.999999)).toBe(800);
    for (let i = 0; i < 50; i++) {
      const ms = randomLatency(range);
      expect(ms).toBeGreaterThanOrEqual(200);
      expect(ms).toBeLessThanOrEqual(800);
    }
  });

  it('calcula la ruta relativa a la raíz de la API', () => {
    expect(relativePath('/v1/admin/files', '/v1')).toBe('/admin/files');
    expect(relativePath('/v1', '/v1/')).toBe('/');
    expect(relativePath('/v10/admin', '/v1')).toBeNull();
    expect(relativePath('/assets/x.json', '/v1')).toBeNull();
    expect(relativePath('https://api.test/v1/admin/audit', 'https://api.test/v1')).toBe(
      '/admin/audit',
    );
  });
});
