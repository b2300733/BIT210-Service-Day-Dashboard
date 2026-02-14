import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
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
import { LucideAngularModule, Plus, Pencil, Trash2 } from 'lucide-angular';

export interface PeriodicElement {
  name: string;
  serviceType: string;
  scheduleDate: string;
  scheduleTime: string;
  location: string;
  registered: number;
  totalSlots: number;
  cutoffDate: string;
  cutoffTime: string;
  status: string;
}
const ELEMENT_DATA: PeriodicElement[] = [
  {
    name: 'Green Earth Foundation',
    serviceType: 'Environment',
    scheduleDate: '2026-03-15',
    scheduleTime: '08:00',
    location: 'Central Community Park',
    registered: 10,
    totalSlots: 25,
    cutoffDate: '2026-03-12',
    cutoffTime: '17:00',
    status: 'Open',
  },
  {
    name: 'Helping Hands Shelter',
    serviceType: 'Social',
    scheduleDate: '2026-03-20',
    scheduleTime: '09:00',
    location: 'Downtown Shelter',
    registered: 4,
    totalSlots: 17,
    cutoffDate: '2026-03-18',
    cutoffTime: '17:00',
    status: 'Open',
  },
  {
    name: 'Food for All Initiative',
    serviceType: 'Hunger Relief',
    scheduleDate: '2026-03-25',
    scheduleTime: '10:00',
    location: 'City Food Bank',
    registered: 5,
    totalSlots: 27,
    cutoffDate: '2026-03-22',
    cutoffTime: '17:00',
    status: 'Closed',
  },
  {
    name: 'Clean Water Project',
    serviceType: 'Health',
    scheduleDate: '2026-03-30',
    scheduleTime: '11:00',
    location: 'Riverside Community Center',
    registered: 35,
    totalSlots: 35,
    cutoffDate: '2026-03-27',
    cutoffTime: '17:00',
    status: 'Full',
  },
];

@Component({
  selector: 'app-admin-activities',
  imports: [MatCardModule, MatTableModule, MatSortModule, LucideAngularModule],
  templateUrl: './admin-activities.html',
  styleUrl: './admin-activities.css',
})
export class AdminActivitiesPage implements AfterViewInit {
  readonly Plus = Plus;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;

  readonly dialog = inject(MatDialog);

  openDelete(element: PeriodicElement) {
    const dialogRef = this.dialog.open(DeleteActivitiesDialog, {
      data: element,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Remove the activity from data source
        const data = this.dataSource.data.filter((item) => item !== element);
        this.dataSource.data = data;
      }
    });
  }

  openAddEdit(element?: PeriodicElement) {
    const dialogRef = this.dialog.open(AddEditActivitiesDialog, {
      data: element,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (element) {
          // Edit mode - update existing activity
          const index = this.dataSource.data.indexOf(element);
          if (index !== -1) {
            this.dataSource.data[index] = result;
            this.dataSource.data = [...this.dataSource.data];
          }
        } else {
          // Add mode - add new activity
          this.dataSource.data = [...this.dataSource.data, result];
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
  dataSource = new MatTableDataSource(ELEMENT_DATA);

  @ViewChild(MatSort) sort!: MatSort;

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

  getSlotPercentage(registered: number, totalSlots: number): number {
    return (registered / totalSlots) * 100;
  }
}

@Component({
  selector: 'app-delete-activities',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  templateUrl: './delete-activities.html',
})
export class DeleteActivitiesDialog {
  readonly element = inject<PeriodicElement>(MAT_DIALOG_DATA);
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
  readonly data = inject<PeriodicElement | undefined>(MAT_DIALOG_DATA, { optional: true });
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
        status: [this.data?.status || 'Open'],
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
