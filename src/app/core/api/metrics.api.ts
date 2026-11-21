import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Metrics, MetricsPeriod } from '../models/metrics.model';
import { API_BASE_URL, apiUrl } from './api-config';
import { toMetrics } from './backend-adapter';

@Injectable({ providedIn: 'root' })
export class MetricsApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  get(period: MetricsPeriod): Observable<Metrics> {
    return this.http
      .get<unknown>(apiUrl(this.base, 'admin', 'metrics'), { params: { periodo: period } })
      .pipe(map(toMetrics));
  }
}
