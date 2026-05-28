import { Component } from '@angular/core';
import { GuardianPaymentsComponent } from './components/guardian-payments/guardian-payments.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GuardianPaymentsComponent],
  template: `
    <main class="app-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Colegio Sol</p>
          <h1>Gestion de mensualidades</h1>
        </div>
      </header>
      <app-guardian-payments />
    </main>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      padding: 24px;
    }

    .topbar {
      max-width: 1180px;
      margin: 0 auto 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .eyebrow {
      margin: 0 0 4px;
      color: var(--primary);
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    h1 {
      margin: 0;
      font-size: 1.65rem;
    }

    @media (max-width: 680px) {
      .app-shell {
        padding: 14px;
      }
    }
  `]
})
export class AppComponent {}
