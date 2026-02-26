import { Component, signal } from '@angular/core'; // 👈 IMPORTING SIGNAL
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, QrCode, Calendar, Clock, MapPin, Maximize, X, Download, CheckCircle } from 'lucide-angular';

interface CheckInActivity {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  qrData: string; 
  showQr?: boolean;
  isCheckedIn?: boolean;
  checkInTime?: string; 
}

@Component({
  selector: 'app-employee-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './employee-qr.html',
  styles: [`
    @keyframes scan {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(250px); }
    }
    .animate-scan {
      animation: scan 2.5s ease-in-out infinite;
    }

    @keyframes scalePop {
      0% { transform: scale(0.5); opacity: 0; }
      70% { transform: scale(1.15); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    .animate-scale-pop {
      animation: scalePop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    @keyframes slideUpFade {
      0% { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    .animate-slide-up-fade {
      animation: slideUpFade 0.5s ease-out forwards;
      animation-delay: 0.2s;
      opacity: 0; 
    }
  `]
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
  readonly CheckCircle = CheckCircle; 

  searchTerm = '';
  enlargedQrActivity: CheckInActivity | null = null;
  scanTimeout: any;

  // 👇 THIS IS THE SIGNAL. It cannot be ignored by Angular.
  isScanSuccessful = signal(false);

  activities: CheckInActivity[] = [
    {
      id: 1,
      title: 'Green Earth Foundation',
      date: '2026-03-15',
      time: '09:00',
      location: 'Central Community Park',
      qrData: 'EMP-123-ACT-1',
      isCheckedIn: false 
    },
    {
      id: 2,
      title: 'Clean Shores Initiative',
      date: '2026-03-17',
      time: '08:00',
      location: 'Lakeside Beach Area',
      qrData: 'EMP-123-ACT-2',
      isCheckedIn: false
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
    this.isScanSuccessful.set(false); // Reset the signal

    this.scanTimeout = setTimeout(() => {
      if (this.enlargedQrActivity) {
        this.enlargedQrActivity.isCheckedIn = true;
        
        const now = new Date();
        this.enlargedQrActivity.checkInTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
        
        // 👇 UPDATING THE SIGNAL. This physically forces the HTML to redraw instantly.
        this.isScanSuccessful.set(true); 
      }
    }, 6000); 
  }

  closeEnlargedQr() {
    this.enlargedQrActivity = null;
    this.isScanSuccessful.set(false);
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }
  }

  async downloadQr(activity: CheckInActivity) {
    const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=jpeg&data=${encodeURIComponent(activity.qrData)}`;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
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