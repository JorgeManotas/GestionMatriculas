import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.config';

export interface BulkUploadResult {
  created: number;
  skipped: number;
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly http: HttpClient) {}

  bulkUpload(file: File): Observable<BulkUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BulkUploadResult>(`${API_BASE_URL}/users/bulk-upload`, formData);
  }

  templateUrl(): string {
    return `${API_BASE_URL}/users/bulk-template`;
  }
}
