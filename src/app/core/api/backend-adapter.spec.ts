import { FileRecord } from '../models/file.model';
import { ArchivoDto, MotivoDto } from './backend.dto';
import {
  InvalidDtoError,
  MAPPINGS,
  isDisclosable,
  toApiKey,
  toApiKeyCreated,
  toAuditEntry,
  toFileQueryParams,
  toFileRecord,
  toMetrics,
  toPage,
  toSecurityEvent,
} from './backend-adapter';

const ID = '3f2b8c1e-9a4d-4e6f-8b1a-2c3d4e5f6a7b';
const APP = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const SHA = 'a'.repeat(64);
const NAME = '<script>alert(1)</script>.jpg';

function dto(overrides: Partial<Record<keyof ArchivoDto, unknown>> = {}): Record<string, unknown> {
  return {
    id: ID,
    aplicacion_id: APP,
    aplicacion_nombre: 'Portal Escolar',
    estado: 'limpio',
    tipo_detectado: 'image/jpeg',
    tamano_bytes: 2048,
    creado_en: '2026-11-17T10:00:00Z',
    analizado_en: '2026-11-17T10:00:05Z',
    ...overrides,
  };
}

const result = (
  capa: string,
  veredicto: string,
  detalle: Record<string, unknown> = {},
): Record<string, unknown> => ({ capa, veredicto, detalle, duracion_ms: 10 });

function disclosed(record: FileRecord) {
  if (record.disclosure !== 'full') throw new Error('se esperaba detalle completo');
  return record;
}

describe('backend-adapter · archivos', () => {
  it('mapea cada estado del backend', () => {
    const expected = {
      pendiente: 'pending',
      limpio: 'clean',
      en_cuarentena: 'quarantined',
      rechazado: 'rejected',
      error: 'error',
    } as const;
    for (const [estado, status] of Object.entries(expected)) {
      expect(toFileRecord(dto({ estado })).status).toBe(status);
    }
    expect(MAPPINGS.status).toEqual(expected);
  });

  it('mapea cada capa y cada veredicto en los resultados', () => {
    const layers = { firma: 'signature', cdr: 'cdr', clamav: 'clamav', virustotal: 'virustotal' };
    const outcomes = {
      limpio: 'passed',
      malicioso: 'failed',
      rechazado: 'failed',
      error: 'failed',
      no_evaluada: 'not_evaluated',
    };
    for (const [capa, layer] of Object.entries(layers)) {
      for (const [veredicto, outcome] of Object.entries(outcomes)) {
        const file = disclosed(
          toFileRecord(dto({ estado: 'en_cuarentena', resultados: [result(capa, veredicto)] })),
        );
        expect(file.layers[0].layer).toBe(layer);
        expect(file.layers[0].outcome).toBe(outcome);
      }
    }
  });

  it('mapea cada motivo a su RejectionReason y a la capa que bloqueó', () => {
    const reasons: Record<MotivoDto, string> = {
      tipo_no_permitido: 'type_not_allowed',
      pixeles: 'pixel_limit',
      imagen_invalida: 'invalid_image',
      paginas: 'page_limit',
      cifrado: 'encrypted',
      pdf_cifrado: 'encrypted',
      pdf_invalido: 'invalid_pdf',
      descompresion: 'decompression_limit',
      salida_grande: 'output_too_large',
      escaneos: 'scan_limit',
      flujo_invalido: 'invalid_stream',
      timeout: 'timeout',
      interno: 'internal',
    };
    const blockedBy: Record<MotivoDto, string> = {
      tipo_no_permitido: 'whitelist',
      pixeles: 'pixel_limit',
      imagen_invalida: 'cdr',
      paginas: 'size_limit',
      cifrado: 'encrypted_pdf',
      pdf_cifrado: 'encrypted_pdf',
      pdf_invalido: 'cdr',
      descompresion: 'size_limit',
      salida_grande: 'size_limit',
      escaneos: 'cdr',
      flujo_invalido: 'cdr',
      timeout: 'cdr', // sin capa propia: usa la del resultado
      interno: 'cdr',
    };
    for (const motivo of Object.keys(reasons) as MotivoDto[]) {
      const veredicto = motivo === 'timeout' || motivo === 'interno' ? 'error' : 'rechazado';
      const file = disclosed(
        toFileRecord(
          dto({ estado: 'en_cuarentena', resultados: [result('cdr', veredicto, { motivo })] }),
        ),
      );
      expect(file.reason).toBe(reasons[motivo]);
      expect(file.layers[0].reason).toBe(reasons[motivo]);
      expect(file.blockedBy).toBe(blockedBy[motivo]);
    }
    expect(Object.keys(MAPPINGS.blockedBy).sort()).toEqual(Object.keys(reasons).sort());
  });

  it('tipo no permitido: bloquea la firma y el motivo sale del CDR (forma real del backend)', () => {
    const file = disclosed(
      toFileRecord(
        dto({
          estado: 'en_cuarentena',
          resultados: [
            result('firma', 'rechazado', { tipo: 'text/plain' }),
            result('cdr', 'no_evaluada', { motivo: 'tipo_no_permitido' }),
          ],
        }),
      ),
    );
    expect(file.blockedBy).toBe('signature');
    expect(file.reason).toBe('type_not_allowed');
  });

  it('el malware manda sobre el rechazo y trae firma y conteo de VirusTotal', () => {
    const file = disclosed(
      toFileRecord(
        dto({
          estado: 'rechazado',
          nombre_original: NAME,
          sha256: SHA,
          resultados: [
            result('firma', 'limpio', { tipo: 'image/jpeg' }),
            result('clamav', 'malicioso', { firma: 'Eicar-Test-Signature' }),
            result('virustotal', 'malicioso', { positivos: 62, total: 70 }),
            result('cdr', 'rechazado', { motivo: 'pixeles' }),
          ],
        }),
      ),
    );
    expect(file.malwareDetected).toBe(true);
    expect(file.blockedBy).toBe('clamav');
    expect(file.originalName).toBe(NAME);
    expect(file.sha256).toBe(SHA);
    expect(file.layers[1].signature).toBe('Eicar-Test-Signature');
    expect(file.layers[2].vtDetections).toEqual({ positives: 62, total: 70 });
  });

  it('un veredicto limpio con motivo "ok" no tiene motivo', () => {
    const file = disclosed(
      toFileRecord(
        dto({
          estado: 'en_cuarentena',
          resultados: [result('cdr', 'limpio', { motivo: 'ok' })],
        }),
      ),
    );
    expect(file.layers[0].reason).toBeNull();
    expect(file.blockedBy).toBeNull();
  });
});

describe('backend-adapter · K20 falla cerrado', () => {
  const leaky = {
    nombre_original: NAME,
    sha256: SHA,
    cuarentena_expira_en: '2026-12-17T10:00:00Z',
    resultados: [result('cdr', 'rechazado', { motivo: 'pixeles' })],
  };

  for (const estado of ['limpio', 'rechazado', 'pendiente', 'error', 'estado_nuevo']) {
    it(`descarta nombre, hash y capas de un archivo "${estado}" sin malware`, () => {
      const file = toFileRecord(dto({ estado, ...leaky }));
      expect(file.disclosure).toBe('restricted');
      expect('originalName' in file).toBe(false);
      expect('sha256' in file).toBe(false);
      expect('layers' in file).toBe(false);
      expect('quarantineExpiresAt' in file).toBe(false);
      expect(JSON.stringify(file)).not.toContain('script');
      expect(JSON.stringify(file)).not.toContain(SHA);
      expect(Object.keys(file).sort()).toEqual(
        [
          'analyzedAt',
          'appId',
          'appName',
          'createdAt',
          'detectedType',
          'disclosure',
          'id',
          'sizeBytes',
          'status',
        ].sort(),
      );
    });
  }

  it('abre el detalle solo en cuarentena o con malware', () => {
    expect(isDisclosable('quarantined', false)).toBe(true);
    expect(isDisclosable('rejected', true)).toBe(true);
    for (const status of ['clean', 'rejected', 'pending', 'error', 'unknown'] as const) {
      expect(isDisclosable(status, false)).toBe(false);
    }
  });

  it('un veredicto desconocido no cuenta como malware', () => {
    const file = toFileRecord(
      dto({ estado: 'rechazado', ...leaky, resultados: [result('clamav', 'sospechoso')] }),
    );
    expect(file.disclosure).toBe('restricted');
  });

  it('el compilador no deja leer el nombre sin hacer narrowing', () => {
    const file: FileRecord = toFileRecord(dto());
    // @ts-expect-error K20: originalName no existe en RestrictedFile
    expect(file.originalName).toBeUndefined();
    // @ts-expect-error K20: sha256 no existe en RestrictedFile
    expect(file.sha256).toBeUndefined();
  });
});

describe('backend-adapter · valores desconocidos', () => {
  it('estado, capa, veredicto y motivo desconocidos caen en "unknown"', () => {
    expect(toFileRecord(dto({ estado: 'borrado' })).status).toBe('unknown');
    expect(toFileRecord(dto({ estado: 42 })).status).toBe('unknown');
    const file = disclosed(
      toFileRecord(
        dto({
          estado: 'en_cuarentena',
          resultados: [result('yara', 'sospechoso', { motivo: 'motivo_nuevo' })],
        }),
      ),
    );
    expect(file.layers[0]).toMatchObject({
      layer: 'unknown',
      outcome: 'unknown',
      reason: 'unknown',
    });
  });

  it('claves del prototipo no resuelven a nada', () => {
    for (const evil of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
      expect(toFileRecord(dto({ estado: evil })).status).toBe('unknown');
      const file = disclosed(
        toFileRecord(
          dto({ estado: 'en_cuarentena', resultados: [result(evil, evil, { motivo: evil })] }),
        ),
      );
      expect(file.layers[0]).toMatchObject({
        layer: 'unknown',
        outcome: 'unknown',
        reason: 'unknown',
      });
    }
  });

  it('un motivo desconocido usa la capa del resultado como blockedBy', () => {
    const file = disclosed(
      toFileRecord(
        dto({
          estado: 'en_cuarentena',
          resultados: [result('cdr', 'rechazado', { motivo: 'motivo_nuevo' })],
        }),
      ),
    );
    expect(file.blockedBy).toBe('cdr');
    expect(file.reason).toBe('unknown');
  });

  it('las fechas salen normalizadas a ISO, nunca el texto que aceptó Date.parse', () => {
    const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    const hostile = '2026-01-01 (<img src=x onerror=alert(1)>)';
    expect(Number.isFinite(Date.parse(hostile))).toBe(true); // V8 lo acepta
    const file = toFileRecord(dto({ creado_en: hostile, analizado_en: '2026-11-17T10:00:05Z' }));
    expect(file.createdAt).toMatch(ISO);
    expect(file.createdAt).not.toContain('<');
    expect(file.analyzedAt).toBe('2026-11-17T10:00:05.000Z');

    const entry = toAuditEntry({
      id: ID,
      actor: { id: APP, correo: 'a', rol: 'admin' },
      accion: 'inicio_sesion',
      en: hostile,
    });
    expect(entry.at).toMatch(ISO);
  });

  it('no deja pasar texto crudo en tipo, hash, firma ni fechas', () => {
    const file = disclosed(
      toFileRecord(
        dto({
          estado: 'en_cuarentena',
          tipo_detectado: '<img src=x onerror=alert(1)>',
          sha256: 'no-es-un-hash',
          creado_en: 'ayer',
          tamano_bytes: -5,
          resultados: [result('clamav', 'malicioso', { firma: '<b>Troyano</b> grave' })],
        }),
      ),
    );
    expect(file.detectedType).toBe('unknown');
    expect(file.sha256).toBeNull();
    expect(file.createdAt).toBeNull();
    expect(file.sizeBytes).toBeNull();
    expect(file.layers[0].signature).toBeNull();
    expect(toFileRecord(dto({ tipo_detectado: null })).detectedType).toBeNull();
  });

  it('un DTO sin id válido lanza InvalidDtoError y la página lo omite', () => {
    expect(() => toFileRecord(dto({ id: '../../etc/passwd' }))).toThrow(InvalidDtoError);
    expect(() => toFileRecord('texto')).toThrow(InvalidDtoError);
    const page = toPage(
      { elementos: [dto(), dto({ id: 'x' }), null], pagina: 2, tamano_pagina: 25, total: 51 },
      toFileRecord,
    );
    expect(page.items.length).toBe(1);
    expect(page).toMatchObject({ page: 2, pageSize: 25, total: 51 });
  });
});

describe('backend-adapter · consultas', () => {
  it('traduce el FileQuery a parámetros del backend', () => {
    expect(
      toFileQueryParams({
        status: ['quarantined', 'rejected'],
        appId: APP,
        from: '2026-11-01',
        to: '2026-11-17',
        q: 'factura',
        sort: 'sizeBytes',
        dir: 'asc',
        page: 3,
        pageSize: 50,
      }),
    ).toEqual({
      estado: ['en_cuarentena', 'rechazado'],
      aplicacion_id: APP,
      desde: '2026-11-01',
      hasta: '2026-11-17',
      q: 'factura',
      orden: 'tamano_bytes',
      dir: 'asc',
      pagina: '3',
      tamano_pagina: '50',
    });
  });
});

describe('backend-adapter · otros recursos', () => {
  it('evento: el nombre solo se conserva en malware o liberación (K20)', () => {
    const base = {
      id: ID,
      severidad: 'critica',
      archivo_id: ID,
      aplicacion_nombre: 'X',
      nombre_archivo: NAME,
      en: '2026-11-17T10:00:00Z',
    };
    expect(toSecurityEvent({ ...base, tipo: 'malware_detectado' }).fileName).toBe(NAME);
    expect(toSecurityEvent({ ...base, tipo: 'archivo_liberado' }).fileName).toBe(NAME);
    expect(toSecurityEvent({ ...base, tipo: 'rechazo_politica' }).fileName).toBeNull();
    const unknown = toSecurityEvent({ ...base, tipo: 'nuevo', severidad: 'extrema' });
    expect(unknown).toMatchObject({ type: 'unknown', severity: 'unknown', fileName: null });
  });

  it('auditoría: rol y acción desconocidos caen en "unknown"; el motivo hostil se conserva como texto', () => {
    const entry = toAuditEntry({
      id: ID,
      actor: { id: APP, correo: 'admin@gatekeeper.test', rol: 'root' },
      accion: 'borrar_todo',
      recurso: null,
      motivo: '=HYPERLINK("http://evil.test")',
      ip: '<script>',
      en: '2026-11-17T10:00:00Z',
    });
    expect(entry.actor.role).toBe('unknown');
    expect(entry.action).toBe('unknown');
    expect(entry.reason).toBe('=HYPERLINK("http://evil.test")');
    expect(entry.ip).toBeNull();
    expect(
      toAuditEntry({
        ...entry,
        id: ID,
        actor: { id: APP, correo: 'a', rol: 'analista' },
        accion: 'liberar_archivo',
        en: '2026-11-17T10:00:00Z',
      }),
    ).toMatchObject({ actor: { role: 'analyst' }, action: 'release_file' });
  });

  it('API key: valida el prefijo, deriva el estado y exige el secreto al crear', () => {
    const key = {
      id: ID,
      aplicacion_id: APP,
      aplicacion_nombre: 'App Pagos PyME',
      prefijo: 'gk_0123456789ab',
      creada_en: '2026-11-01T00:00:00Z',
      ultimo_uso_en: null,
      revocada_en: null,
    };
    expect(toApiKey(key)).toMatchObject({ prefix: 'gk_0123456789ab', status: 'active' });
    expect(toApiKey({ ...key, prefijo: '<b>', revocada_en: 'x' })).toMatchObject({
      prefix: null,
      status: 'revoked',
    });
    expect(toApiKeyCreated({ ...key, secreto: 's3cr3t' }).secret).toBe('s3cr3t');
    expect(() => toApiKeyCreated(key)).toThrow(InvalidDtoError);
  });

  it('métricas: mapea totales y capas (motivo primero, luego capa)', () => {
    const metrics = toMetrics({
      periodo: '24h',
      totales: {
        pendiente: 1,
        limpio: 2,
        en_cuarentena: 3,
        rechazado: 4,
        error: 5,
        procesados: 14,
      },
      amenazas_por_dia: [{ fecha: '2026-11-17', bloqueados: 4, en_cuarentena: 3 }],
      por_capa: [
        { capa: 'cdr', motivo: 'pixeles', total: 2 },
        { capa: 'clamav', motivo: null, total: 3 },
        { capa: 'nueva', motivo: null, total: 1 },
      ],
      top_apps: [{ aplicacion_id: APP, aplicacion_nombre: 'RH Reclutamiento', bloqueados: 7 }],
    });
    expect(metrics.period).toBe('24h');
    expect(metrics.totals).toEqual({
      pending: 1,
      clean: 2,
      quarantined: 3,
      rejected: 4,
      error: 5,
      processed: 14,
    });
    expect(metrics.byLayer.map((l) => l.layer)).toEqual(['pixel_limit', 'clamav', 'unknown']);
    expect(metrics.topApps[0]).toEqual({ appId: APP, appName: 'RH Reclutamiento', blocked: 7 });
  });
});
