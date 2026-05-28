import { Component } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  template: `
    <section class="rounded-lg border border-ink-200 bg-white p-6 shadow-shell">
      <p class="text-sm font-black uppercase tracking-normal text-brand-600">Portal estudiante</p>
      <h2 class="mt-2 text-3xl font-black text-ink-900">Bienvenido, {{ fullName }}</h2>
      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <div class="rounded-lg bg-ink-50 p-4">
          <span class="text-xs font-bold text-ink-500">Correo institucional</span>
          <strong class="mt-2 block break-words text-sm font-black text-ink-900">{{ email }}</strong>
        </div>
        <div class="rounded-lg bg-ink-50 p-4">
          <span class="text-xs font-bold text-ink-500">Documento</span>
          <strong class="mt-2 block text-sm font-black text-ink-900">{{ document }}</strong>
        </div>
        <div class="rounded-lg bg-ink-50 p-4">
          <span class="text-xs font-bold text-ink-500">Estado</span>
          <strong class="mt-2 block text-sm font-black text-money-700">Matricula activa</strong>
        </div>
      </div>
    </section>
  `
})
export class StudentDashboardComponent {
  constructor(private readonly authService: AuthService) {}

  get fullName(): string {
    return this.authService.currentUser?.fullName ?? 'Estudiante';
  }

  get email(): string {
    return this.authService.currentUser?.email ?? '';
  }

  get document(): string {
    return this.resolveDocument();
  }

  private resolveDocument(): string {
    const attributes = this.authService.currentUser?.roleAttributes as { estudiante?: { documento_identidad?: string }; student?: { documento_identidad?: string } } | undefined;
    return attributes?.estudiante?.documento_identidad ?? attributes?.student?.documento_identidad ?? this.authService.currentUser?.documentNumber ?? 'No registrado';
  }
}
