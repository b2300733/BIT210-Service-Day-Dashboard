import { Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule, Building2, Users, UserCheck, UserX } from 'lucide-angular';
import { AdminNavbarComponent } from '../../components/admin-navbar/admin-navbar';
import { ActivitiesService } from '../../services/activities.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [LucideAngularModule, MatCardModule, AdminNavbarComponent, RouterOutlet],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboardPage implements OnInit {
  readonly Building2 = Building2;
  readonly Users = Users;
  readonly UserCheck = UserCheck;
  readonly UserX = UserX;

  private activitiesService = inject(ActivitiesService);

  totalActivities = 0;
  totalSlots = 0;
  totalRegistered = 0;
  totalAvailable = 0;

  ngOnInit() {
    this.activitiesService.activities$.subscribe(() => {
      const stats = this.activitiesService.getStatistics();
      this.totalActivities = stats.totalActivities;
      this.totalSlots = stats.totalSlots;
      this.totalRegistered = stats.totalRegistered;
      this.totalAvailable = stats.totalAvailable;
    });
  }
}
