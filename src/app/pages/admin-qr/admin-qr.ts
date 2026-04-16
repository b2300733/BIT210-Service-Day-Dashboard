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
  scanStatus: 'idle' | 'scanning' | 'success' | 'error' = 'idle';
  private scanner: QrScanner | null = null;
  private lastDecodeErrorAt = 0;
  private statusHoldUntil = 0;
  private statusResetTimer: ReturnType<typeof setTimeout> | null = null;

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
    this.setScanStatus('scanning', 'Scanning for QR codes...');
    setTimeout(() => {
      this.startScanner();
    }, 0);
  }

  closeScanOverlay(): void {
    this.showScanOverlay = false;
    this.setScanStatus('idle', '');
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
    if (!this.qrVideo?.nativeElement) {
      this.scanMessage = 'Camera element not ready yet.';
      return;
    }

    this.stopScanner();
    this.scanner = new QrScanner(this.qrVideo.nativeElement, (result) => this.handleScan(result), {
      returnDetailedScanResult: true,
      onDecodeError: () => this.handleDecodeError(),
    });

    try {
      await this.scanner.start();
      this.setScanStatus('scanning', 'Scanning for QR codes...');
    } catch (err) {
      console.error('Failed to start scanner:', err);
      this.setScanStatus('error', 'Camera access failed. Check permissions.', 2000);
    }
  }

  private stopScanner(): void {
    if (this.scanner) {
      this.scanner.stop();
      this.scanner.destroy();
      this.scanner = null;
    }

    if (this.qrVideo?.nativeElement) {
      this.qrVideo.nativeElement.srcObject = null;
    }
  }

  private handleScan(result: string | { data: string }): void {
    const data = typeof result === 'string' ? result : result.data;
    const activityId = this.selectedActivity?._id;
    if (!activityId) return;

    this.qrService.checkInByQr(activityId, data).subscribe({
      next: (updated) => {
        const nextRows = this.dataSource.data.map((row) =>
          row.qrData === updated.qrData ? { ...row, ...updated } : row,
        );
        this.dataSource.data = nextRows;
        this.setScanStatus('success', `Checked in: ${updated.employeeName}`, 1500);
      },
      error: (err) => {
        console.error('Failed to check in:', err);
        const serverMessage = err?.error?.message;
        const message =
          typeof serverMessage === 'string' && serverMessage.length > 0
            ? serverMessage
            : 'Check-in failed. Please try again.';
        this.setScanStatus('error', message, 1500);
      },
    });
  }

  private handleDecodeError(): void {
    const now = Date.now();
    if (now - this.lastDecodeErrorAt < 1200) return;
    this.lastDecodeErrorAt = now;
    if (this.scanStatus !== 'success' && now >= this.statusHoldUntil) {
      this.setScanStatus('scanning', 'Scanning for QR codes...');
    }
  }

  private setScanStatus(
    status: 'idle' | 'scanning' | 'success' | 'error',
    message: string,
    holdMs = 0,
  ): void {
    this.scanStatus = status;
    this.scanMessage = message;

    if (this.statusResetTimer) {
      clearTimeout(this.statusResetTimer);
      this.statusResetTimer = null;
    }

    if (holdMs > 0) {
      this.statusHoldUntil = Date.now() + holdMs;
      this.statusResetTimer = setTimeout(() => {
        if (!this.showScanOverlay) return;
        this.scanStatus = 'scanning';
        this.scanMessage = 'Scanning for QR codes...';
      }, holdMs);
    } else {
      this.statusHoldUntil = 0;
    }
  }
}
