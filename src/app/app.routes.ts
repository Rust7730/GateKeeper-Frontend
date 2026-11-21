import { CanActivateFn, Route, Routes } from '@angular/router';
import { environment } from '../environments/environment';
import { adminGuard, authGuard, loginGuard } from './core/guards/auth.guard';
import { WorkspaceView } from './features/overview/workspace-data';

const title = (section: string) => `Gatekeeper · ${section}`;

const workspace = (
  path: string,
  view: WorkspaceView,
  section: string,
  guards: readonly CanActivateFn[] = [authGuard],
): Route => ({
  path,
  title: title(section),
  data: { view },
  canActivate: [...guards],
  loadComponent: () => import('./features/overview/workspace').then((m) => m.Workspace),
});

// Herramientas de desarrollo: no existen en el build de producción. `ngDevMode` vale
// `false` en el build optimizado, así que la ruta y su chunk quedan fuera del bundle.
const devTools = (typeof ngDevMode === 'undefined' || !!ngDevMode) && !environment.production;
const devRoutes: Routes = devTools
  ? [
      {
        path: 'dev/api',
        title: title('API simulada'),
        loadComponent: () => import('./features/dev/dev-api/dev-api').then((m) => m.DevApi),
      },
    ]
  : [];

// Dashboard en "/app": protegido por authGuard (adminGuard en auditoría y claves).
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  { path: 'dashboard', redirectTo: 'app', pathMatch: 'full' },
  workspace('login', 'login', 'Acceso', [loginGuard]),
  { ...workspace('app', 'summary', 'Resumen'), pathMatch: 'full' },
  workspace('app/archivos', 'files', 'Archivos'),
  workspace('app/archivos/:id', 'detail', 'Detalle del archivo'),
  workspace('app/cuarentena', 'quarantine', 'Cuarentena'),
  workspace('app/alertas', 'alerts', 'Alertas'),
  workspace('app/auditoria', 'audit', 'Auditoría', [adminGuard]),
  workspace('app/claves', 'keys', 'Obtener clave API', [adminGuard]),
  workspace('app/explorador', 'explorer', 'Consola de pruebas'),
  workspace('app/documentacion', 'docs', 'Documentación'),
  workspace('app/**', 'missing', 'Página no encontrada'),
  ...devRoutes,
  { path: '**', redirectTo: 'app' },
];
