import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

export const authGuard: CanActivateFn & CanActivateChildFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser ? true : router.createUrlTree(['/login']);
};
