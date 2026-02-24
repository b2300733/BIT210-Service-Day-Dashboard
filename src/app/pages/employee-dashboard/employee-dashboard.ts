import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule, Heart, CalendarCheck, Search, Bell } from 'lucide-angular';
import { EmployeeNavbarComponent } from '../../components/employee-navbar/employee-navbar';
import { NotificationService } from '../../pages/employee-notifications/notification.service';
import { HeaderComponent } from '../../components/header/header'; 


@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [EmployeeNavbarComponent, MatCardModule, RouterOutlet, LucideAngularModule, HeaderComponent],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css',
})
export class EmployeeDashboardPage implements OnInit {
  readonly Heart = Heart;
  readonly CalendarCheck = CalendarCheck;
  readonly Search = Search;
  readonly Bell = Bell;

  unreadCount = 0;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.unreadCount$.subscribe(count => this.unreadCount = count);
  }
}