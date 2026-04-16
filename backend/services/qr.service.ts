import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CheckInRecord {
  _id?: string;
  employeeId?: string;
  employeeName: string;
  email: string;
  department?: string;
  activityId?: string;
  activityName?: string;
  qrchecked?: boolean;
  status: 'pending' | 'checked-in';
  checkedInAt: string | null;
  qrData: string | null;
}

export interface CheckInResponse {
  valid: boolean;
  message?: string;
  record?: CheckInRecord;
}

const API_URL = 'http://localhost:3000/api/registrations';

@Injectable({ providedIn: 'root' })
export class QrService {
  private http = inject(HttpClient);

  getCheckInRecords(activityId: string): Observable<CheckInRecord[]> {
    return this.http.get<CheckInRecord[]>(
      `${API_URL}/with-employee?activityId=${encodeURIComponent(activityId)}`,
    );
  }

  generateQrCodes(activityId: string): Observable<CheckInRecord[]> {
    return this.http.post<CheckInRecord[]>(`${API_URL}/generate-qr`, { activityId });
  }

  checkInByQr(activityId: string, qrData: string): Observable<CheckInResponse> {
    return this.http.post<CheckInResponse>(`${API_URL}/check-in`, { activityId, qrData });
  }

  downloadQr(record: CheckInRecord): void {
    if (!record.qrData) return;
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
