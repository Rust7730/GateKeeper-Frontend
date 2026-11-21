import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { AuditEntry, AuditQuery } from '../models/audit.model';
import { Page } from '../models/page.model';
import { API_BASE_URL, apiUrl } from './api-config';
import { toAuditEntry, toAuditQueryParams, toPage } from './backend-adapter';

/** Bitácora de auditoría. Solo admin: un analista recibe 403. */
@Injectable({ providedIn: 'root' })
export class AuditApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(query: AuditQuery): Observable<Page<AuditEntry>> {
    return this.http
      .get<unknown>(apiUrl(this.base, 'admin', 'audit'), { params: toAuditQueryParams(query) })
      .pipe(map((body) => toPage(body, toAuditEntry)));
  }
}
