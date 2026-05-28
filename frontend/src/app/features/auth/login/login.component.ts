import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loading = false;
  errorMessage = '';

  readonly loginForm = this.formBuilder.group({
    email: ['carlos.torres@colegiosol.edu.co', [Validators.required, Validators.email]],
    password: ['User12345*', [Validators.required, Validators.minLength(8)]]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  submit(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const credentials = this.loginForm.getRawValue();

    this.authService.login({
      email: credentials.email ?? '',
      password: credentials.password ?? ''
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/app/dashboard');
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = error.error?.detail || 'Credenciales invalidas. Verifica el correo y la contrasena.';
      }
    });
  }

  fieldHasError(fieldName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }
}
