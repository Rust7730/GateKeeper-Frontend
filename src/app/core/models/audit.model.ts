import { Role } from './session.model';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'release_file'
  | 'create_api_key'
  | 'revoke_api_key'
  | 'login_failed'
  | 'unknown';

export interface AuditEntry {
  id: string;
  actor: { id: string; email: string; role: Role | 'unknown' };
  action: AuditAction;
  resource: string | null;
  reason: string | null; // HOSTIL: interpolación en UI y escape S7 en CSV
  ip: string | null;
  at: string | null;
}

export interface AuditQuery {
  action?: Exclude<AuditAction, 'unknown'>;
  page: number;
  pageSize: number;
}
