import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../backend/services/auth.service';

const redirectToLogin = () => {
  const router = inject(Router);
  return router.createUrlTree(['/login']);
};

const redirectToRoleHome = (role: 'admin' | 'employee') => {
  const router = inject(Router);
  const path = role === 'admin' ? '/admin-dashboard' : '/employee-dashboard';
  return router.createUrlTree([path]);
};

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.currentUser() ? true : redirectToLogin();
};

export const roleGuard = (requiredRole: 'admin' | 'employee'): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const currentUser = authService.currentUser();

    if (!currentUser) {
      return redirectToLogin();
    }

    if (currentUser.role !== requiredRole) {
      return redirectToRoleHome(currentUser.role);
    }

    return true;
  };
};

export const roleChildGuard = (requiredRole: 'admin' | 'employee'): CanActivateChildFn => {
  return () => {
    const authService = inject(AuthService);
    const currentUser = authService.currentUser();

    if (!currentUser) {
      return redirectToLogin();
    }

    if (currentUser.role !== requiredRole) {
      return redirectToRoleHome(currentUser.role);
    }

    return true;
  };
};

export const loginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const currentUser = authService.currentUser();

  if (!currentUser) {
    return true;
  }

  return redirectToRoleHome(currentUser.role);
};
