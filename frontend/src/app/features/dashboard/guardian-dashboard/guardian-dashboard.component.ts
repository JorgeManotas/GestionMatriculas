import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, Subject, combineLatest, debounceTime, map, startWith, takeUntil } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { GuardianFee, GuardianPaymentSummary, PaymentsService } from '../../../services/payments.service';

interface ChildFinancialCard {
  studentId: string;
  studentName: string;
  courseName: string;
  academicStatus: string;
  financialStatus: 'PAID' | 'PENDING' | 'OVERDUE';
  totalBalance: number;
  overdueBalance: number;
  pendingInvoices: number;
}

interface GuardianDashboardViewModel {
  summary: GuardianPaymentSummary;
  totalBalance: number;
  totalPaid: number;
  nextDueFee: GuardianFee | null;
  overdueCount: number;
  children: ChildFinancialCard[];
}

@Component({
  selector: 'app-guardian-dashboard',
  templateUrl: './guardian-dashboard.component.html',
  styleUrls: ['./guardian-dashboard.component.css']
})
export class GuardianDashboardComponent implements OnInit, OnDestroy {
  loading = true;
  errorMessage = '';

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl('ALL', { nonNullable: true });

  private readonly destroy$ = new Subject<void>();
  private readonly viewModelSubject = new BehaviorSubject<GuardianDashboardViewModel | null>(null);

  readonly viewModel$ = this.viewModelSubject.asObservable();
  readonly filteredFees$ = combineLatest([
    this.viewModel$,
    this.searchControl.valueChanges.pipe(startWith(this.searchControl.value), debounceTime(140)),
    this.statusControl.valueChanges.pipe(startWith(this.statusControl.value))
  ]).pipe(
    map(([viewModel, searchValue, statusValue]) => {
      if (!viewModel) {
        return [];
      }

      const normalizedSearch = searchValue.trim().toLowerCase();
      return viewModel.summary.fees.filter((fee) => {
        const matchesSearch = !normalizedSearch || fee.student_name.toLowerCase().includes(normalizedSearch);
        const matchesStatus = statusValue === 'ALL' || fee.status === statusValue;
        return matchesSearch && matchesStatus;
      });
    })
  );

  constructor(
    private readonly authService: AuthService,
    private readonly paymentsService: PaymentsService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.loading = false;
      this.errorMessage = 'No hay una sesion activa.';
      return;
    }

    this.paymentsService.getGuardianPayments(currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.viewModelSubject.next(this.buildViewModel(summary));
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'No fue posible cargar la informacion financiera del acudiente.';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  asNumber(value: string): number {
    return Number(value);
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      PAID: 'Al dia',
      PENDING: 'Pendiente',
      OVERDUE: 'Vencido'
    };
    return labels[status] ?? status;
  }

  childStatusLabel(status: ChildFinancialCard['financialStatus']): string {
    return status === 'PAID' ? 'Al dia' : this.statusLabel(status);
  }

  private buildViewModel(summary: GuardianPaymentSummary): GuardianDashboardViewModel {
    const unpaidFees = summary.fees.filter((fee) => this.asNumber(fee.balance) > 0);
    const nextDueFee = [...unpaidFees].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0] ?? null;
    const totalBalance = unpaidFees.reduce((total, fee) => total + this.asNumber(fee.balance), 0);
    const totalPaid = summary.fees.reduce((total, fee) => total + this.asNumber(fee.paid_amount), 0);
    const overdueCount = summary.fees.filter((fee) => fee.status === 'OVERDUE').length;

    return {
      summary,
      totalBalance,
      totalPaid,
      nextDueFee,
      overdueCount,
      children: this.buildChildren(summary.fees)
    };
  }

  private buildChildren(fees: GuardianFee[]): ChildFinancialCard[] {
    const grouped = new Map<string, GuardianFee[]>();

    for (const fee of fees) {
      const current = grouped.get(fee.student_id) ?? [];
      current.push(fee);
      grouped.set(fee.student_id, current);
    }

    return Array.from(grouped.entries()).map(([studentId, studentFees]) => {
      const overdueBalance = studentFees
        .filter((fee) => fee.status === 'OVERDUE')
        .reduce((total, fee) => total + this.asNumber(fee.balance), 0);
      const totalBalance = studentFees.reduce((total, fee) => total + this.asNumber(fee.balance), 0);
      const financialStatus = overdueBalance > 0 ? 'OVERDUE' : totalBalance > 0 ? 'PENDING' : 'PAID';

      return {
        studentId,
        studentName: studentFees[0].student_name,
        courseName: studentFees[0].course_name,
        academicStatus: 'Matricula activa',
        financialStatus,
        totalBalance,
        overdueBalance,
        pendingInvoices: studentFees.filter((fee) => fee.status !== 'PAID').length
      };
    });
  }
}
