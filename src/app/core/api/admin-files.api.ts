import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';

import { FileQuery, FileRecord } from '../models/file.model';
import { Page } from '../models/page.model';
import { API_BASE_URL, apiUrl, invalidIdError } from './api-config';
import { isUuid, toFileQueryParams, toFileRecord, toPage, toReleaseBody } from './backend-adapter';

/**
 * Archivos vistos desde el dashboard (lectura de admin, K20).
 * La lista y el detalle devuelven `FileRecord`: restringido o con detalle completo.
 * No existe ningún método para ver o descargar el original (S5).
 */
@Injectable({ providedIn: 'root' })
export class AdminFilesApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(query: FileQuery): Observable<Page<FileRecord>> {
    return this.http
      .get<unknown>(apiUrl(this.base, 'admin', 'files'), { params: toFileQueryParams(query) })
      .pipe(map((body) => toPage(body, toFileRecord)));
  }

  /**
   * 404 tanto si no existe como si es de otra aplicación (IDOR, vector 13).
   * Un id que no es UUID no sale a la red: responde el mismo 404.
   */
  get(id: string): Observable<FileRecord> {
    if (!isUuid(id)) return invalidIdError();
    return this.http.get<unknown>(apiUrl(this.base, 'admin', 'files', id)).pipe(map(toFileRecord));
  }

  /** El motivo viaja en el cuerpo, nunca en la URL (S10). */
  release(id: string, reason: string): Observable<FileRecord> {
    if (!isUuid(id)) return invalidIdError();
    return this.http
      .post<unknown>(apiUrl(this.base, 'admin', 'files', id, 'release'), toReleaseBody(reason))
      .pipe(
        switchMap((body) => {
          if (typeof body === 'object' && body !== null && 'reencolado' in body) {
            return this.get(id);
          }
          return of(toFileRecord(body));
        }),
      );
  }
}
