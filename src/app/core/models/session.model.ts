// Provisional: /v1/auth/* no existe aún en el backend (fase F5). Lo consume M05.
export type Role = 'analyst' | 'admin';

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  mfaEnabled: boolean;
}

export interface LoginResponse {
  accessToken: string; // solo en memoria (S2)
  expiresIn: number;
  user: SessionUser;
}

export interface LoginStep1Response {
  mfaRequired: true;
  challengeId: string;
}
