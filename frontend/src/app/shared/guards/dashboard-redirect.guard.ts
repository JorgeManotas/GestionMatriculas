import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

export const dashboardRedirectGuard: CanActivateFn = (): UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const role = authService.currentUser?.role;

  if (role === 'ADMIN') {
    return router.createUrlTree(['/app/dashboard/admin']);
  }
  if (role === 'RECTOR' || role === 'SECRETARY') {
    return router.createUrlTree(['/app/dashboard/admin']);
  }
  if (role === 'TEACHER') {
    return router.createUrlTree(['/app/dashboard/docente']);
  }
  if (role === 'STUDENT') {
    return router.createUrlTree(['/app/dashboard/estudiante']);
  }

  return router.createUrlTree(['/app/dashboard/acudiente']);
};
