import { InjectionToken } from '@angular/core';

import { Role } from '../models/session.model';
import { MockDb, createMockDb } from './mock-db';

export interface ForcedError {
  status: number;
  /** Solo aplica a rutas que empiezan así (relativas a la raíz de la API, p. ej. `/admin/files`). */
  pathPrefix?: string;
}

/**
 * Estado del backend simulado: la base de datos y los controles para simular sesión,
 * rol y errores. Solo lo usa `mockBackendInterceptor` y las pruebas; los componentes
 * no lo conocen (C5).
 */
export class MockBackendState {
  db: MockDb = createMockDb();

  /** Rol de la sesión simulada (M05 lo conectará al login mock). */
  role: Role = 'admin';

  /** Con `true`, toda ruta protegida responde 401. */
  sessionExpired = false;

  /** Latencia aleatoria por respuesta, en ms. */
  latency = { min: 200, max: 800 };

  private readonly forced: ForcedError[] = [];

  /** La próxima petición que coincida responde con este estado (401, 423, 429, 500…). */
  failNext(error: ForcedError): void {
    this.forced.push(error);
  }

  /** Saca el primer error forzado que coincide con la ruta, si hay. */
  takeForcedError(path: string): ForcedError | null {
    const index = this.forced.findIndex((e) => !e.pathPrefix || path.startsWith(e.pathPrefix));
    return index === -1 ? null : this.forced.splice(index, 1)[0];
  }

  /** Vuelve al estado inicial (útil en pruebas). */
  reset(seed?: number): void {
    this.db = createMockDb(seed);
    this.role = 'admin';
    this.sessionExpired = false;
    this.latency = { min: 200, max: 800 };
    this.forced.length = 0;
  }
}

/**
 * Se inyecta con este token y no con `@Injectable`: un token `@__PURE__` deja que el build
 * de producción elimine el mock entero cuando no se registra el interceptor.
 */
export const MOCK_BACKEND_STATE = /* @__PURE__ */ new InjectionToken<MockBackendState>(
  'MockBackendState',
  { providedIn: 'root', factory: () => new MockBackendState() },
);
