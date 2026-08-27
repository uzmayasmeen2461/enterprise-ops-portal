import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService } from './core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);
  authService = inject(AuthService);

  title = 'Enterprise Ops Portal';
  sidenavOpen = signal(true);

  navItems: NavItem[] = [
    { label: 'Dashboard',  icon: 'dashboard',     route: '/dashboard'  },
    { label: 'Operations', icon: 'list_alt',       route: '/operations' },
    { label: 'Exceptions', icon: 'error_outline',  route: '/exceptions' }
  ];

  // Convert the router events Observable into a Signal
  // toSignal() is Angular's bridge between RxJS Observables and Signals
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  // Derived signal — hides shell chrome on the login page
  isLoginPage = computed(() => this.currentUrl().startsWith('/login'));

  toggleSidenav(): void {
    this.sidenavOpen.set(!this.sidenavOpen());
  }

  logout(): void {
    this.authService.logout();
  }
}
