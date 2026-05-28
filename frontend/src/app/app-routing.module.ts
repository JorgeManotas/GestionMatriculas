import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './features/auth/login/login.component';
import { AdminDashboardComponent } from './features/dashboard/admin-dashboard/admin-dashboard.component';
import { GuardianDashboardComponent } from './features/dashboard/guardian-dashboard/guardian-dashboard.component';
import { StudentDashboardComponent } from './features/dashboard/student-dashboard/student-dashboard.component';
import { TeacherDashboardComponent } from './features/dashboard/teacher-dashboard/teacher-dashboard.component';
import { PaymentsPageComponent } from './features/payments/payments-page.component';
import { SettingsPageComponent } from './features/settings/settings-page.component';
import { StudentsPageComponent } from './features/students/students-page.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './shared/guards/auth.guard';
import { dashboardRedirectGuard } from './shared/guards/dashboard-redirect.guard';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [dashboardRedirectGuard],
        children: []
      },
      {
        path: 'dashboard/acudiente',
        component: GuardianDashboardComponent
      },
      {
        path: 'dashboard/admin',
        component: AdminDashboardComponent
      },
      {
        path: 'dashboard/docente',
        component: TeacherDashboardComponent
      },
      {
        path: 'dashboard/estudiante',
        component: StudentDashboardComponent
      },
      {
        path: 'students',
        component: StudentsPageComponent
      },
      {
        path: 'payments',
        component: PaymentsPageComponent
      },
      {
        path: 'settings',
        component: SettingsPageComponent
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { bindToComponentInputs: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
