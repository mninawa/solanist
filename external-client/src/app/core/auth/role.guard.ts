import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../models/common.models';
import { homeRouteForRole, loginRouteForRole } from './auth.constants';

export const roleGuard = (role: UserRole): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();
  if (user?.role === role) return true;
  if (user?.role) return router.createUrlTree([homeRouteForRole(user.role)]);
  return router.createUrlTree([loginRouteForRole(role)]);
};
