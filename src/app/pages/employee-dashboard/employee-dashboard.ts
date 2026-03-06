import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Heart, CalendarCheck, Search, Bell } from 'lucide-angular';
import { EmployeeNavbarComponent } from '../../components/employee-navbar/employee-navbar';
import { NotificationService } from '../../pages/employee-notifications/notification.service';
import { HeaderComponent } from '../../components/header/header';
import { COMMON_PAGES_MODULES } from '../../module/common.pages.module';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [EmployeeNavbarComponent, RouterOutlet, HeaderComponent, COMMON_PAGES_MODULES],
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
    this.notificationService.unreadCount$.subscribe((count) => (this.unreadCount = count));
  }
}
