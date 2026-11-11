import { Component, inject } from '@angular/core';
import { WorkspacePreferences } from './workspace-preferences';

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

  t(spanish: string, english?: string): string {
    return this.preferences.text(spanish, english);
  }
}
