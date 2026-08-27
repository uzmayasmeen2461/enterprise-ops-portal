import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { vi } from 'vitest';

import { LoginComponent } from './login.component';
import { AuthService } from '../../core/auth/auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let loginFn: ReturnType<typeof vi.fn>;
  let navigateFn: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loginFn   = vi.fn();
    navigateFn = vi.fn();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {
          provide: AuthService,
          useValue: { login: loginFn, logout: vi.fn(), getToken: vi.fn() }
        },
        // Provide a mock Router so navigate() doesn't trigger real routing
        // or fire zone errors when called after the test completes
        { provide: Router, useValue: { navigate: navigateFn } },
        provideAnimationsAsync()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creation ───────────────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render username and password fields', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('input[formControlName="username"]')).toBeTruthy();
    expect(el.querySelector('input[formControlName="password"]')).toBeTruthy();
  });

  // ── Form validation ────────────────────────────────────────────────────────

  it('should start with an invalid form', () => {
    expect(component.loginForm.invalid).toBe(true);
  });

  it('should mark username as invalid when empty', () => {
    component.username.setValue('');
    component.username.markAsTouched();
    expect(component.username.invalid).toBe(true);
    expect(component.username.errors?.['required']).toBe(true);
  });

  it('should mark username invalid when shorter than 3 characters', () => {
    component.username.setValue('ab');
    component.username.markAsTouched();
    expect(component.username.errors?.['minlength']).toBeTruthy();
  });

  it('should mark username valid when 3+ characters provided', () => {
    component.username.setValue('admin');
    expect(component.username.valid).toBe(true);
  });

  it('should mark password invalid when shorter than 6 characters', () => {
    component.password.setValue('abc');
    component.password.markAsTouched();
    expect(component.password.errors?.['minlength']).toBeTruthy();
  });

  it('should be valid when both fields are correctly filled', () => {
    component.username.setValue('admin');
    component.password.setValue('admin123');
    expect(component.loginForm.valid).toBe(true);
  });

  // ── onSubmit() — invalid form ──────────────────────────────────────────────

  it('should not call authService.login if the form is invalid', () => {
    component.onSubmit();
    expect(loginFn).not.toHaveBeenCalled();
  });

  it('should mark all fields as touched when submitting an invalid form', () => {
    component.onSubmit();
    expect(component.username.touched).toBe(true);
    expect(component.password.touched).toBe(true);
  });

  // ── onSubmit() — valid form ────────────────────────────────────────────────
  // Note: the 800ms setTimeout in onSubmit() makes timer-based assertions
  // incompatible with Angular's TestBed zone in Vitest. We verify the
  // synchronous side effects (loading state, guard call) directly instead.

  it('should set loading to true immediately on valid submission', () => {
    loginFn.mockReturnValue(true);
    component.username.setValue('admin');
    component.password.setValue('admin123');

    component.onSubmit();

    // loading is set synchronously at the top of onSubmit(), before setTimeout
    expect(component.loading()).toBe(true);
  });

  it('should call authService.login with form values once timeout fires', async () => {
    loginFn.mockReturnValue(true);
    component.username.setValue('admin');
    component.password.setValue('admin123');

    component.onSubmit();
    await new Promise(resolve => setTimeout(resolve, 900));

    expect(loginFn).toHaveBeenCalledWith('admin', 'admin123');
    // Destroy before test teardown to prevent zone errors from pending navigate()
    fixture.destroy();
  });

  it('should set loginError signal after failed login timeout', async () => {
    loginFn.mockReturnValue(false);
    component.username.setValue('admin');
    component.password.setValue('wrongpassword');

    component.onSubmit();
    await new Promise(resolve => setTimeout(resolve, 900));

    expect(component.loginError()).toContain('Invalid');
    expect(component.loading()).toBe(false);
    fixture.destroy();
  });

  // ── Password visibility ────────────────────────────────────────────────────

  it('should start with password hidden', () => {
    expect(component.hidePassword()).toBe(true);
  });

  it('should toggle password visibility', () => {
    component.togglePasswordVisibility();
    expect(component.hidePassword()).toBe(false);

    component.togglePasswordVisibility();
    expect(component.hidePassword()).toBe(true);
  });
});
