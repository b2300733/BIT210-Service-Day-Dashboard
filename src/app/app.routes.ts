import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login';
import { AdminDashboardPage } from './pages/admin-dashboard/admin-dashboard';

export const routes: Routes = [
  { path: '', component: LoginPage },
  { path: 'admin-dashboard', component: AdminDashboardPage },
];
