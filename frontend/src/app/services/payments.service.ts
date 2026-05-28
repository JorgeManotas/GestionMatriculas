import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.config';

export interface GuardianFee {
  monthly_fee_id: string;
  enrollment_id: string;
  student_id: string;
  student_name: string;
  course_name: string;
  period: string;
  amount: string;
  due_date: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | string;
  paid_amount: string;
  balance: string;
  grade: string;
  monthly_fee_amount: string;
  enrollment_fee_amount: string;
}

export interface GuardianPaymentSummary {
  guardian_id: string;
  guardian_name: string;
  total_pending: string;
  total_overdue: string;
  fees: GuardianFee[];
}

export interface PaymentReport {
  id: string;
  student_id: string;
  student_name: string;
  student_document: string | null;
  amount: string;
  installments: number;
  receipt_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_by: string | null;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  constructor(private readonly http: HttpClient) {}

  getGuardianPayments(guardianId: string): Observable<GuardianPaymentSummary> {
    return this.http.get<GuardianPaymentSummary>(`${API_BASE_URL}/guardians/${guardianId}/payments`);
  }

  reportPayment(payload: { studentId: string; amount: number; installments: number; receipt: File }): Observable<PaymentReport> {
    const formData = new FormData();
    formData.append('student_id', payload.studentId);
    formData.append('amount', String(payload.amount));
    formData.append('installments', String(payload.installments));
    formData.append('receipt', payload.receipt);
    return this.http.post<PaymentReport>(`${API_BASE_URL}/payments/report`, formData);
  }

  getPendingReports(): Observable<PaymentReport[]> {
    return this.http.get<PaymentReport[]>(`${API_BASE_URL}/payments/reports/pending`);
  }

  verifyReport(reportId: string, reviewedBy: string, status: 'approved' | 'rejected'): Observable<PaymentReport> {
    return this.http.patch<PaymentReport>(`${API_BASE_URL}/payments/${reportId}/verify`, {
      reviewed_by: reviewedBy,
      status
    });
  }
}
