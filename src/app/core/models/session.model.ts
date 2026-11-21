// Sesión del dashboard (F5.01–F5.03). Provisional: /v1/auth/* aún no existe en la API.
export type Role = 'analyst' | 'admin';

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  mfaEnabled: boolean;
}

/**
 * Sesión abierta. El access token (JWT de 15 min, F5.02) vive solo en memoria
 * (`TokenStore`, S2). El refresh token es una cookie HttpOnly que el front no ve (S3).
 */
export interface Session {
  accessToken: string;
  /** Instante de expiración del access token, en ms desde epoch. */
  expiresAt: number;
  user: SessionUser;
}

/** Resultado del paso 1: sesión directa o desafío TOTP (obligatorio para admin, F5.01). */
export type LoginResult =
  { kind: 'session'; session: Session } | { kind: 'mfa'; challengeId: string };
