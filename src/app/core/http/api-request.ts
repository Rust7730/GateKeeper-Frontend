import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

import { API_BASE_URL } from '../api/api-config';

/**
 * Ruta de `url` relativa a la raíz de la API, o `null` si la petición no va a la API.
 * Compara origen y ruta ya resueltos con `URL`: `//otro.test/v1`, `/v1/../x` o un
 * `apiBaseUrl` absoluto de otro origen no se confunden con la API.
 */
export function apiPathOf(url: string, base: string, baseUri: string): string | null {
  let target: URL;
  let root: URL;
  try {
    target = new URL(url, baseUri);
    root = new URL(base, baseUri);
  } catch {
    return null;
  }
  if (target.origin !== root.origin) return null;
  const rootPath = root.pathname.replace(/\/+$/, '');
  if (target.pathname === rootPath) return '/';
  if (!target.pathname.startsWith(`${rootPath}/`)) return null;
  return target.pathname.slice(rootPath.length);
}

/** `apiPathOf` con la raíz y el documento inyectados (solo en contexto de inyección). */
export function injectApiPath(): (url: string) => string | null {
  const base = inject(API_BASE_URL);
  const document = inject(DOCUMENT);
  return (url) => apiPathOf(url, base, document.baseURI);
}

/** Rutas de `/v1/auth/*`: usan la cookie de refresh y nunca llevan Bearer. */
export const isAuthPath = (path: string | null): boolean =>
  path !== null && (path === '/auth' || path.startsWith('/auth/'));
