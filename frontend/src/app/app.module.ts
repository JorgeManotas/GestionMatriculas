import { CommonModule, registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './features/auth/login/login.component';
import { AdminDashboardComponent } from './features/dashboard/admin-dashboard/admin-dashboard.component';
import { GuardianDashboardComponent } from './features/dashboard/guardian-dashboard/guardian-dashboard.component';
import { StudentDashboardComponent } from './features/dashboard/student-dashboard/student-dashboard.component';
import { TeacherDashboardComponent } from './features/dashboard/teacher-dashboard/teacher-dashboard.component';
import { PaymentsPageComponent } from './features/payments/payments-page.component';
import { SettingsPageComponent } from './features/settings/settings-page.component';
import { StudentsPageComponent } from './features/students/students-page.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

registerLocaleData(localeEsCo);

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MainLayoutComponent,
    GuardianDashboardComponent,
    AdminDashboardComponent,
    TeacherDashboardComponent,
    StudentDashboardComponent,
    StudentsPageComponent,
    PaymentsPageComponent,
    SettingsPageComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    AppRoutingModule
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'es-CO' }],
  bootstrap: [AppComponent]
})
export class AppModule {}
