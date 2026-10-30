import { Routes } from '@angular/router';

// Landing pública en "/" (M01). Login en "/login" (marcador «Próximamente» hasta M05).
// El dashboard vivirá bajo "/app" (M06+).
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Gatekeeper · Inspección de archivos antes de tu almacenamiento',
    loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
  },
  {
    path: 'login',
    title: 'Gatekeeper · Próximamente',
    loadComponent: () =>
      import('./features/auth/coming-soon/coming-soon').then((m) => m.ComingSoon),
  },
  { path: '**', redirectTo: '' },
];
