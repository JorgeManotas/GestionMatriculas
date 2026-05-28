import { Component } from '@angular/core';

@Component({
  selector: 'app-settings-page',
  template: `
    <section class="rounded-lg border border-ink-200 bg-white p-6 shadow-shell">
      <p class="text-sm font-black uppercase tracking-normal text-brand-600">Configuracion</p>
      <h2 class="mt-2 text-2xl font-black text-ink-900">Parametros del sistema</h2>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
        Espacio reservado para roles, permisos, valores de mensualidad, periodos y notificaciones.
      </p>
    </section>
  `
})
export class SettingsPageComponent {}
