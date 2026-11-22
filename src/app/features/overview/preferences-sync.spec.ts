import { adoptPreferencesFromUrl, withPreferences } from './preferences-sync';

function fakeWindow(href: string) {
  const store = new Map<string, string>();
  let current = href;
  return {
    store,
    get url() {
      return current;
    },
    win: {
      location: {
        get href() {
          return current;
        },
      },
      localStorage: {
        setItem: (key: string, value: string) => store.set(key, value),
      },
      history: {
        state: null,
        replaceState: (_s: unknown, _t: string, next: string) => {
          current = new URL(next, current).toString();
        },
      },
    } as unknown as Window,
  };
}

describe('Sincronización de preferencias entre landing y dashboard', () => {
  it('guarda las preferencias válidas y limpia la URL', () => {
    const f = fakeWindow('https://panel.test/app?tema=dark&idioma=en&movimiento=reduce&x=1#a');
    adoptPreferencesFromUrl(f.win);
    expect(f.store.get('gatekeeper-theme')).toBe('dark');
    expect(f.store.get('gatekeeper-language')).toBe('en');
    expect(f.store.get('gatekeeper-motion')).toBe('reduce');
    expect(f.url).toBe('https://panel.test/app?x=1#a');
  });

  it('ignora valores desconocidos pero igual los quita de la URL', () => {
    const f = fakeWindow('https://panel.test/?tema=<script>&idioma=fr');
    adoptPreferencesFromUrl(f.win);
    expect(f.store.size).toBe(0);
    expect(f.url).toBe('https://panel.test/');
  });

  it('arma el enlace con las preferencias actuales', () => {
    const href = withPreferences('https://landing.test/en/', {
      theme: 'light',
      language: 'en',
      reducedMotion: false,
    });
    expect(href).toBe('https://landing.test/en/?tema=light&idioma=en&movimiento=system');
  });
});
