// Provisional: el SSE de /v1/admin/events llega en M11. El backend no manda texto libre:
// el front arma el mensaje a partir de `type`. `fileName` solo existe cuando K20 lo permite.
export type Severity = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export type SecurityEventType =
  | 'malware_detected'
  | 'policy_rejected'
  | 'rate_limited'
  | 'file_released'
  | 'login_failed'
  | 'unknown';

export interface SecurityEvent {
  id: string;
  severity: Severity;
  type: SecurityEventType;
  fileId: string | null;
  appName: string | null;
  fileName: string | null; // HOSTIL; null salvo malware o cuarentena (K20)
  at: string | null;
}
