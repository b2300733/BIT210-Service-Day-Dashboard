import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

export interface Notification {
  id: number;
  type: 'success' | 'reminder' | 'update';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private initialNotifications: Notification[] = [
    {
      id: 1, type: 'success', title: 'Registration Confirmed',
      message: 'You have successfully registered for Green Earth Foundation activity.',
      timestamp: '2/1/2026, 6:00:00 PM', isRead: true
    },
    {
      id: 2, type: 'reminder', title: 'Upcoming Activity Reminder',
      message: 'Green Earth Foundation activity is in 3 days (March 15). 7 slots still available!',
      timestamp: '3/12/2026, 5:00:00 PM', isRead: false
    },
    {
      id: 3, type: 'update', title: 'Service Day Update',
      message: 'Reminder: Please complete your registrations before the cutoff dates. We still have openings across multiple activities!',
      timestamp: '3/10/2026, 4:00:00 PM', isRead: false
    }
  ];

  private notificationsSubject = new BehaviorSubject<Notification[]>(this.initialNotifications);
  
  notifications$ = this.notificationsSubject.asObservable();
  
  unreadCount$ = this.notificationsSubject.pipe(
    map(notifications => notifications.filter(n => !n.isRead).length)
  );

  markAllRead() {
    const updated = this.notificationsSubject.value.map(n => ({ ...n, isRead: true }));
    this.notificationsSubject.next(updated);
  }
}