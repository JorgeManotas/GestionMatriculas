import { Component } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';

interface TeacherSubject {
  curso: string;
  nombre: string;
}

@Component({
  selector: 'app-teacher-dashboard',
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-black uppercase tracking-normal text-brand-600">Dashboard docente</p>
        <h2 class="mt-2 text-3xl font-black text-ink-900">Cursos asignados</h2>
        <p class="mt-2 text-sm text-ink-500">Materias leidas desde los atributos dinamicos JSONB del usuario.</p>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <article *ngFor="let subject of subjects" class="rounded-lg border border-ink-200 bg-white p-5 shadow-shell">
          <p class="text-sm font-bold text-ink-500">{{ subject.curso }}</p>
          <h3 class="mt-2 text-xl font-black text-ink-900">{{ subject.nombre }}</h3>
          <span class="mt-5 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">Activo 2026</span>
        </article>
      </div>
    </section>
  `
})
export class TeacherDashboardComponent {
  constructor(private readonly authService: AuthService) {}

  get subjects(): TeacherSubject[] {
    return this.resolveSubjects();
  }

  private resolveSubjects(): TeacherSubject[] {
    const attributes = this.authService.currentUser?.roleAttributes as { docente?: { materias?: TeacherSubject[] }; teacher?: { materias?: TeacherSubject[] } } | undefined;
    return attributes?.docente?.materias ?? attributes?.teacher?.materias ?? [];
  }
}
