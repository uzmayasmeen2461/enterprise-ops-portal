import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

// CanActivateFn is a TYPE — it describes a function that guards a route
// Angular calls this function before activating any route it is applied to
//
// React equivalent:
// const ProtectedRoute = ({ children }) =>
//   isAuthenticated ? children : <Navigate to="/login" />
//
// The difference: Angular guards run BEFORE the component is even created.
// React ProtectedRoute renders the component first, then redirects.

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // User is authenticated — allow the route to activate
    return true;
  }

  // User is NOT authenticated — redirect to login
  // createUrlTree() builds a URL object; Angular redirects without a full page reload
  return router.createUrlTree(['/login']);
};
