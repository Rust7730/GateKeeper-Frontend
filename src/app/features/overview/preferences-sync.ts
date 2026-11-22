// Sincroniza las preferencias entre la landing y el dashboard.
// Viven en dominios distintos y no comparten localStorage, así que los enlaces entre
// ambos llevan las preferencias en la URL (?tema=…&idioma=…&movimiento=…). Quien las
// recibe las guarda y limpia la URL. Solo se aceptan valores conocidos.

export type SyncedTheme = 'system' | 'light' | 'dark';
export type SyncedLanguage = 'es' | 'en';

export interface SyncedPreferences {
  theme: SyncedTheme;
  language: SyncedLanguage;
  reducedMotion: boolean;
}

const THEMES: ReadonlySet<string> = new Set(['system', 'light', 'dark']);
const LANGUAGES: ReadonlySet<string> = new Set(['es', 'en']);
const MOTIONS: ReadonlySet<string> = new Set(['reduce', 'system']);
export const SYNC_PARAMS = ['tema', 'idioma', 'movimiento'] as const;

/** Mismas claves de localStorage que usa WorkspacePreferences y la landing. */
const STORAGE_KEY = {
  tema: 'gatekeeper-theme',
  idioma: 'gatekeeper-language',
  movimiento: 'gatekeeper-motion',
} as const;

const VALID = { tema: THEMES, idioma: LANGUAGES, movimiento: MOTIONS } as const;

/**
 * Lee las preferencias que llegan en la URL, las guarda y quita los parámetros de la
 * barra de direcciones. Se llama en main.ts antes de arrancar Angular, así el router
 * nunca ve esos parámetros y WorkspacePreferences ya lee los valores nuevos.
 */
export function adoptPreferencesFromUrl(win: Window = window): void {
  const url = new URL(win.location.href);
  let found = false;
  for (const name of SYNC_PARAMS) {
    const value = url.searchParams.get(name);
    if (value === null) continue;
    found = true;
    url.searchParams.delete(name);
    if (!VALID[name].has(value)) continue;
    try {
      win.localStorage.setItem(STORAGE_KEY[name], value);
    } catch {
      // Sin almacenamiento las preferencias siguen funcionando en esta visita.
    }
  }
  if (found) win.history.replaceState(win.history.state, '', url.pathname + url.search + url.hash);
}

/** Añade las preferencias actuales a un enlace hacia el otro sitio. */
export function withPreferences(href: string, preferences: SyncedPreferences): string {
  const url = new URL(href);
  url.searchParams.set('tema', preferences.theme);
  url.searchParams.set('idioma', preferences.language);
  url.searchParams.set('movimiento', preferences.reducedMotion ? 'reduce' : 'system');
  return url.toString();
}
