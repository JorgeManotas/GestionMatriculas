import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { AuthUser } from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';

interface NavigationItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {
  collapsed = false;

  readonly navigationItems: NavigationItem[] = [
    { label: 'Dashboard', path: '/app/dashboard', icon: 'dashboard' },
    { label: 'Estudiantes', path: '/app/students', icon: 'students' },
    { label: 'Pagos', path: '/app/payments', icon: 'payments' },
    { label: 'Configuracion', path: '/app/settings', icon: 'settings' }
  ];

  readonly currentUser$ = this.authService.currentUser$;
  readonly currentRoute$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event) => event.urlAfterRedirects),
    startWith(this.router.url)
  );

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
  }

  isActive(item: NavigationItem, currentRoute: string | null): boolean {
    if (!currentRoute) {
      return false;
    }

    if (item.path === '/app/dashboard') {
      return currentRoute.startsWith('/app/dashboard');
    }

    return currentRoute.startsWith(item.path);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  notificationCount(user: AuthUser | null): number {
    return user?.role === 'ADMIN' || user?.role === 'RECTOR' || user?.role === 'SECRETARY' ? 7 : 2;
  }

  roleLabel(user: AuthUser): string {
    const labels: Record<AuthUser['role'], string> = {
      ADMIN: 'Administrador',
      RECTOR: 'Rector',
      SECRETARY: 'Secretaria',
      TEACHER: 'Docente',
      GUARDIAN: 'Acudiente',
      STUDENT: 'Estudiante'
    };
    return labels[user.role];
  }
}
