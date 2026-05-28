import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { GuardianPaymentSummary, PaymentsService } from '../../services/payments.service';

@Component({
  selector: 'app-guardian-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './guardian-payments.component.html',
  styleUrl: './guardian-payments.component.css'
})
export class GuardianPaymentsComponent implements OnInit {
  guardianId = '00000000-0000-0000-0000-000000000005';
  summary: GuardianPaymentSummary | null = null;
  loading = false;
  errorMessage = '';

  constructor(private readonly paymentsService: PaymentsService) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    const trimmedGuardianId = this.guardianId.trim();
    if (!trimmedGuardianId) {
      this.errorMessage = 'Ingresa el identificador del acudiente.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.paymentsService.getGuardianPayments(trimmedGuardianId).subscribe({
      next: (summary) => {
        this.summary = summary;
        this.loading = false;
      },
      error: () => {
        this.summary = null;
        this.loading = false;
        this.errorMessage = 'No fue posible cargar el estado de pagos.';
      }
    });
  }

  asNumber(value: string): number {
    return Number(value);
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      PAID: 'Pagada',
      PENDING: 'Pendiente',
      OVERDUE: 'Vencida'
    };
    return labels[status] ?? status;
  }
}
