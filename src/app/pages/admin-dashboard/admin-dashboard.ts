import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule, Building2, Users, UserCheck, UserX } from 'lucide-angular';
import { AdminNavbarComponent } from '../../components/admin-navbar/admin-navbar';

@Component({
  selector: 'app-admin-dashboard',
  imports: [LucideAngularModule, MatCardModule, AdminNavbarComponent, RouterOutlet],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboardPage {
  readonly Building2 = Building2;
  readonly Users = Users;
  readonly UserCheck = UserCheck;
  readonly UserX = UserX;
}
