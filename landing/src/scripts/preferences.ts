const root = document.documentElement;

// Preferencias que llegan desde el dashboard (?tema=…&movimiento=…): el dashboard vive en
// otro dominio y no comparte localStorage. Se guardan, se quitan de la URL y, más abajo,
// se aplican como cualquier preferencia guardada. El idioma lo decide la ruta (/ o /en/).
(() => {
  const url = new URL(window.location.href);
  const valid: Record<string, { key: string; values: readonly string[] }> = {
    tema: { key: 'gatekeeper-theme', values: ['system', 'light', 'dark'] },
    movimiento: { key: 'gatekeeper-motion', values: ['reduce', 'system'] },
    idioma: { key: 'gatekeeper-language', values: ['es', 'en'] },
  };
  let found = false;
  for (const [name, { key, values }] of Object.entries(valid)) {
    const value = url.searchParams.get(name);
    if (value === null) continue;
    found = true;
    url.searchParams.delete(name);
    if (!values.includes(value)) continue;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Sin almacenamiento, la página sigue con sus valores por defecto.
    }
  }
  if (found) history.replaceState(history.state, '', url.pathname + url.search + url.hash);
})();
const preferences = document.querySelector<HTMLDetailsElement>('[data-preferences]');
const themeSwitch = document.querySelector<HTMLElement>('[data-theme-switch]');
const radios = Array.from(themeSwitch?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? []);
const theme = themeSwitch && {
  get value() {
    return radios.find((radio) => radio.checked)?.value ?? 'system';
  },
  set value(next: string) {
    radios.forEach((radio) => { radio.checked = radio.value === next; });
    themeSwitch.dataset.value = next;
  },
  addEventListener(type: 'change', listener: () => void) {
    radios.forEach((radio) => radio.addEventListener(type, () => {
      themeSwitch.dataset.value = this.value;
      listener();
    }));
  },
};
const motion = document.querySelector<HTMLInputElement>('[data-motion-toggle]');

function readPreference(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storePreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The controls still work for this page when browser storage is unavailable.
  }
}

if (preferences && theme && motion) {
  const savedTheme = readPreference('gatekeeper-theme');
  theme.value = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'system';
  root.dataset.theme = theme.value;

  motion.checked = readPreference('gatekeeper-motion') === 'reduce';
  root.dataset.motion = motion.checked ? 'reduce' : 'system';
  document.dispatchEvent(new Event('gatekeeper:motion-change'));
  preferences.hidden = false;

  const dark = window.matchMedia('(prefers-color-scheme: dark)');
  const syncIcon = () => {
    const isDark = theme.value === 'dark' || (theme.value === 'system' && dark.matches);
    root.dataset.themeResolved = isDark ? 'dark' : 'light';
  };
  syncIcon();
  dark.addEventListener('change', syncIcon);

  theme.addEventListener('change', () => {
    const apply = () => {
      root.dataset.theme = theme.value;
      syncIcon();
    };
    storePreference('gatekeeper-theme', theme.value);

    const reduced =
      root.dataset.motion === 'reduce' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof document.startViewTransition !== 'function') {
      apply();
      return;
    }

    const rect = (preferences.querySelector('summary') ?? preferences).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    const transition = document.startViewTransition(apply);
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 650, easing: 'cubic-bezier(.22, 1, .36, 1)', pseudoElement: '::view-transition-new(root)' },
        );
      })
      .catch(() => undefined);
  });

  motion.addEventListener('change', () => {
    const choice = motion.checked ? 'reduce' : 'system';
    root.dataset.motion = choice;
    storePreference('gatekeeper-motion', choice);
    document.dispatchEvent(new Event('gatekeeper:motion-change'));
  });

  preferences.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && preferences.open) {
      preferences.open = false;
      preferences.querySelector('summary')?.focus();
    }
  });
}

// Idioma: el mismo selector que en el dashboard. Cada idioma es su propia página
// (/ y /en/), así que cambiarlo navega conservando la sección (#ancla) actual.
const languageSelect = document.querySelector<HTMLSelectElement>('[data-language-select]');
languageSelect?.addEventListener('change', () => {
  const target = languageSelect.value === 'en' ? '/en/' : '/';
  storePreference('gatekeeper-language', languageSelect.value);
  window.location.assign(target + window.location.hash);
});

// Enlaces al dashboard: llevan el tema, el idioma de esta página y el movimiento para que
// el dashboard se abra igual. Se actualizan al cambiar cualquier preferencia.
const dashboardLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-dashboard-link]')];
const syncDashboardLinks = () => {
  for (const link of dashboardLinks) {
    link.dataset.base ??= link.href;
    const url = new URL(link.dataset.base);
    url.searchParams.set('tema', root.dataset.theme ?? 'system');
    url.searchParams.set('idioma', root.lang === 'en' ? 'en' : 'es');
    url.searchParams.set('movimiento', root.dataset.motion === 'reduce' ? 'reduce' : 'system');
    link.href = url.toString();
  }
};
syncDashboardLinks();
document.addEventListener('gatekeeper:motion-change', syncDashboardLinks);
new MutationObserver(syncDashboardLinks).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
