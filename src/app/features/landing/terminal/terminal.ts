import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { Shell, buildSession } from './shell-tokens';

const PROMPT: Record<Shell, { main: string; continuation: string; title: string }> = {
  bash: { main: '~/mi-app $', continuation: '>', title: 'bash — ~/mi-app' },
  powershell: { main: 'PS C:\\mi-app>', continuation: '>>', title: 'PowerShell — C:\\mi-app' },
};

/** Ventana de terminal con prompt real, resaltado de sintaxis y botón de copiar. */
@Component({
  selector: 'gk-terminal',
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Terminal {
  readonly shell = input<Shell>('bash');
  readonly command = input.required<readonly string[]>();
  readonly output = input<readonly string[]>([]);
  /** Muestra el cursor parpadeando en el prompt final. */
  readonly cursor = input(false);

  protected readonly prompt = computed(() => PROMPT[this.shell()]);
  protected readonly lines = computed(() => buildSession(this.command(), this.output()));
  protected readonly copied = signal(false);
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  protected async copy(): Promise<void> {
    const text = this.command().join('\n');
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
      clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.copied.set(false);
    }
  }
}
