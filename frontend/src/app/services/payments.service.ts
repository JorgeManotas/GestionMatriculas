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
}

export interface GuardianPaymentSummary {
  guardian_id: string;
  guardian_name: string;
  total_pending: string;
  total_overdue: string;
  fees: GuardianFee[];
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  constructor(private readonly http: HttpClient) {}

  getGuardianPayments(guardianId: string): Observable<GuardianPaymentSummary> {
    return this.http.get<GuardianPaymentSummary>(`${API_BASE_URL}/guardians/${guardianId}/payments`);
  }
}
