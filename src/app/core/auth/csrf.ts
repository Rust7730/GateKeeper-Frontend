import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/** Cookie no HttpOnly con el token double-submit (F5.04). Nombre provisional. */
export const CSRF_COOKIE = 'gk_csrf';
/** Header donde el front devuelve ese token en `/v1/auth/refresh` y `/v1/auth/logout`. */
export const CSRF_HEADER = 'X-CSRF-Token';

const CSRF_VALUE_RE = /^[A-Za-z0-9_-]{16,256}$/;

/**
 * Lee el token CSRF de la cookie `gk_csrf`. Es lo único que el front lee de las cookies:
 * el refresh token es HttpOnly y no se ve desde JS (S3).
 */
@Injectable({ providedIn: 'root' })
export class CsrfToken {
  private readonly document = inject(DOCUMENT);

  read(): string | null {
    for (const part of this.document.cookie.split(';')) {
      const [name, ...rest] = part.trim().split('=');
      if (name !== CSRF_COOKIE) continue;
      const value = rest.join('=');
      return CSRF_VALUE_RE.test(value) ? value : null;
    }
    return null;
  }
}
