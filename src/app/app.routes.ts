import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login';
import { AdminDashboardPage } from './pages/admin-dashboard/admin-dashboard';
import { AdminActivitiesPage } from './pages/admin-activities/admin-activities';
import { AdminParticipationMonitorPage } from './pages/admin-participation-monitor/admin-participation-monitor';

import { EmployeeDashboardPage } from './pages/employee-dashboard/employee-dashboard';

export const routes: Routes = [
  { path: '', component: LoginPage },
  {
    path: 'admin-dashboard',
    component: AdminDashboardPage,
    children: [
      { path: '', redirectTo: 'activities', pathMatch: 'full' },
      { path: 'activities', component: AdminActivitiesPage },
      { path: 'participation', component: AdminParticipationMonitorPage },
      { path: 'notifications', component: LoginPage }, // Replace with actual component
      { path: 'qr-checkin', component: LoginPage }, // Replace with actual component
    ],
  },
  {
    path: 'employee-dashboard',
    component: EmployeeDashboardPage,
    children: [
      { path: '', redirectTo: 'browse', pathMatch: 'full' },
      { path: 'browse', component: LoginPage }, // Replace with actual component
      { path: 'registration', component: LoginPage }, // Replace with actual component
      { path: 'notifications', component: LoginPage }, // Replace with actual component
      { path: 'qr-checkin', component: LoginPage }, // Replace with actual component
    ],
  },
  { path: 'login', component: LoginPage },
];
