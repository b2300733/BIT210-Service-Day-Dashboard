import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login';
import { AdminDashboardPage } from './pages/admin-dashboard/admin-dashboard';
import { AdminActivitiesPage } from './pages/admin-activities/admin-activities';

export const routes: Routes = [
  { path: '', component: LoginPage },
  {
    path: 'admin-dashboard',
    component: AdminDashboardPage,
    children: [
      { path: '', redirectTo: 'activities', pathMatch: 'full' },
      { path: 'activities', component: AdminActivitiesPage },
      { path: 'participation', component: LoginPage }, // Replace with actual component
      { path: 'notifications', component: LoginPage }, // Replace with actual component
      { path: 'qr-checkin', component: LoginPage }, // Replace with actual component
    ],
  },
];
