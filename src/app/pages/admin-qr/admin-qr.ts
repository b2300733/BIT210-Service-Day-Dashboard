import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { QRCodeComponent } from 'angularx-qrcode';
import QrScanner from 'qr-scanner';
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
import { Activity } from '../../models/activity.model';
import { ActivitiesService } from '../../../../backend/services/activities.service';
import { QrService, CheckInRecord } from '../../../../backend/services/qr.service';

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
    QRCodeComponent,
  ],
  templateUrl: './admin-qr.html',
  styleUrl: './admin-qr.css',
})
export class AdminQrPage implements OnInit, OnDestroy {
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
  private activitiesService = inject(ActivitiesService);
  private _liveAnnouncer = inject(LiveAnnouncer);

  activities: Activity[] = [];
  selectedActivity: Activity | null = null;
  dataSource = new MatTableDataSource<CheckInRecord>([]);
  displayedColumns = ['qr', 'employee', 'status', 'checkedInAt'];
  selectedQrRecord: CheckInRecord | null = null;
  showScanOverlay = false;
  scanMessage = '';
  private scanner: QrScanner | null = null;
  private readonly qrWorkerPath = new URL('../../../qr-scanner-worker', import.meta.url).toString();

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

  @ViewChild('qrVideo') qrVideo?: ElementRef<HTMLVideoElement>;

  get isQrGenerated(): boolean {
    return this.dataSource.data.some((record) => !!record.qrData);
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

  ngOnInit(): void {
    QrScanner.WORKER_PATH = this.qrWorkerPath;
    this.activitiesService.fetchActivities().subscribe({
      next: (activities) => {
        this.activities = activities;
      },
      error: (err) => {
        console.error('Failed to load activities:', err);
      },
    });
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  onActivityChange(): void {
    if (!this.selectedActivity) {
      this.dataSource.data = [];
      return;
    }
    const activityId = this.selectedActivity._id;
    if (!activityId) {
      this.dataSource.data = [];
      return;
    }
    this.qrService.getCheckInRecords(activityId).subscribe({
      next: (records) => {
        this.dataSource.data = records;
      },
      error: (err) => {
        console.error('Failed to load registrations:', err);
      },
    });
  }

  generateQrCodes(): void {
    if (!this.selectedActivity?._id) return;
    this.qrService.generateQrCodes(this.selectedActivity._id).subscribe({
      next: (records) => {
        this.dataSource.data = records;
      },
      error: (err) => {
        console.error('Failed to generate QR codes:', err);
      },
    });
  }

  openScanOverlay(): void {
    if (!this.selectedActivity?._id) return;
    this.showScanOverlay = true;
    this.scanMessage = 'Position the QR code inside the frame.';
    queueMicrotask(() => {
      this.startScanner();
    });
  }

  closeScanOverlay(): void {
    this.showScanOverlay = false;
    this.stopScanner();
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

  private async startScanner(): Promise<void> {
    if (!this.qrVideo?.nativeElement) return;

    if (!this.scanner) {
      this.scanner = new QrScanner(
        this.qrVideo.nativeElement,
        (result) => this.handleScan(result),
        { returnDetailedScanResult: true },
      );
    }

    try {
      await this.scanner.start();
    } catch (err) {
      console.error('Failed to start scanner:', err);
      this.scanMessage = 'Camera access failed. Check permissions.';
    }
  }

  private stopScanner(): void {
    if (!this.scanner) return;
    this.scanner.stop();
  }

  private handleScan(result: string | { data: string }): void {
    const data = typeof result === 'string' ? result : result.data;
    const activityId = this.selectedActivity?._id;
    if (!activityId) return;

    const expectedPrefix = `serviceday:${activityId}:`;
    if (!data.startsWith(expectedPrefix)) {
      this.scanMessage = 'This QR code is for a different activity.';
      return;
    }

    const match = this.dataSource.data.find((record) => record.qrData === data);
    if (!match) {
      this.scanMessage = 'QR code not found in this activity list.';
      return;
    }

    this.qrService.checkInByQr(data).subscribe({
      next: (updated) => {
        const nextRows = this.dataSource.data.map((row) =>
          row.qrData === updated.qrData ? { ...row, ...updated } : row,
        );
        this.dataSource.data = nextRows;
        this.scanMessage = `Checked in: ${updated.employeeName}`;
      },
      error: (err) => {
        console.error('Failed to check in:', err);
        this.scanMessage = 'Check-in failed. Please try again.';
      },
    });
  }
}
