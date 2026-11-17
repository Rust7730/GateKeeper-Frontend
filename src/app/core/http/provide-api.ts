import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { environment } from '../../../environments/environment';
import { API_BASE_URL } from '../api/api-config';
import { mockBackendInterceptor } from './mock-backend.interceptor';

export interface ApiEnvironment {
  useMocks: boolean;
  apiBaseUrl: string;
}

/**
 * HttpClient + raíz de la API. Con `useMocks` se registra el backend simulado; sin él,
 * las peticiones van a `apiBaseUrl`. Los componentes no saben cuál se usa (C5).
 * M05 añadirá aquí los interceptores de auth, refresh y error.
 */
export function provideApi(env: ApiEnvironment = environment): EnvironmentProviders {
  // `ngDevMode` vale `false` en el build optimizado: el mock queda fuera del bundle.
  const mocks = (typeof ngDevMode === 'undefined' || ngDevMode) && env.useMocks;
  return makeEnvironmentProviders([
    provideHttpClient(withInterceptors(mocks ? [mockBackendInterceptor] : [])),
    { provide: API_BASE_URL, useValue: env.apiBaseUrl },
  ]);
}
