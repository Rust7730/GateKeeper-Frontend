import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { CSRF_HEADER, CsrfToken } from '../auth/csrf';
import { TokenStore } from '../auth/token-store';
import { injectApiPath, isAuthPath } from './api-request';

const BEARER_AUTH_PATHS = new Set([
  '/auth/me',
  '/auth/admin-check',
  '/auth/totp/enroll',
  '/auth/totp/confirm',
]);

const CSRF_AUTH_PATHS = new Set(['/auth/refresh', '/auth/logout']);

/**
 * Adjunta credenciales solo a peticiones dirigidas a la API de Gatekeeper:
 * - `Authorization: Bearer` en `/v1/admin/*` y rutas autenticadas de `/v1/auth/*`.
 * - `withCredentials: true` + `X-CSRF-Token` en `/v1/auth/refresh` y `/v1/auth/logout`.
 * Nunca envía tokens a orígenes externos (`apiPath === null`).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiPath = injectApiPath()(req.url);
  if (apiPath === null) return next(req);

  const tokens = inject(TokenStore);
  const csrf = inject(CsrfToken);

  if (isAuthPath(apiPath) && !BEARER_AUTH_PATHS.has(apiPath)) {
    const setHeaders: Record<string, string> = {};
    if (CSRF_AUTH_PATHS.has(apiPath) && !req.headers.has(CSRF_HEADER)) {
      const value = csrf.read();
      if (value) setHeaders[CSRF_HEADER] = value;
    }
    return next(req.clone({ withCredentials: true, setHeaders }));
  }

  const token = tokens.accessToken();
  if (!token || req.headers.has('Authorization')) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
