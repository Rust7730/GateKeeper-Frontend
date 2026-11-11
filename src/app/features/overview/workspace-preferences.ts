import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { ENGLISH } from './workspace-english';

type Theme = 'system' | 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class WorkspacePreferences {
  private readonly document = inject(DOCUMENT);
  private readonly savedTheme = this.read('gatekeeper-theme');

  readonly theme = signal<Theme>(
    this.savedTheme === 'light' || this.savedTheme === 'dark' ? this.savedTheme : 'system',
  );
  readonly language = signal<'es' | 'en'>(this.read('gatekeeper-language') === 'en' ? 'en' : 'es');
  readonly reducedMotion = signal(this.read('gatekeeper-motion') === 'reduce');

  constructor() {
    effect(() => {
      const language = this.language();
      this.document.documentElement.lang = language;
      this.write('gatekeeper-language', language);
      this.write('gatekeeper-theme', this.theme());
      this.write('gatekeeper-motion', this.reducedMotion() ? 'reduce' : 'system');
    });
  }

  text(spanish: string, english?: string): string {
    if (this.language() === 'es') return spanish;
    return english ?? (Object.hasOwn(ENGLISH, spanish) ? ENGLISH[spanish] : spanish);
  }

  private read(key: string): string | null | undefined {
    try {
      return this.document.defaultView?.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      this.document.defaultView?.localStorage.setItem(key, value);
    } catch {
      // Preferences still work for this session if storage is unavailable.
    }
  }
}
