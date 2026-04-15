import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Send, CalendarClock, Clock, CircleCheck } from 'lucide-angular';
import { MatDialogActions } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivitiesService } from '../../../../backend/services/activities.service';
import { RegistrationsService } from '../../../../backend/services/registrations.service';
import { UsersService } from '../../../../backend/services/users.service';
import { Activity } from '../../models/activity.model';
import { COMMON_PAGES_MODULES } from '../../module/common.pages.module';
import { environment } from '../../../environments/environment';

export interface ScheduledReminder {
  activity: string;
  type: string;
  scheduledFor: string;
  status: 'sent' | 'pending';
}

@Component({
  selector: 'app-admin-notifications',
  imports: [
    CommonModule,
    COMMON_PAGES_MODULES,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatSortModule,
    ReactiveFormsModule,
    MatDialogActions,
  ],
  templateUrl: './admin-notifications.html',
  styleUrl: './admin-notifications.css',
})
export class AdminNotificationsPage implements AfterViewInit, OnInit {
  readonly Send = Send;
  readonly CalendarClock = CalendarClock;
  readonly Clock = Clock;
  readonly CircleCheck = CircleCheck;

  private _liveAnnouncer = inject(LiveAnnouncer);
  private _snackBar = inject(MatSnackBar);
  private activitiesService = inject(ActivitiesService);
  private registrationsService = inject(RegistrationsService);
  private usersService = inject(UsersService);

  private showSnackbar(message: string): void {
    this._snackBar.open(message, '', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-error'],
    });
  }

  broadcastForm: FormGroup;
  scheduleForm: FormGroup;

  activities: string[] = [];
  private activityDetails: Activity[] = [];

  intervalOptions = [
    { value: '1-week', label: '1 week before' },
    { value: '3-day', label: '3 days before' },
    { value: '1-day', label: '1 day before' },
  ];

  displayedColumns: string[] = ['activity', 'type', 'scheduledFor', 'status', 'action'];

  dataSource = new MatTableDataSource<ScheduledReminder>([]);

  @ViewChild(MatSort) sort!: MatSort;

  constructor(private fb: FormBuilder) {
    this.broadcastForm = this.fb.group({
      title: ['', Validators.required],
      message: ['', Validators.required],
    });
    this.scheduleForm = this.fb.group({
      activity: [''],
      interval: ['1-week'],
    });
  }

  ngOnInit() {
    this.activitiesService.activities$.subscribe((activities: Activity[]) => {
      this.activityDetails = activities;
      this.activities = activities.map((activity) => activity.name);
    });

    this.activitiesService.fetchActivities().subscribe({
      error: (err) => {
        console.error('Fetch activities error:', err);
        this.showSnackbar('Error loading activities. Please refresh the page.');
      },
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  scheduleReminder(): void {
    const { activity, interval } = this.scheduleForm.value;
    if (!activity) return;
    const option = this.intervalOptions.find((o) => o.value === interval);
    const daysMap: Record<string, number> = { '1-week': 7, '3-day': 3, '1-day': 1 };
    const days = daysMap[interval] ?? 7;
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + days);
    const formatted = scheduledDate.toLocaleDateString('en-US') + ' 05:00 PM';
    this.dataSource.data = [
      ...this.dataSource.data,
      { activity, type: option?.value ?? interval, scheduledFor: formatted, status: 'pending' },
    ];
    this.scheduleForm.patchValue({ activity: '' });
  }

  sendBroadcast(): void {
    if (this.broadcastForm.invalid) return;
    const url = environment.apdUrl;
    if (!url) {
      this.showSnackbar('Broadcast service is not running.');
      return;
    }
    const { title, message } = this.broadcastForm.value;

    this.usersService.listUsers().subscribe({
      next: (users) => {
        const employeeEmails = users
          .filter((user) => user.role === 'employee')
          .map((user) => user.email);

        if (!employeeEmails.length) {
          this.showSnackbar('No employee emails found.');
          return;
        }

        Promise.all(
          employeeEmails.map((to) =>
            fetch(url, {
              method: 'POST',
              body: JSON.stringify({ action: 'broadcast', title, message, to }),
            }).then((response) => {
              if (!response.ok) throw new Error('Network response was not ok');
            }),
          ),
        )
          .then(() => {
            this.showSnackbar(`Broadcast "${title}" sent to all employees.`);
            this.broadcastForm.reset();
          })
          .catch((err) => {
            console.log('Error sending broadcast:', err);
            this.showSnackbar('Failed to send broadcast');
          });
      },
      error: (err) => {
        console.log('Error loading users:', err);
        this.showSnackbar('Failed to load employee emails');
      },
    });
  }

  sendNow(reminder: ScheduledReminder): void {
    const url = environment.apdUrl;
    if (!url) {
      this.showSnackbar('Broadcast service is not running.');
      return;
    }

    this.registrationsService.listRegistrationsWithEmployee().subscribe({
      next: (registrations) => {
        const activityDetails = this.activityDetails.find(
          (activity) => activity.name === reminder.activity,
        );
        const recipientEmails = registrations
          .filter((registration) => registration.activity === reminder.activity)
          .map((registration) => registration.email);

        if (!recipientEmails.length) {
          this.showSnackbar('No registered employees found for this activity.');
          return;
        }

        Promise.all(
          recipientEmails.map((to) =>
            fetch(url, {
              method: 'POST',
              body: JSON.stringify({
                action: 'reminder',
                activity: reminder.activity,
                scheduleDate: activityDetails?.scheduleDate ?? '',
                scheduleTime: activityDetails?.scheduleTime ?? '',
                location: activityDetails?.location ?? '',
                serviceType: activityDetails?.serviceType ?? '',
                to,
              }),
            }).then((response) => {
              if (!response.ok) throw new Error('Network response was not ok');
            }),
          ),
        )
          .then(() => {
            reminder.status = 'sent';
            this.dataSource.data = [...this.dataSource.data];
            this.showSnackbar(
              `Reminder for "${reminder.activity}" sent to ${recipientEmails.length} employees.`,
            );
          })
          .catch((err) => {
            console.log('Error sending reminder:', err);
            this.showSnackbar('Failed to send reminder');
          });
      },
      error: (err) => {
        console.log('Error loading registrations:', err);
        this.showSnackbar('Failed to load registrations');
      },
    });
  }
}
