import { toFileRecord } from '../api/backend-adapter';
import { HOSTILE_FILENAMES } from './hostile-filenames';
import { createMockDb, isDisclosedRow, toArchivoDto } from './mock-db';

describe('mock-db', () => {
  const db = createMockDb();
  const appName = (id: string) => db.apps.find((a) => a.id === id)?.nombre ?? '';

  it('tiene 250 archivos, 3 apps, 40 eventos de auditoría y 6 API keys', () => {
    expect(db.files.length).toBe(250);
    expect(db.apps.map((a) => a.nombre)).toEqual([
      'Portal Escolar',
      'App Pagos PyME',
      'RH Reclutamiento',
    ]);
    expect(db.audit.length).toBe(40);
    expect(db.apiKeys.length).toBe(6);
    expect(db.apiKeys.filter((k) => k.revocada_en !== null).length).toBe(1);
  });

  it('es determinista con la misma semilla', () => {
    expect(createMockDb(11)).toEqual(createMockDb(11));
  });

  it('respeta las restricciones del backend', () => {
    for (const f of db.files) {
      expect(f.tamano_bytes).toBeGreaterThanOrEqual(1);
      expect(f.tamano_bytes).toBeLessThanOrEqual(10 * 1024 * 1024);
      expect(f.sha256).toMatch(/^[0-9a-f]{64}$/);
      if (f.estado === 'limpio') {
        expect(['image/jpeg', 'image/png', 'application/pdf']).toContain(f.tipo_detectado);
      }
    }
    for (const k of db.apiKeys) expect(k.prefijo).toMatch(/^gk_[0-9a-f]{12}$/);
  });

  it('cada fixture hostil está en al menos un archivo en cuarentena y solo en archivos con detalle (K20)', () => {
    expect(HOSTILE_FILENAMES.length).toBe(12);
    expect(HOSTILE_FILENAMES).toContain('\u202Egnp.exe');
    for (const name of HOSTILE_FILENAMES) {
      const rows = db.files.filter((f) => f.nombre_original === name);
      expect(rows.length, name).toBeGreaterThanOrEqual(2);
      expect(
        rows.some((f) => f.estado === 'en_cuarentena'),
        name,
      ).toBe(true);
      expect(rows.every(isDisclosedRow), name).toBe(true);
    }
  });

  it('la proyección a DTO solo trae nombre, hash y resultados cuando K20 lo permite', () => {
    for (const row of db.files) {
      const dto = toArchivoDto(row, appName(row.aplicacion_id));
      const disclosed = isDisclosedRow(row);
      expect('nombre_original' in dto).toBe(disclosed);
      expect('sha256' in dto).toBe(disclosed);
      expect('resultados' in dto).toBe(disclosed);
      expect(toFileRecord(dto).disclosure).toBe(disclosed ? 'full' : 'restricted');
    }
  });

  it('los 15 vectores de la matriz tienen al menos un registro', () => {
    expect(db.vectors.map((v) => v.vector)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    const allFileIds = new Set([...db.files, ...db.foreignFiles].map((f) => f.id));
    const eventIds = new Set(db.events.map((e) => e.id));
    for (const v of db.vectors) {
      const records = v.fileIds.length + v.eventIds.length + (v.edge ? 1 : 0);
      expect(records, `vector ${v.vector}`).toBeGreaterThan(0);
      v.fileIds.forEach((id) => expect(allFileIds.has(id)).toBe(true));
      v.eventIds.forEach((id) => expect(eventIds.has(id)).toBe(true));
    }
  });

  it('los archivos del vector 13 son de una aplicación ajena a la sesión', () => {
    const idor = db.vectors.find((v) => v.vector === 13);
    expect(idor?.fileIds.length).toBeGreaterThan(0);
    for (const id of idor?.fileIds ?? []) {
      expect(db.files.some((f) => f.id === id)).toBe(false);
      expect(db.foreignFiles.find((f) => f.id === id)?.aplicacion_id).toBe(db.foreignApp.id);
    }
  });

  it('los eventos solo traen nombre de archivo en malware (K20)', () => {
    for (const e of db.events) {
      if (e.nombre_archivo !== undefined) expect(e.tipo).toBe('malware_detectado');
    }
    expect(db.events.some((e) => e.tipo === 'limite_tasa')).toBe(true);
  });
});
