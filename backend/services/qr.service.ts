import { Injectable } from '@angular/core';
import { ACTIVITIES_DATA, Activity, EMPLOYEE_REGISTRATIONS_DATA } from '../data/activities.data';

export interface CheckInRecord {
  employeeName: string;
  email: string;
  status: 'pending' | 'checked-in';
  checkedInAt: string | null;
  qrData: string;
  qrImageUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class QrService {
  private readonly activities = ACTIVITIES_DATA;
  private qrGeneratedActivities = new Set<string>();

  isQrGenerated(activityName: string): boolean {
    return this.qrGeneratedActivities.has(activityName);
  }

  getCheckInRecords(activity: Activity): CheckInRecord[] {
    const actIdx = this.activities.indexOf(activity);
    const alreadyGenerated = this.qrGeneratedActivities.has(activity.name);
    return EMPLOYEE_REGISTRATIONS_DATA.filter((r) => r.activity === activity.name).map((r) => {
      const slug = r.employeeName.toLowerCase().replace(/\s+/g, '-');
      const qrData = `serviceday-checkin:act-${actIdx + 1}:emp-${slug}`;
      return {
        employeeName: r.employeeName,
        email: slug.replace(/-/g, '.') + '@company.com',
        status: 'pending' as const,
        checkedInAt: null,
        qrData,
        qrImageUrl: alreadyGenerated ? this.buildQrUrl(qrData, 120) : null,
      };
    });
  }

  generateQrCodes(activity: Activity, records: CheckInRecord[]): CheckInRecord[] {
    this.qrGeneratedActivities.add(activity.name);
    return records.map((r) => ({
      ...r,
      qrImageUrl: this.buildQrUrl(r.qrData, 120),
    }));
  }

  downloadQr(record: CheckInRecord): void {
    const link = document.createElement('a');
    link.href = this.buildQrUrl(record.qrData, 400, 'png');
    link.download = `qr-${record.employeeName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.target = '_blank';
    link.click();
  }

  private buildQrUrl(data: string, size: number, format = 'png'): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&format=${format}&data=${encodeURIComponent(data)}`;
  }
}
