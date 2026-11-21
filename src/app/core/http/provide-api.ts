import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { environment } from '../../../environments/environment';
import { API_BASE_URL } from '../api/api-config';
import { authInterceptor } from './auth.interceptor';
import { mockBackendInterceptor } from './mock-backend.interceptor';
import { refreshInterceptor } from './refresh.interceptor';

export interface ApiEnvironment {
  useMocks: boolean;
  apiBaseUrl: string;
}

/**
 * HttpClient + raíz de la API. Registra los interceptores de autenticación y refresco
 * (M05); con `useMocks` añade al final el backend simulado.
 */
export function provideApi(env: ApiEnvironment = environment): EnvironmentProviders {
  // `ngDevMode` vale `false` en el build optimizado: el mock queda fuera del bundle.
  const mocks = (typeof ngDevMode === 'undefined' || ngDevMode) && env.useMocks;
  const interceptors = mocks
    ? [authInterceptor, refreshInterceptor, mockBackendInterceptor]
    : [authInterceptor, refreshInterceptor];
  return makeEnvironmentProviders([
    provideHttpClient(withInterceptors(interceptors)),
    { provide: API_BASE_URL, useValue: env.apiBaseUrl },
  ]);
}
