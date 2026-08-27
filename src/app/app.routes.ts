import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Default redirect
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // Login — public, no guard
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(m => m.LoginComponent)
  },

  // Dashboard — protected
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },

  // Operations list — protected
  {
    path: 'operations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/operations/operations.component').then(m => m.OperationsComponent)
  },

  // Operation detail — protected
  {
    path: 'operations/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/operations/operation-detail/operation-detail.component')
        .then(m => m.OperationDetailComponent)
  },

  // Exceptions — protected
  {
    path: 'exceptions',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/exceptions/exceptions.component').then(m => m.ExceptionsComponent)
  },

  // Catch-all
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
