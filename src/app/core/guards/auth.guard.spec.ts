import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../auth/auth.service';

describe('authGuard', () => {
  let isLoggedInFn: ReturnType<typeof vi.fn>;
  let createUrlTreeFn: ReturnType<typeof vi.fn>;
  const fakeUrlTree = {} as UrlTree;

  beforeEach(() => {
    isLoggedInFn   = vi.fn();
    createUrlTreeFn = vi.fn().mockReturnValue(fakeUrlTree);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { isLoggedIn: isLoggedInFn }
        },
        {
          provide: Router,
          useValue: { createUrlTree: createUrlTreeFn }
        }
      ]
    });
  });

  // Runs the guard inside Angular's injection context.
  // TestBed.runInInjectionContext() is required for functional guards —
  // it sets up inject() so the guard can resolve its dependencies.
  function runGuard() {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
  }

  it('should return true when the user is logged in', () => {
    isLoggedInFn.mockReturnValue(true);
    expect(runGuard()).toBe(true);
  });

  it('should return a UrlTree redirect to /login when not logged in', () => {
    isLoggedInFn.mockReturnValue(false);
    const result = runGuard();
    expect(result).not.toBe(true);
    expect(createUrlTreeFn).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(fakeUrlTree);
  });

  it('should call isLoggedIn exactly once per activation', () => {
    isLoggedInFn.mockReturnValue(true);
    runGuard();
    expect(isLoggedInFn).toHaveBeenCalledTimes(1);
  });
});
