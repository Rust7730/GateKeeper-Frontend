import { HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';

import { AdminFilesApi } from '../api/admin-files.api';
import { ApiKeysApi } from '../api/api-keys.api';
import { ArchivoDto, PaginaDto } from '../api/backend.dto';
import { provideApi } from './provide-api';

const BASE = 'https://api.gatekeeper.test/v1';
const ID = '3f2b8c1e-9a4d-4e6f-8b1a-2c3d4e5f6a7b';

describe('provideApi con useMocks: false', () => {
  let api: AdminFilesApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideApi({ useMocks: false, apiBaseUrl: BASE }), provideHttpClientTesting()],
    });
    api = TestBed.inject(AdminFilesApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('las peticiones van a apiBaseUrl y el adaptador traduce la respuesta', async () => {
    const result = firstValueFrom(api.list({ page: 2, pageSize: 10, status: ['quarantined'] }));
    const req = http.expectOne((r) => r.url === `${BASE}/admin/files`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.getAll('estado')).toEqual(['en_cuarentena']);
    expect(req.request.params.get('pagina')).toBe('2');

    const body: PaginaDto<ArchivoDto> = {
      elementos: [
        {
          id: ID,
          aplicacion_id: ID,
          aplicacion_nombre: 'Portal Escolar',
          estado: 'limpio',
          tipo_detectado: 'image/png',
          tamano_bytes: 10,
          creado_en: '2026-11-17T10:00:00Z',
          analizado_en: null,
          nombre_original: 'no debería verse.png',
        },
      ],
      pagina: 2,
      tamano_pagina: 10,
      total: 11,
    };
    req.flush(body);
    const page = await result;
    expect(page.items[0]).toMatchObject({ status: 'clean', disclosure: 'restricted' });
    expect(JSON.stringify(page)).not.toContain('no debería verse');
  });

  describe('ids que no son UUID: no hay petición y la UI recibe un 404', () => {
    const hostile = ['', '.', '..', '../../admin/audit', '%2e%2e', 'no-es-uuid', `${ID}/..`];

    async function expectNotFound(source: Observable<unknown>): Promise<void> {
      const error = await firstValueFrom(source).then(
        () => null,
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(HttpErrorResponse);
      expect((error as HttpErrorResponse).status).toBe(404);
    }

    for (const id of hostile) {
      it(`AdminFilesApi y ApiKeysApi con ${JSON.stringify(id)}`, async () => {
        const keys = TestBed.inject(ApiKeysApi);
        await expectNotFound(api.get(id));
        await expectNotFound(api.release(id, 'Falso positivo confirmado con el proveedor'));
        await expectNotFound(keys.revoke(id));
        http.expectNone(() => true);
      });
    }
  });

  it('con un UUID válido la ruta resuelta por el navegador es la esperada', () => {
    api.release(ID, 'Falso positivo confirmado con el proveedor').subscribe({
      error: () => undefined,
    });
    TestBed.inject(ApiKeysApi)
      .revoke(ID)
      .subscribe({ error: () => undefined });
    const release = http.expectOne((r) => r.method === 'POST');
    const revoke = http.expectOne((r) => r.method === 'DELETE');
    expect(new URL(release.request.url).pathname).toBe(`/v1/admin/files/${ID}/release`);
    expect(new URL(revoke.request.url).pathname).toBe(`/v1/admin/api-keys/${ID}`);
    release.flush({ detail: 'Conflict' }, { status: 409, statusText: 'Conflict' });
    revoke.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('el motivo de liberación va en el cuerpo, no en la URL (S10)', () => {
    const reason = 'Falso positivo confirmado con el proveedor';
    api.release(ID, reason).subscribe({ error: () => undefined });
    const req = http.expectOne(`${BASE}/admin/files/${ID}/release`);
    expect(req.request.method).toBe('POST');
    expect(req.request.urlWithParams).not.toContain('motivo');
    expect(req.request.body).toEqual({ motivo: reason });
    req.flush({ detail: 'Conflict' }, { status: 409, statusText: 'Conflict' });
  });
});
