import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
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
import { ACTIVITIES_DATA } from '../../../../backend/data/activities.data';
import { COMMON_PAGES_MODULES } from '../../module/common.pages.module';

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
export class AdminNotificationsPage implements AfterViewInit {
  readonly Send = Send;
  readonly CalendarClock = CalendarClock;
  readonly Clock = Clock;
  readonly CircleCheck = CircleCheck;

  private _liveAnnouncer = inject(LiveAnnouncer);
  private _snackBar = inject(MatSnackBar);

  broadcastForm: FormGroup;
  scheduleForm: FormGroup;

  activities = ACTIVITIES_DATA.map((a) => a.name);

  intervalOptions = [
    { value: '1-week', label: '1 week before' },
    { value: '3-day', label: '3 days before' },
    { value: '1-day', label: '1 day before' },
  ];

  displayedColumns: string[] = ['activity', 'type', 'scheduledFor', 'status', 'action'];

  dataSource = new MatTableDataSource<ScheduledReminder>([
    {
      activity: 'Green Earth Foundation',
      type: '1-week',
      scheduledFor: '3/8/2026 05:00 PM',
      status: 'sent',
    },
    {
      activity: 'Green Earth Foundation',
      type: '3-day',
      scheduledFor: '3/12/2026 05:00 PM',
      status: 'pending',
    },
    {
      activity: 'Green Earth Foundation',
      type: '1-day',
      scheduledFor: '3/14/2026 05:00 PM',
      status: 'pending',
    },
  ]);

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
    const { title, message } = this.broadcastForm.value;
    this._snackBar.open(`Broadcast "${title}" sent successfully!`, '', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-error'],
    });
    this.broadcastForm.reset();
  }

  sendNow(reminder: ScheduledReminder): void {
    reminder.status = 'sent';
    this.dataSource.data = [...this.dataSource.data];
    this._snackBar.open(`Reminder for "${reminder.activity}" activity sent!`, '', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-error'],
    });
  }
}
