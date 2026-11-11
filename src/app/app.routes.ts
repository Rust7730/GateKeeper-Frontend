import { Route, Routes } from '@angular/router';
import { WorkspaceView } from './features/overview/workspace-data';

const title = (section: string) => `Gatekeeper · ${section}`;

const workspace = (path: string, view: WorkspaceView, section: string): Route => ({
  path,
  title: title(section),
  data: { view },
  loadComponent: () => import('./features/overview/workspace').then((m) => m.Workspace),
});

// Dashboard en "/app": barra superior + menú lateral, una página por sección.
// "/" y "/dashboard" llevan al resumen. La landing pública vive en Astro (/landing).
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  { path: 'dashboard', redirectTo: 'app', pathMatch: 'full' },
  workspace('login', 'login', 'Acceso'),
  { ...workspace('app', 'summary', 'Resumen'), pathMatch: 'full' },
  workspace('app/archivos', 'files', 'Archivos'),
  workspace('app/archivos/:id', 'detail', 'Detalle del archivo'),
  workspace('app/cuarentena', 'quarantine', 'Cuarentena'),
  workspace('app/alertas', 'alerts', 'Alertas'),
  workspace('app/auditoria', 'audit', 'Auditoría'),
  workspace('app/claves', 'keys', 'Obtener clave API'),
  workspace('app/explorador', 'explorer', 'Consola de pruebas'),
  workspace('app/documentacion', 'docs', 'Documentación'),
  workspace('app/**', 'missing', 'Página no encontrada'),
  { path: '**', redirectTo: 'app' },
];
