import { HttpErrorResponse } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import { Observable, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

/** Raíz de la API (`environment.apiBaseUrl`). Los servicios arman sus rutas sobre ella. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});

/** Segmento de ruta que cambiaría la ruta resuelta: vacío, `.` o `..`. */
export class InvalidPathSegmentError extends Error {
  constructor() {
    super('Segmento de ruta inválido');
    this.name = 'InvalidPathSegmentError';
  }
}

const DOT_SEGMENTS: ReadonlySet<string> = new Set(['', '.', '..']);

/**
 * Une la raíz con una ruta y codifica cada segmento. `encodeURIComponent` no codifica
 * `.` ni `..`, y el navegador los resuelve (`files/..` acaba en la ruta padre); por eso un
 * segmento vacío, `.` o `..` lanza `InvalidPathSegmentError` en vez de armar la URL.
 * Los servicios validan además que el id sea un UUID antes de llamar aquí.
 */
export function apiUrl(base: string, ...segments: string[]): string {
  if (segments.some((s) => DOT_SEGMENTS.has(s))) throw new InvalidPathSegmentError();
  const root = base.replace(/\/+$/, '');
  return [root, ...segments.map((s) => encodeURIComponent(s))].join('/');
}

/**
 * Respuesta para un id que no es UUID: no se hace la petición y la UI lo trata igual
 * que "no encontrado" (el mismo 404 que un id inexistente o de otra aplicación).
 */
export function invalidIdError(): Observable<never> {
  return throwError(
    () =>
      new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: { detail: 'Not Found' },
      }),
  );
}
