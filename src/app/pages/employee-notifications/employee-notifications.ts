import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bell, CheckCheck, Megaphone, Check } from 'lucide-angular';
import { NotificationService, Notification } from './notification.service';

@Component({
  selector: 'app-employee-notifications',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './employee-notifications.html',
})
export class EmployeeNotificationsComponent implements OnInit {
  readonly Bell = Bell;
  readonly CheckCheck = CheckCheck;
  readonly Megaphone = Megaphone;
  readonly Check = Check;

  notifications: Notification[] = [];
  unreadCount = 0;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.notifications$.subscribe(data => this.notifications = data);
    this.notificationService.unreadCount$.subscribe(count => this.unreadCount = count);
  }

  markAllRead() {
    this.notificationService.markAllRead();
  }
}