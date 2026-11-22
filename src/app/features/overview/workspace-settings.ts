import { ApplicationRef, Component, ElementRef, inject } from '@angular/core';
import { WorkspacePreferences } from './workspace-preferences';

type Theme = 'system' | 'light' | 'dark';

@Component({
  selector: 'gk-workspace-settings',
  templateUrl: './workspace-settings.html',
  styleUrl: './workspace-settings.scss',
  host: {
    '[attr.data-theme]': 'preferences.theme()',
    '[attr.data-motion]': 'preferences.reducedMotion() ? "reduce" : null',
  },
})
export class WorkspaceSettings {
  readonly preferences = inject(WorkspacePreferences);
  private readonly appRef = inject(ApplicationRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  t(spanish: string, english?: string): string {
    return this.preferences.text(spanish, english);
  }

  /**
   * Cambia el tema con el mismo efecto que la landing: el tema nuevo se revela en un
   * círculo que crece desde el botón de Ajustes (View Transitions API).
   */
  setTheme(theme: Theme): void {
    if (this.preferences.theme() === theme) return;
    const doc = document as Document & {
      startViewTransition?: (update: () => void) => {
        ready: Promise<void>;
        finished: Promise<void>;
      };
    };
    const still =
      this.preferences.reducedMotion() ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || typeof doc.startViewTransition !== 'function') {
      this.preferences.theme.set(theme);
      return;
    }

    const summary = this.host.nativeElement.querySelector('summary') ?? this.host.nativeElement;
    const rect = summary.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    // Mientras dura, la barra y el menú lateral cambian junto con todo lo demás.
    const root = document.documentElement;
    root.classList.add('theme-transition');
    const transition = doc.startViewTransition(() => {
      this.preferences.theme.set(theme);
      this.appRef.tick();
    });
    transition.ready
      .then(() =>
        root.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
          },
          {
            duration: 650,
            easing: 'cubic-bezier(.22, 1, .36, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        ),
      )
      .catch(() => undefined);
    transition.finished.finally(() => root.classList.remove('theme-transition'));
  }
}
