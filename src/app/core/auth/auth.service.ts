import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../api/api-config';
import { toLoginResult, toSession } from '../api/backend-adapter';
import { InicioSesionDto, VerificacionTotpDto } from '../api/backend.dto';
import { LoginResult, Session } from '../models/session.model';
import { CSRF_HEADER, CsrfToken } from './csrf';
import { TokenStore } from './token-store';

/**
 * Autenticación del dashboard SecOps (F5.01–F5.04):
 * - Access token JWT (15 min) únicamente en memoria (`TokenStore`, S2).
 * - Refresh token en cookie HttpOnly manejada por el navegador (`withCredentials: true`, S3).
 * - Double-submit CSRF (`gk_csrf` -> `X-CSRF-Token`) en `/v1/auth/refresh` y `/v1/auth/logout`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  private readonly tokens = inject(TokenStore);
  private readonly csrf = inject(CsrfToken);
  private readonly router = inject(Router);

  private refreshInFlight$: Observable<Session> | null = null;

  readonly session = this.tokens.session;
  readonly user = computed(() => this.tokens.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.tokens.session() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  login(email: string, password: string): Observable<LoginResult> {
    const body: InicioSesionDto = { correo: email.trim(), contrasena: password };
    return this.http
      .post<unknown>(apiUrl(this.base, 'auth', 'login'), body, { withCredentials: true })
      .pipe(
        map((raw) => toLoginResult(raw)),
        tap((result) => {
          if (result.kind === 'session') {
            this.tokens.set(result.session);
          }
        }),
      );
  }

  verifyTotp(challengeId: string, code: string): Observable<Session> {
    const body: VerificacionTotpDto = { desafio_id: challengeId, codigo: code.trim() };
    return this.http
      .post<unknown>(apiUrl(this.base, 'auth', 'totp'), body, { withCredentials: true })
      .pipe(
        map((raw) => toSession(raw)),
        tap((session) => this.tokens.set(session)),
      );
  }

  /** Rota el refresh token (deduplicado ante 401 concurrentes, S4). */
  refresh(): Observable<Session> {
    if (this.refreshInFlight$) return this.refreshInFlight$;
    const headers: Record<string, string> = {};
    const csrfValue = this.csrf.read();
    if (csrfValue) headers[CSRF_HEADER] = csrfValue;

    const req$ = this.http
      .post<unknown>(apiUrl(this.base, 'auth', 'refresh'), null, {
        withCredentials: true,
        headers,
      })
      .pipe(
        map((raw) => toSession(raw)),
        tap((session) => this.tokens.set(session)),
        catchError((error: unknown) => {
          this.tokens.clear();
          throw error;
        }),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    this.refreshInFlight$ = req$;
    return req$;
  }

  /**
   * Comprueba si hay sesión activa en memoria; si se recargó la página e intenta recuperar la
   * sesión mediante la cookie HttpOnly + `gk_csrf` antes de redirigir a `/login`.
   */
  ensureSession(): Observable<boolean> {
    const current = this.tokens.session();
    if (current && current.expiresAt > Date.now() + 5_000) {
      return of(true);
    }
    if (!this.csrf.read()) {
      return of(false);
    }
    return this.refresh().pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  logout(): Observable<void> {
    const headers: Record<string, string> = {};
    const csrfValue = this.csrf.read();
    if (csrfValue) headers[CSRF_HEADER] = csrfValue;

    return this.http
      .post<unknown>(apiUrl(this.base, 'auth', 'logout'), null, {
        withCredentials: true,
        headers,
      })
      .pipe(
        map(() => undefined),
        catchError(() => of(undefined)),
        finalize(() => {
          this.tokens.clear();
          void this.router.navigateByUrl('/login').catch(() => undefined);
        }),
      );
  }

  clearAndRedirect(): void {
    this.tokens.clear();
    void this.router.navigateByUrl('/login').catch(() => undefined);
  }
}
