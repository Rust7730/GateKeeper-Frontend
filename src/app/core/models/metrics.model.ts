import { DetectionLayer, FileStatus } from './file.model';

export type MetricsPeriod = '24h' | '7d' | '30d';

export interface Metrics {
  period: MetricsPeriod;
  totals: Record<Exclude<FileStatus, 'unknown'> | 'processed', number>;
  threatsByDay: { date: string; blocked: number; quarantined: number }[];
  byLayer: { layer: DetectionLayer; count: number }[];
  topApps: { appId: string; appName: string | null; blocked: number }[];
}
