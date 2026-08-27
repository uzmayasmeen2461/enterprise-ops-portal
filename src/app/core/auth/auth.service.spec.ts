import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let navigateFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigateFn = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: { navigate: navigateFn } }
      ]
    });

    localStorage.clear();
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ── Creation ──────────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start as not logged in when localStorage is empty', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.loggedInUser()).toBeNull();
    expect(service.userRole()).toBeNull();
  });

  // ── login() ───────────────────────────────────────────────────────────────

  it('should return false for invalid credentials', () => {
    expect(service.login('nobody', 'wrongpassword')).toBe(false);
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should return true and set user signal for valid admin credentials', () => {
    expect(service.login('admin', 'admin123')).toBe(true);
    expect(service.isLoggedIn()).toBe(true);
    expect(service.loggedInUser()?.username).toBe('admin');
    expect(service.userRole()).toBe('ADMIN');
  });

  it('should set VIEWER role for viewer credentials', () => {
    service.login('viewer', 'viewer123');
    expect(service.userRole()).toBe('VIEWER');
  });

  it('should persist the user to localStorage on successful login', () => {
    service.login('admin', 'admin123');
    const stored = localStorage.getItem('auth_user');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.username).toBe('admin');
    expect(parsed.role).toBe('ADMIN');
  });

  it('should generate a token that contains the username', () => {
    service.login('admin', 'admin123');
    expect(service.getToken()).toContain('admin');
  });

  // ── logout() ──────────────────────────────────────────────────────────────

  it('should clear the user signal on logout', () => {
    service.login('admin', 'admin123');
    service.logout();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.loggedInUser()).toBeNull();
  });

  it('should remove auth_user from localStorage on logout', () => {
    service.login('admin', 'admin123');
    service.logout();
    expect(localStorage.getItem('auth_user')).toBeNull();
  });

  it('should navigate to /login on logout', () => {
    service.login('admin', 'admin123');
    service.logout();
    expect(navigateFn).toHaveBeenCalledWith(['/login']);
  });

  // ── Session restore ────────────────────────────────────────────────────────

  it('should restore session from localStorage on construction', () => {
    const mockUser = { username: 'viewer', role: 'VIEWER', token: 'mock-token' };
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    const freshService = new AuthService({ navigate: vi.fn() } as unknown as Router);
    expect(freshService.isLoggedIn()).toBe(true);
    expect(freshService.loggedInUser()?.username).toBe('viewer');
  });
});
