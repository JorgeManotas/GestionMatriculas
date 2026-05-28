import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { API_BASE_URL } from '../../services/api.config';
import { PaymentReport, PaymentsService } from '../../services/payments.service';

@Component({
  selector: 'app-payments-page',
  templateUrl: './payments-page.component.html',
  styleUrls: ['./payments-page.component.css']
})
export class PaymentsPageComponent implements OnInit {
  loading = false;
  errorMessage = '';
  successMessage = '';
  reports: PaymentReport[] = [];
  selectedReport: PaymentReport | null = null;

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPendingReports();
  }

  get canAudit(): boolean {
    const role = this.authService.currentUser?.role;
    return role === 'ADMIN' || role === 'RECTOR' || role === 'SECRETARY';
  }

  receiptUrl(report: PaymentReport): string {
    return `${API_BASE_URL.replace('/api', '')}${report.receipt_url}`;
  }

  loadPendingReports(): void {
    if (!this.canAudit) {
      return;
    }

    this.loading = true;
    this.paymentsService.getPendingReports().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los pagos pendientes.';
      }
    });
  }

  verify(report: PaymentReport, status: 'approved' | 'rejected'): void {
    const reviewerId = this.authService.currentUser?.id;
    if (!reviewerId) {
      return;
    }

    this.loading = true;
    this.paymentsService.verifyReport(report.id, reviewerId, status).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = status === 'approved' ? 'Pago aprobado correctamente.' : 'Pago rechazado correctamente.';
        this.selectedReport = null;
        this.loadPendingReports();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible actualizar el estado del pago.';
      }
    });
  }
}
