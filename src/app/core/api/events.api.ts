import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { TokenStore } from '../auth/token-store';
import { SecurityEvent } from '../models/security-event.model';
import { API_BASE_URL, apiUrl } from './api-config';
import { InvalidDtoError, toSecurityEvent } from './backend-adapter';

/**
 * Consume `/v1/admin/events` (SSE) con `fetch` + `ReadableStream` enviando
 * `Authorization: Bearer` (F5.11, S6 — nunca `EventSource` ni token en query string).
 */
@Injectable({ providedIn: 'root' })
export class EventsApi {
  private readonly base = inject(API_BASE_URL);
  private readonly tokens = inject(TokenStore);

  stream(): Observable<SecurityEvent> {
    return new Observable<SecurityEvent>((subscriber) => {
      const token = this.tokens.accessToken();
      if (!token) {
        subscriber.complete();
        return;
      }

      const controller = new AbortController();
      const url = apiUrl(this.base, 'admin', 'events');

      void (async () => {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Accept: 'text/event-stream',
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          });
          if (!response.ok || !response.body) {
            subscriber.complete();
            return;
          }
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (!controller.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.startsWith('data:')) continue;
              const raw = line.slice(5).trim();
              if (!raw) continue;
              try {
                const parsed: unknown = JSON.parse(raw);
                subscriber.next(toSecurityEvent(parsed));
              } catch (err) {
                if (!(err instanceof SyntaxError) && !(err instanceof InvalidDtoError)) {
                  throw err;
                }
              }
            }
          }
          subscriber.complete();
        } catch {
          if (!controller.signal.aborted) {
            subscriber.complete();
          }
        }
      })();

      return () => controller.abort();
    });
  }
}
