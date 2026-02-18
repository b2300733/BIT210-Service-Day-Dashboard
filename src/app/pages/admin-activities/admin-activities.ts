import { AfterViewInit, Component, ViewChild, inject, OnInit } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, Plus, Pencil, Trash2, Calendar, MapPin, Clock } from 'lucide-angular';
import { Activity } from '../../data/activities.data';
import { ActivitiesService } from '../../services/activities.service';

@Component({
  selector: 'app-admin-activities',
  imports: [MatCardModule, MatTableModule, MatSortModule, MatPaginatorModule, LucideAngularModule],
  templateUrl: './admin-activities.html',
  styleUrl: './admin-activities.css',
})
export class AdminActivitiesPage implements AfterViewInit, OnInit {
  readonly Plus = Plus;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly Calendar = Calendar;
  readonly MapPin = MapPin;
  readonly Clock = Clock;

  readonly dialog = inject(MatDialog);
  private activitiesService = inject(ActivitiesService);

  openDelete(element: Activity) {
    const dialogRef = this.dialog.open(DeleteActivitiesDialog, {
      data: element,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.activitiesService.deleteActivity(element);
      }
    });
  }

  openAddEdit(element?: Activity) {
    const dialogRef = this.dialog.open(AddEditActivitiesDialog, {
      data: element,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (element) {
          // Edit mode - update existing activity
          this.activitiesService.updateActivity(element, result);
        } else {
          // Add mode - add new activity
          this.activitiesService.addActivity(result);
        }
      }
    });
  }

  private _liveAnnouncer = inject(LiveAnnouncer);

  displayedColumns: string[] = [
    'name',
    'scheduleDate',
    'location',
    'slots',
    'cutoffDate',
    'status',
    'action',
  ];
  dataSource = new MatTableDataSource<Activity>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    this.activitiesService.activities$.subscribe((activities) => {
      this.dataSource.data = activities;
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  getSlotPercentage(registered: number, totalSlots: number): number {
    return (registered / totalSlots) * 100;
  }

  getStatus(activity: Activity): string {
    return this.activitiesService.getActivityStatus(activity);
  }
}

@Component({
  selector: 'app-delete-activities',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  templateUrl: './delete-activities.html',
})
export class DeleteActivitiesDialog {
  readonly element = inject<Activity>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-add-edit-activities',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add-edit-activities.html',
})
export class AddEditActivitiesDialog {
  readonly fb = inject(FormBuilder);
  readonly data = inject<Activity | undefined>(MAT_DIALOG_DATA, { optional: true });
  readonly dialogRef = inject(MatDialogRef<AddEditActivitiesDialog>);

  activityForm: FormGroup;
  isEditMode: boolean;

  constructor() {
    this.isEditMode = !!this.data;

    this.activityForm = this.fb.group(
      {
        name: [this.data?.name || '', Validators.required],
        serviceType: [this.data?.serviceType || '', Validators.required],
        scheduleDate: [this.data?.scheduleDate || '', Validators.required],
        scheduleTime: [this.data?.scheduleTime || '', Validators.required],
        location: [this.data?.location || '', Validators.required],
        registered: [this.data?.registered || 0],
        totalSlots: [this.data?.totalSlots || 0, [Validators.required, Validators.min(1)]],
        cutoffDate: [this.data?.cutoffDate || '', Validators.required],
        cutoffTime: [this.data?.cutoffTime || '', Validators.required],
      },
      { validators: this.cutoffBeforeScheduleValidator },
    );
  }

  cutoffBeforeScheduleValidator(form: FormGroup) {
    const scheduleDate = form.get('scheduleDate')?.value;
    const scheduleTime = form.get('scheduleTime')?.value;
    const cutoffDate = form.get('cutoffDate')?.value;
    const cutoffTime = form.get('cutoffTime')?.value;

    if (!scheduleDate || !scheduleTime || !cutoffDate || !cutoffTime) {
      return null;
    }

    const scheduleDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
    const cutoffDateTime = new Date(`${cutoffDate}T${cutoffTime}`);

    if (cutoffDateTime >= scheduleDateTime) {
      return { cutoffAfterSchedule: true };
    }

    return null;
  }

  onSubmit() {
    if (this.activityForm.valid) {
      this.dialogRef.close(this.activityForm.value);
    }
  }
}
