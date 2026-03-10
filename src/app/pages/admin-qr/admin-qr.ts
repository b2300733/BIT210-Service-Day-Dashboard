import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
  QrCode,
  Download,
  Calendar,
  MapPin,
  Users,
  UserCheck,
  X,
  View,
  ScanLine,
} from 'lucide-angular';
import { COMMON_PAGES_MODULES } from '../../module/common.pages.module';
import { ACTIVITIES_DATA, Activity } from '../../data/activities.data';
import { QrService, CheckInRecord } from '../../services/qr.service';

export type { CheckInRecord };

@Component({
  selector: 'app-admin-qr',
  imports: [
    CommonModule,
    FormsModule,
    COMMON_PAGES_MODULES,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatSortModule,
  ],
  templateUrl: './admin-qr.html',
  styleUrl: './admin-qr.css',
})
export class AdminQrPage {
  readonly QrCode = QrCode;
  readonly Download = Download;
  readonly Calendar = Calendar;
  readonly MapPin = MapPin;
  readonly Users = Users;
  readonly UserCheck = UserCheck;
  readonly X = X;
  readonly View = View;
  readonly ScanLine = ScanLine;

  private qrService = inject(QrService);
  private _liveAnnouncer = inject(LiveAnnouncer);

  activities = ACTIVITIES_DATA;
  selectedActivity: Activity | null = null;
  dataSource = new MatTableDataSource<CheckInRecord>([]);
  displayedColumns = ['qr', 'employee', 'status', 'checkedInAt'];
  selectedQrRecord: CheckInRecord | null = null;
  showScanOverlay = false;

  constructor() {
    this.dataSource.sortingDataAccessor = (row, column) => {
      switch (column) {
        case 'employee':
          return row.employeeName;
        case 'status':
          return row.status;
        case 'checkedInAt':
          return row.checkedInAt ?? '';
        default:
          return '';
      }
    };
  }

  @ViewChild(MatSort) set sort(sort: MatSort) {
    if (sort) this.dataSource.sort = sort;
  }

  get isQrGenerated(): boolean {
    return !!this.selectedActivity && this.qrService.isQrGenerated(this.selectedActivity.name);
  }

  get checkedInCount(): number {
    return this.dataSource.data.filter((r) => r.status === 'checked-in').length;
  }

  get pendingCount(): number {
    return this.dataSource.data.filter((r) => r.status === 'pending').length;
  }

  announceSortChange(sortState: Sort): void {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  onActivityChange(): void {
    if (!this.selectedActivity) {
      this.dataSource.data = [];
      return;
    }
    this.dataSource.data = this.qrService.getCheckInRecords(this.selectedActivity);
  }

  generateQrCodes(): void {
    if (!this.selectedActivity) return;
    this.dataSource.data = this.qrService.generateQrCodes(
      this.selectedActivity,
      this.dataSource.data,
    );
  }

  openScanOverlay(): void {
    this.showScanOverlay = true;
  }

  closeScanOverlay(): void {
    this.showScanOverlay = false;
  }

  openQrView(record: CheckInRecord): void {
    this.selectedQrRecord = record;
  }

  closeQrView(): void {
    this.selectedQrRecord = null;
  }

  downloadQr(record: CheckInRecord): void {
    this.qrService.downloadQr(record);
  }
}
