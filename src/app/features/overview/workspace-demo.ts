import { Injectable, signal } from '@angular/core';
import { SAMPLE_AUDIT, SAMPLE_FILES, SAMPLE_KEYS } from './workspace-data';

@Injectable({ providedIn: 'root' })
export class WorkspaceDemo {
  readonly files = signal(SAMPLE_FILES);
  readonly keys = signal(SAMPLE_KEYS);
  readonly audit = signal(SAMPLE_AUDIT);
  readonly administrator = signal(false);

  tokenFor(id: string): string {
    return `gk_demo_${id.replaceAll('-', '')}`;
  }

  acceptsKey(token: string): boolean {
    return this.keys().some(
      (key) => !key.revoked && key.id.length === 36 && this.tokenFor(key.id) === token,
    );
  }
}
