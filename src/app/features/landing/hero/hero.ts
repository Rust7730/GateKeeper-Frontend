import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { HERO_SCANS, SCAN_VERDICT_LABEL } from './hero-scans';

const CYCLE_MS = 5200;

/**
 * Cabecera de la landing: titular con entrada línea por línea y un escáner que inspecciona
 * archivos reales. El ciclo se pausa con hover, foco o pestaña oculta, y no corre con
 * reduced motion.
 */
@Component({
  selector: 'gk-hero',
  imports: [RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(mouseenter)': 'paused.set(true)',
    '(mouseleave)': 'paused.set(false)',
    '(focusin)': 'paused.set(true)',
    '(focusout)': 'paused.set(false)',
  },
})
export class Hero {
  protected readonly scans = HERO_SCANS;
  protected readonly verdictLabel = SCAN_VERDICT_LABEL;
  protected readonly index = signal(0);
  protected readonly paused = signal(false);
  protected readonly scan = computed(() => this.scans[this.index()]);
  /** Lista de un elemento: el `track` por id recrea el escáner y reinicia su animación. */
  protected readonly current = computed(() => [this.scan()]);

  protected readonly titleLines = [
    'Tu aplicación cree lo que',
    'el archivo dice ser.',
    'Gatekeeper revisa lo que es.',
  ];

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const reduce =
        typeof window.matchMedia !== 'function' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;
      const timer = setInterval(() => {
        if (this.paused() || document.hidden) return;
        this.next();
      }, CYCLE_MS);
      destroyRef.onDestroy(() => clearInterval(timer));
    });
  }

  protected show(i: number): void {
    this.index.set(i);
  }

  private next(): void {
    this.index.update((i) => (i + 1) % this.scans.length);
  }
}
