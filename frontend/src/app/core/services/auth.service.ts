import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

import { AuthUser, LoginCredentials } from '../models/auth.models';
import { API_BASE_URL } from '../../services/api.config';

const AUTH_STORAGE_KEY = 'colegio_sol_auth_user';

interface AuthUserResponse {
  id: string;
  full_name: string;
  email: string;
  role: AuthUser['role'];
  roles: AuthUser['role'][];
  avatar_initials: string;
  role_attributes: Record<string, unknown>;
  document_number?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.readStoredUser());

  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly isAuthenticated$ = this.currentUser$.pipe(map(Boolean));

  constructor(private readonly http: HttpClient) {}

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginCredentials): Observable<AuthUser> {
    return this.http.post<AuthUserResponse>(`${API_BASE_URL}/auth/login`, credentials).pipe(
      map((response) => this.mapAuthUser(response)),
      tap((user) => {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.currentUserSubject.next(null);
  }

  private readStoredUser(): AuthUser | null {
    const rawValue = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as AuthUser;
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  }

  private mapAuthUser(response: AuthUserResponse): AuthUser {
    return {
      id: response.id,
      fullName: response.full_name,
      email: response.email,
      role: response.role,
      roles: response.roles,
      avatarInitials: response.avatar_initials,
      roleAttributes: response.role_attributes,
      documentNumber: response.document_number
    };
  }
}
