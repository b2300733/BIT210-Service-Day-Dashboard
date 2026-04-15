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
import { RemindersService } from '../../../../backend/services/reminders.service';
import { Activity } from '../../models/activity.model';
import { COMMON_PAGES_MODULES } from '../../module/common.pages.module';

export interface ScheduledReminder {
  _id?: string;
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
  private remindersService = inject(RemindersService);

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
      this.activities = activities.map((activity) => activity.name);
    });

    this.activitiesService.fetchActivities().subscribe({
      error: (err) => {
        console.error('Fetch activities error:', err);
        this.showSnackbar('Error loading activities. Please refresh the page.');
      },
    });

    this.remindersService.listReminders().subscribe({
      next: (reminders) => {
        this.dataSource.data = reminders;
      },
      error: (err) => {
        console.error('Fetch reminders error:', err);
        this.showSnackbar('Error loading reminders. Please refresh the page.');
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
    const payload = {
      activity,
      type: option?.value ?? interval,
    };

    this.remindersService.createReminder(payload).subscribe({
      next: (created) => {
        this.dataSource.data = [...this.dataSource.data, created];
        this.scheduleForm.patchValue({ activity: '' });
        this.showSnackbar('Reminder scheduled successfully.');
      },
      error: (err) => {
        console.error('Create reminder error:', err);
        this.showSnackbar('Failed to schedule reminder.');
      },
    });
  }

  sendBroadcast(): void {
    if (this.broadcastForm.invalid) return;
    const { title, message } = this.broadcastForm.value;

    this.remindersService.sendBroadcast({ title, message }).subscribe({
      next: (result) => {
        if (!result.sent) {
          this.showSnackbar('No employee emails found.');
          return;
        }
        this.showSnackbar(`Broadcast "${title}" sent to all employees.`);
        this.broadcastForm.reset();
      },
      error: (err) => {
        console.log('Error sending broadcast:', err);
        this.showSnackbar('Failed to send broadcast');
      },
    });
  }

  sendNow(reminder: ScheduledReminder): void {
    if (!reminder._id) {
      this.showSnackbar('Reminder ID is missing. Please refresh the page.');
      return;
    }

    this.remindersService.sendReminderNow(reminder._id).subscribe({
      next: (result) => {
        if (!result.sent) {
          this.showSnackbar('No registered employees found for this activity.');
          return;
        }

        const updatedReminder = result.reminder;
        if (updatedReminder) {
          this.dataSource.data = this.dataSource.data.map((item) =>
            item._id === updatedReminder._id ? updatedReminder : item,
          );
        }

        this.showSnackbar(`Sent "${reminder.activity}" reminder to all registered employees.`);
      },
      error: (err) => {
        console.log('Error sending reminder:', err);
        this.showSnackbar('Failed to send reminder');
      },
    });
  }
}
