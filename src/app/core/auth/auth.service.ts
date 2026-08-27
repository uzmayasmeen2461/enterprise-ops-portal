import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

// Shape of a logged-in user
export interface AuthUser {
  username: string;
  role: 'ADMIN' | 'VIEWER';
  token: string;
}

// Mock credentials — simulates a backend check
const MOCK_USERS = [
  { username: 'admin',  password: 'admin123',  role: 'ADMIN'  as const },
  { username: 'viewer', password: 'viewer123', role: 'VIEWER' as const }
];

@Injectable({
  // providedIn: 'root' means Angular creates ONE instance for the entire app
  // This is a singleton — the same service instance is shared everywhere
  // React equivalent: a single Context value or a Zustand store
  providedIn: 'root'
})
export class AuthService {

  // Private signal — only this service can write to it
  // Components can only READ via the public computed signals below
  private currentUser = signal<AuthUser | null>(null);

  // Public derived state — computed() re-evaluates when currentUser changes
  // React equivalent: useMemo(() => currentUser !== null, [currentUser])
  isLoggedIn = computed(() => this.currentUser() !== null);
  loggedInUser = computed(() => this.currentUser());
  userRole = computed(() => this.currentUser()?.role ?? null);

  constructor(private router: Router) {
    // Restore session from localStorage on app startup
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      this.currentUser.set(JSON.parse(stored));
    }
  }

  login(username: string, password: string): boolean {
    const match = MOCK_USERS.find(
      u => u.username === username && u.password === password
    );

    if (!match) return false;

    const user: AuthUser = {
      username: match.username,
      role: match.role,
      // Mock JWT token — in a real app this comes from the backend
      token: `mock-jwt-token-${match.username}-${Date.now()}`
    };

    // Write to the signal — all computed() values update automatically
    this.currentUser.set(user);

    // Persist session across page refreshes
    localStorage.setItem('auth_user', JSON.stringify(user));

    return true;
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('auth_user');
    this.router.navigate(['/login']);
  }

  // Used by the HTTP interceptor in Phase 5
  getToken(): string | null {
    return this.currentUser()?.token ?? null;
  }
}
