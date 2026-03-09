import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Heart,
  Bell,
  LogOut,
  CheckCheck,
  Megaphone,
  Check,
} from 'lucide-angular';
import {
  NotificationService,
  Notification,
} from '../../pages/employee-notifications/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './header.html',
})
export class HeaderComponent implements OnInit {
  readonly Heart = Heart;
  readonly Bell = Bell;
  readonly LogOut = LogOut;
  readonly CheckCheck = CheckCheck;
  readonly Megaphone = Megaphone;
  readonly Check = Check;

  unreadCount = 0;
  notifications: Notification[] = [];
  isDropdownOpen = false;

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    public authService: AuthService,
  ) {}

  ngOnInit() {
    this.notificationService.unreadCount$.subscribe((count) => (this.unreadCount = count));
    this.notificationService.notifications$.subscribe((data) => (this.notifications = data));
  }

  markAllRead() {
    this.notificationService.markAllRead();
    this.isDropdownOpen = false;
  }

  signOut() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
