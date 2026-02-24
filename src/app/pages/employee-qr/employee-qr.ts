import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, QrCode, Calendar, Clock, MapPin, Maximize, X, Download } from 'lucide-angular';

interface CheckInActivity {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  qrData: string; 
  showQr?: boolean;
}

@Component({
  selector: 'app-employee-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './employee-qr.html',
})
export class EmployeeCheckinComponent {
  readonly Search = Search;
  readonly QrCode = QrCode;
  readonly Calendar = Calendar;
  readonly Clock = Clock;
  readonly MapPin = MapPin;
  readonly Maximize = Maximize;
  readonly X = X;
  readonly Download = Download;

  searchTerm = '';
  enlargedQrActivity: CheckInActivity | null = null;

  activities: CheckInActivity[] = [
    {
      id: 1,
      title: 'Green Earth Foundation',
      date: '2026-03-15',
      time: '09:00',
      location: 'Central Community Park',
      qrData: 'EMP-123-ACT-1' 
    },
    {
      id: 2,
      title: 'Clean Shores Initiative',
      date: '2026-03-17',
      time: '08:00',
      location: 'Lakeside Beach Area',
      qrData: 'EMP-123-ACT-2'
    }
  ];

  get filteredActivities() {
    return this.activities.filter(a =>
      a.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      a.location.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  toggleQr(activity: CheckInActivity) {
    activity.showQr = !activity.showQr;
  }

  enlargeQr(activity: CheckInActivity) {
    this.enlargedQrActivity = activity;
  }

  closeEnlargedQr() {
    this.enlargedQrActivity = null;
  }

  // Force download as a JPG file using a Blob
  async downloadQr(activity: CheckInActivity) {
    // We append &format=jpeg to the API call
    const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=jpeg&data=${encodeURIComponent(activity.qrData)}`;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      // Generate a clean filename (e.g., "green-earth-foundation-qr.jpg")
      a.download = `${activity.title.replace(/\s+/g, '-').toLowerCase()}-qr.jpg`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading the QR code:', error);
      alert('There was a problem downloading the QR code. Please try again.');
    }
  }
}