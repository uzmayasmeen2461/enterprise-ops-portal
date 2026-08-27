import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  // inject() is the modern Angular DI function (replaces constructor injection)
  // React equivalent: const authService = useContext(AuthContext)
  private authService = inject(AuthService);
  private router = inject(Router);

  // FormBuilder is a helper service that reduces FormGroup/FormControl boilerplate
  // inject() works here because FormBuilder is providedIn: 'root'
  private fb = inject(FormBuilder);

  // UI state signals
  loading = signal(false);
  loginError = signal('');
  hidePassword = signal(true);

  // The form — strongly typed with FormGroup
  // FormBuilder.group() is shorthand for new FormGroup({ ... })
  loginForm: FormGroup = this.fb.group({
    // [initialValue, [validators]]
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Convenience getters — avoids verbose this.loginForm.get('username') everywhere
  get username() { return this.loginForm.get('username')!; }
  get password() { return this.loginForm.get('password')!; }

  onSubmit(): void {
    // Mark all fields as touched so validation messages appear
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.loginError.set('');

    // Simulate network delay — in Phase 5 this becomes a real HTTP call
    setTimeout(() => {
      const { username, password } = this.loginForm.value;
      const success = this.authService.login(username, password);

      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.loginError.set('Invalid username or password. Try admin/admin123');
        this.loading.set(false);
      }
    }, 800);
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }
}
