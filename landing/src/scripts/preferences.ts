const root = document.documentElement;
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
