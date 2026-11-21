import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { injectApiPath, isAuthPath } from './api-request';

const RETRIED_AFTER_REFRESH = new HttpContextToken<boolean>(() => false);

/**
 * Ante un 401 en rutas protegidas de la API, intenta refrescar una sola vez el access token
 * (`AuthService.refresh()` deduplica peticiones paralelas, S4) y reintenta la petición.
 * Si el refresh falla, limpia la sesión y redirige a `/login`.
 */
export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const apiPath = injectApiPath()(req.url);
  if (apiPath === null || isAuthPath(apiPath)) {
    return next(req);
  }

  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      if (req.context.get(RETRIED_AFTER_REFRESH)) {
        auth.clearAndRedirect();
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        switchMap((session) =>
          next(
            req.clone({
              context: req.context.set(RETRIED_AFTER_REFRESH, true),
              setHeaders: { Authorization: `Bearer ${session.accessToken}` },
            }),
          ),
        ),
        catchError(() => {
          auth.clearAndRedirect();
          return throwError(() => error);
        }),
      );
    }),
  );
};
