import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiKey, ApiKeyCreated } from '../models/api-key.model';
import { API_BASE_URL, apiUrl, invalidIdError } from './api-config';
import { NuevaApiKeyDto } from './backend.dto';
import { isUuid, toApiKey, toApiKeyCreated, toPage } from './backend-adapter';

/** API keys de las aplicaciones. Solo admin. El secreto se devuelve una sola vez. */
@Injectable({ providedIn: 'root' })
export class ApiKeysApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(): Observable<ApiKey[]> {
    return this.http
      .get<unknown>(apiUrl(this.base, 'admin', 'api-keys'))
      .pipe(map((body) => toPage(body, toApiKey).items));
  }

  create(appId: string): Observable<ApiKeyCreated> {
    const body: NuevaApiKeyDto = { aplicacion_id: appId };
    return this.http
      .post<unknown>(apiUrl(this.base, 'admin', 'api-keys'), body)
      .pipe(map(toApiKeyCreated));
  }

  /** Un id que no es UUID no sale a la red: responde 404, como uno inexistente. */
  revoke(id: string): Observable<void> {
    if (!isUuid(id)) return invalidIdError();
    return this.http
      .delete<unknown>(apiUrl(this.base, 'admin', 'api-keys', id))
      .pipe(map(() => undefined));
  }
}
