import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

// Functional HTTP interceptor — the modern Angular 15+ approach.
// A classic class interceptor implements HttpInterceptor and uses next.handle().
// A functional interceptor is just a function: (req, next) => Observable<HttpEvent>.
//
// React equivalent: an axios interceptor or a custom fetch wrapper that injects
// headers before every request.
//
// Angular's DI is available inside the interceptor via inject().
// The interceptor is called for EVERY outgoing HttpClient request.

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // If there is no token (user is not logged in), pass the request through unchanged.
  // This covers the login request itself — we don't want to attach a stale token there.
  if (!token) {
    return next(req);
  }

  // req.clone() — HttpRequest is immutable; we must clone to mutate headers.
  // setHeaders merges the new header with any existing headers on the request.
  const authorisedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  // next(authorisedReq) passes the cloned request down the handler chain.
  // The return type is Observable<HttpEvent<unknown>>, which the framework subscribes to.
  return next(authorisedReq);
};
