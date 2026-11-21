import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../auth/auth.service';

/** Exige sesión activa en memoria (o recuperable por refresh cookie); si no, redirige a `/login`. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureSession().pipe(map((ok) => (ok ? true : router.createUrlTree(['/login']))));
};

/** Exige sesión activa con rol `admin` (F5.05, K06); un analista vuelve al resumen `/app`. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureSession().pipe(
    map((ok) => {
      if (!ok) return router.createUrlTree(['/login']);
      return auth.isAdmin() ? true : router.createUrlTree(['/app']);
    }),
  );
};

/** Evita mostrar `/login` cuando ya existe una sesión activa en memoria. */
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree(['/app']) : true;
};
