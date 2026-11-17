import { InvalidPathSegmentError, apiUrl } from './api-config';

const ABS = 'https://api.gatekeeper.test/v1';

/** Ruta que resolvería el navegador (resuelve `.` y `..`, como hace fetch/XHR). */
const resolved = (url: string) => new URL(url, 'http://localhost').pathname;

describe('apiUrl', () => {
  it('une la raíz y los segmentos', () => {
    expect(apiUrl(`${ABS}/`, 'admin', 'files')).toBe(`${ABS}/admin/files`);
    expect(resolved(apiUrl('/v1', 'admin', 'files'))).toBe('/v1/admin/files');
  });

  for (const segment of ['', '.', '..']) {
    it(`lanza un error con el segmento ${JSON.stringify(segment)}`, () => {
      expect(() => apiUrl(ABS, 'admin', 'files', segment)).toThrow(InvalidPathSegmentError);
      expect(() => apiUrl(ABS, 'admin', 'files', segment, 'release')).toThrow(
        InvalidPathSegmentError,
      );
    });
  }

  it('un segmento hostil no cambia la ruta resuelta por el navegador', () => {
    const hostile = ['../audit', '..\\audit', 'a/b', '%2e%2e', '%2E%2E%2Faudit', '?x=1', '#frag'];
    for (const base of [ABS, '/v1']) {
      for (const id of hostile) {
        const path = resolved(apiUrl(base, 'admin', 'files', id, 'release'));
        const parts = path.split('/');
        expect(parts.slice(0, 4), id).toEqual(['', 'v1', 'admin', 'files']);
        expect(parts.length, id).toBe(6);
        expect(parts[5], id).toBe('release');
      }
    }
  });
});
