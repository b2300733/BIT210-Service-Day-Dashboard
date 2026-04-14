import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, MapPin, Calendar, Clock } from 'lucide-angular';

interface Registration {
  id: number;
  title: string;
  category: string;
  status: string;
  description: string;
  date: string;
  time: string;
  location: string;
  registeredOn: string;
}

@Component({
  selector: 'app-employee-registrations',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './employee-registrations.html',
})
export class EmployeeRegistrationsComponent {
  readonly MapPin = MapPin;
  readonly Calendar = Calendar;
  readonly Clock = Clock;

  // Updated based on the 'Registered' items from the Browse page data
  registrations: Registration[] = [
    {
      id: 1,
      title: 'Green Earth Foundation',
      category: 'Environmental',
      status: 'Confirmed',
      description:
        'Tree planting and park restoration in the community garden. Volunteers will help plant native species and restore walking paths.',
      date: '2026-03-15',
      time: '09:00',
      location: 'Central Community Park',
      registeredOn: '2/1/2026',
    },
    {
      id: 6, // Matching the ID from the browse page data if you used my previous snippet
      title: 'Senior Center Tech Help',
      category: 'Community Service',
      status: 'Confirmed',
      description:
        'Assist elderly residents with basic technology needs, such as setting up smartphones, using email, and video calling families.',
      date: '2026-03-18',
      time: '14:00',
      location: 'Sunrise Senior Living',
      registeredOn: '2/15/2026',
    },
  ];

  cancelRegistration(registrationId: number) {
    // Filter out the cancelled registration to update the UI
    this.registrations = this.registrations.filter((reg) => reg.id !== registrationId);
  }
}
