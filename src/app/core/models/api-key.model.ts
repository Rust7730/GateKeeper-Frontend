// La tabla api_key del backend no guarda nombre: se identifica por aplicación y prefijo.
export interface ApiKey {
  id: string;
  appId: string;
  appName: string | null;
  prefix: string | null; // gk_ + 12 hex; null si no cumple el formato
  createdAt: string | null;
  lastUsedAt: string | null;
  status: 'active' | 'revoked';
}

/** El secreto se muestra una sola vez y nunca se guarda en storage (S2). */
export interface ApiKeyCreated extends ApiKey {
  secret: string;
}
