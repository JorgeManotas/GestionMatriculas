import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { GuardianFee, GuardianPaymentSummary, PaymentsService } from '../../services/payments.service';
import { BulkUploadResult, UsersService } from '../../services/users.service';

interface StudentCard {
  id: string;
  name: string;
  grade: string;
  course: string;
  enrollmentFee: number;
  monthlyFee: number;
  financialStatus: 'PAID' | 'PENDING' | 'OVERDUE';
  balance: number;
  periods: string[];
}

@Component({
  selector: 'app-students-page',
  templateUrl: './students-page.component.html',
  styleUrls: ['./students-page.component.css']
})
export class StudentsPageComponent implements OnInit {
  loading = false;
  errorMessage = '';
  successMessage = '';
  guardianSummary: GuardianPaymentSummary | null = null;
  students: StudentCard[] = [];
  selectedStudent: StudentCard | null = null;
  selectedReceipt: File | null = null;
  bulkResult: BulkUploadResult | null = null;

  readonly reportForm = this.formBuilder.group({
    installments: [1, [Validators.required, Validators.min(1)]],
    amount: [0, [Validators.required, Validators.min(1)]]
  });

  constructor(
    private readonly authService: AuthService,
    private readonly paymentsService: PaymentsService,
    private readonly usersService: UsersService,
    private readonly formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    if (this.isGuardian) {
      this.loadGuardianStudents();
    }
  }

  get isGuardian(): boolean {
    return this.authService.currentUser?.role === 'GUARDIAN';
  }

  get canImportUsers(): boolean {
    const role = this.authService.currentUser?.role;
    return role === 'ADMIN' || role === 'RECTOR' || role === 'SECRETARY';
  }

  get templateUrl(): string {
    return this.usersService.templateUrl();
  }

  openReport(student: StudentCard): void {
    this.selectedStudent = student;
    this.selectedReceipt = null;
    this.successMessage = '';
    this.errorMessage = '';
    this.reportForm.reset({
      installments: Math.max(1, student.periods.length),
      amount: Math.max(1, student.balance)
    });
  }

  closeReport(): void {
    this.selectedStudent = null;
    this.selectedReceipt = null;
  }

  onReceiptSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedReceipt = input.files?.[0] ?? null;
  }

  submitReport(): void {
    if (!this.selectedStudent || this.reportForm.invalid || !this.selectedReceipt) {
      this.reportForm.markAllAsTouched();
      this.errorMessage = 'Completa monto, cuotas y comprobante.';
      return;
    }

    const value = this.reportForm.getRawValue();
    this.loading = true;
    this.errorMessage = '';
    this.paymentsService.reportPayment({
      studentId: this.selectedStudent.id,
      amount: Number(value.amount),
      installments: Number(value.installments),
      receipt: this.selectedReceipt
    }).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Pago reportado correctamente. Queda pendiente de auditoria.';
        this.closeReport();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible reportar el pago.';
      }
    });
  }

  onBulkFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.usersService.bulkUpload(file).subscribe({
      next: (result) => {
        this.loading = false;
        this.bulkResult = result;
        this.successMessage = `Importacion finalizada: ${result.created} creados, ${result.skipped} omitidos.`;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible importar el archivo Excel.';
      }
    });
  }

  asNumber(value: string): number {
    return Number(value);
  }

  statusLabel(status: StudentCard['financialStatus']): string {
    return status === 'PAID' ? 'Al dia' : status === 'PENDING' ? 'Pendiente' : 'Vencido';
  }

  private loadGuardianStudents(): void {
    const userId = this.authService.currentUser?.id;
    if (!userId) {
      return;
    }

    this.loading = true;
    this.paymentsService.getGuardianPayments(userId).subscribe({
      next: (summary) => {
        this.guardianSummary = summary;
        this.students = this.buildStudentCards(summary.fees);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los estudiantes asociados.';
      }
    });
  }

  private buildStudentCards(fees: GuardianFee[]): StudentCard[] {
    const grouped = new Map<string, GuardianFee[]>();
    for (const fee of fees) {
      grouped.set(fee.student_id, [...(grouped.get(fee.student_id) ?? []), fee]);
    }

    return Array.from(grouped.entries()).map(([studentId, studentFees]) => {
      const balance = studentFees.reduce((total, fee) => total + this.asNumber(fee.balance), 0);
      const hasOverdue = studentFees.some((fee) => fee.status === 'OVERDUE');
      return {
        id: studentId,
        name: studentFees[0].student_name,
        grade: studentFees[0].grade,
        course: studentFees[0].course_name,
        enrollmentFee: this.asNumber(studentFees[0].enrollment_fee_amount),
        monthlyFee: this.asNumber(studentFees[0].monthly_fee_amount),
        financialStatus: hasOverdue ? 'OVERDUE' : balance > 0 ? 'PENDING' : 'PAID',
        balance,
        periods: studentFees.filter((fee) => fee.status !== 'PAID').map((fee) => fee.period)
      };
    });
  }
}
