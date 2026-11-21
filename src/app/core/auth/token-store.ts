import { Injectable, computed, signal } from '@angular/core';

import { Session } from '../models/session.model';

/**
 * Única fuente del access token: un signal en memoria (S2, F5.02). Nunca se copia a
 * `localStorage`, `sessionStorage`, IndexedDB ni cookies; al recargar se pierde y se
 * recupera con un refresh (la cookie HttpOnly la maneja el navegador, S3).
 */
@Injectable({ providedIn: 'root' })
export class TokenStore {
  private readonly current = signal<Session | null>(null);

  readonly session = this.current.asReadonly();
  readonly accessToken = computed(() => this.current()?.accessToken ?? null);
  readonly expiresAt = computed(() => this.current()?.expiresAt ?? null);

  set(session: Session): void {
    this.current.set(session);
  }

  clear(): void {
    this.current.set(null);
  }
}
