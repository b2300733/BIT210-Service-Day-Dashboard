import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- CommonModule covers *ngIf, *ngFor, ngClass
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, MapPin, Calendar, Users, Clock, CheckCircle } from 'lucide-angular';

interface Activity {
  id: number;
  title: string;
  category: string;
  description: string;
  date: string;
  time: string;
  location: string;
  slotsFilled: number;
  slotsTotal: number;
  cutoff: string;
  registered: boolean;
}

@Component({
  selector: 'app-employee-activities',
  standalone: true,
  // Removed NgIf, NgFor, and NgClass from here:
  imports: [CommonModule, MatCardModule, MatButtonModule, LucideAngularModule, FormsModule],
  templateUrl: './employee-activities.html',
})
export class EmployeeActivitiesComponent {
  readonly MapPin = MapPin;
  readonly Calendar = Calendar;
  readonly Users = Users;
  readonly Clock = Clock;
  readonly CheckCircle = CheckCircle;

  searchTerm = '';

  activities: Activity[] = [
    {
      id: 1,
      title: 'Green Earth Foundation',
      category: 'Environmental',
      description: 'Tree planting and park restoration in the community garden. Volunteers will help plant native species and...',
      date: '2026-03-15',
      time: '09:00',
      location: 'Central Community Park',
      slotsFilled: 18,
      slotsTotal: 25,
      cutoff: '2026-03-12 at 17:00',
      registered: true,
    },
    {
      id: 2,
      title: 'Food For All',
      category: 'Community Service',
      description: 'Prepare and distribute meals to underserved communities. Includes food preparation, packaging,...',
      date: '2026-03-15',
      time: '08:00',
      location: 'Downtown Food Bank',
      slotsFilled: 30,
      slotsTotal: 30,
      cutoff: '2026-03-12 at 17:00',
      registered: false,
    },
    {
      id: 3,
      title: 'Bright Futures Academy',
      category: 'Education',
      description: 'STEM workshop mentoring for underprivileged youth. Teach basic coding and robotics to students aged 12-...',
      date: '2026-03-16',
      time: '10:00',
      location: 'Riverside Community Center',
      slotsFilled: 8,
      slotsTotal: 15,
      cutoff: '2026-03-13 at 17:00',
      registered: false,
    },
    {
      id: 4,
      title: 'Habitat Builders',
      category: 'Housing',
      description: 'Assist in building homes for families in need. Activities include painting, basic construction, and landscaping.',
      date: '2026-03-16',
      time: '07:30',
      location: 'Westside Development Area',
      slotsFilled: 10,
      slotsTotal: 20,
      cutoff: '2026-03-14 at 17:00',
      registered: false,
    },
    {
      id: 5,
      title: 'Paws & Claws Shelter',
      category: 'Animal Welfare',
      description: 'Help care for rescued animals, including feeding, grooming, and socializing with adoptable pets.',
      date: '2026-03-17',
      time: '09:00',
      location: 'City Animal Shelter',
      slotsFilled: 5,
      slotsTotal: 15,
      cutoff: '2026-03-15 at 17:00',
      registered: false,
    },
    {
      id: 6,
      title: 'Senior Center Tech Help',
      category: 'Community Service',
      description: 'Assist elderly residents with basic technology needs, such as setting up smartphones, using email, and video calling families.',
      date: '2026-03-18',
      time: '14:00',
      location: 'Sunrise Senior Living',
      slotsFilled: 10,
      slotsTotal: 12, // 
      cutoff: '2026-03-16 at 17:00',
      registered: true,
    }
  ];
  get filteredActivities() {
    return this.activities.filter(a =>
      a.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      a.location.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  register(activity: Activity) {
    activity.registered = true;
    activity.slotsFilled += 1;
  }

  cancelRegistration(activity: Activity) {
    activity.registered = false;
    activity.slotsFilled -= 1;
  }
}