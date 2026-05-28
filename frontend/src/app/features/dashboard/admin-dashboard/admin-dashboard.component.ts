import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <section class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm font-black uppercase tracking-normal text-brand-600">Dashboard administrador</p>
          <h2 class="mt-2 text-3xl font-black text-ink-900">Indicadores globales del colegio</h2>
        </div>
        <span class="rounded-full bg-money-50 px-4 py-2 text-sm font-black text-money-700">Corte mensual activo</span>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <article class="rounded-lg border border-ink-200 bg-white p-5 shadow-shell">
          <p class="text-sm font-bold text-ink-500">Recaudacion del mes</p>
          <strong class="mt-3 block text-3xl font-black text-ink-900">$18.420.000</strong>
          <div class="mt-5 h-2 rounded-full bg-ink-100">
            <div class="h-2 w-[78%] rounded-full bg-money-500"></div>
          </div>
        </article>

        <article class="rounded-lg border border-ink-200 bg-white p-5 shadow-shell">
          <p class="text-sm font-bold text-ink-500">Morosidad</p>
          <strong class="mt-3 block text-3xl font-black text-danger-700">12.8%</strong>
          <div class="mt-5 grid h-28 grid-cols-8 items-end gap-2">
            <span class="h-[30%] rounded-t bg-danger-50"></span>
            <span class="h-[45%] rounded-t bg-danger-100"></span>
            <span class="h-[36%] rounded-t bg-danger-100"></span>
            <span class="h-[56%] rounded-t bg-danger-500"></span>
            <span class="h-[42%] rounded-t bg-danger-100"></span>
            <span class="h-[68%] rounded-t bg-danger-500"></span>
            <span class="h-[52%] rounded-t bg-danger-100"></span>
            <span class="h-[40%] rounded-t bg-danger-100"></span>
          </div>
        </article>

        <article class="rounded-lg border border-ink-200 bg-white p-5 shadow-shell">
          <p class="text-sm font-bold text-ink-500">Estudiantes matriculados</p>
          <strong class="mt-3 block text-3xl font-black text-ink-900">426</strong>
          <div class="mt-5 flex items-center gap-4">
            <div class="grid h-24 w-24 place-items-center rounded-full bg-[conic-gradient(#1f8a5b_0_72%,#e9eef5_72%_100%)]">
              <div class="grid h-16 w-16 place-items-center rounded-full bg-white text-sm font-black text-money-700">72%</div>
            </div>
            <p class="text-sm leading-6 text-ink-500">Cupos ocupados sobre capacidad institucional 2026.</p>
          </div>
        </article>
      </div>
    </section>
  `
})
export class AdminDashboardComponent {}
