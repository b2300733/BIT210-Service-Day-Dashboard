import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login';

import { AdminDashboardPage } from './pages/admin-dashboard/admin-dashboard';
import { AdminActivitiesPage } from './pages/admin-activities/admin-activities';
import { AdminParticipationMonitorPage } from './pages/admin-participation-monitor/admin-participation-monitor';
import { AdminNotificationsPage } from './pages/admin-notifications/admin-notifications';
import { AdminQrPage } from './pages/admin-qr/admin-qr';

import { EmployeeDashboardPage } from './pages/employee-dashboard/employee-dashboard';
import { EmployeeActivitiesComponent } from './pages/employee-activities/employee-activities';
import { EmployeeRegistrationsComponent } from './pages/employee-registrations/employee-registrations';
import { EmployeeNotificationsComponent } from './pages/employee-notifications/employee-notifications';
import { EmployeeCheckinComponent } from './pages/employee-qr/employee-qr';

export const routes: Routes = [
  { path: '', component: LoginPage },
  {
    path: 'admin-dashboard',
    component: AdminDashboardPage,
    children: [
      { path: '', redirectTo: 'activities', pathMatch: 'full' },
      { path: 'activities', component: AdminActivitiesPage },
      { path: 'participation', component: AdminParticipationMonitorPage },
      { path: 'notifications', component: AdminNotificationsPage },
      { path: 'qr-checkin', component: AdminQrPage },
    ],
  },
  {
    path: 'employee-dashboard',
    component: EmployeeDashboardPage,
    children: [
      { path: '', redirectTo: 'browse', pathMatch: 'full' },
      { path: 'browse', component: EmployeeActivitiesComponent },
      { path: 'registration', component: EmployeeRegistrationsComponent },
      { path: 'notifications', component: EmployeeNotificationsComponent },
      { path: 'qr-checkin', component: EmployeeCheckinComponent },
    ],
  },
  { path: 'login', component: LoginPage },
];
