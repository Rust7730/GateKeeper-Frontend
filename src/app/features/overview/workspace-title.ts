import { Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { WorkspacePreferences } from './workspace-preferences';

/**
 * Título de la pestaña en el idioma elegido. Las rutas declaran «Gatekeeper · Sección» en
 * español y aquí se traduce la sección; se vuelve a poner al cambiar de idioma.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly preferences = inject(WorkspacePreferences);
  private readonly routeTitle = signal<string | undefined>(undefined);

  constructor() {
    super();
    effect(() => {
      const value = this.routeTitle();
      if (value !== undefined) this.title.setTitle(this.translate(value));
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.routeTitle.set(this.buildTitle(snapshot));
  }

  private translate(value: string): string {
    const separator = ' · ';
    const index = value.indexOf(separator);
    if (index < 0) return this.preferences.text(value);
    const section = value.slice(index + separator.length);
    return `${value.slice(0, index)}${separator}${this.preferences.text(section)}`;
  }
}
