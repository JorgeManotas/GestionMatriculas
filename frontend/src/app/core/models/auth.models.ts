export type UserRole = 'ADMIN' | 'RECTOR' | 'SECRETARY' | 'TEACHER' | 'GUARDIAN' | 'STUDENT';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  avatarInitials: string;
  roleAttributes: Record<string, unknown>;
  documentNumber?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
