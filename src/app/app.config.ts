import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { provideApi } from './core/http/provide-api';
import { WorkspacePreferences } from './features/overview/workspace-preferences';
import { WorkspaceTitleStrategy } from './features/overview/workspace-title';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideApi(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      // Fundido entre páginas (View Transitions API). Se omite con «Reducir movimiento».
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition }) => {
          const reduce =
            inject(WorkspacePreferences).reducedMotion() ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (reduce) transition.skipTransition();
        },
      }),
    ),
    { provide: TitleStrategy, useClass: WorkspaceTitleStrategy },
  ],
};
