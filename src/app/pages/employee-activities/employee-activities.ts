import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MapPin, Calendar, Users, Clock, CheckCircle, X } from 'lucide-angular';
import { COMMON_PAGES_MODULES } from '../../module/common.pages.module';

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
  imports: [CommonModule, COMMON_PAGES_MODULES, MatButtonModule, FormsModule],
  templateUrl: './employee-activities.html',
})
export class EmployeeActivitiesComponent {
  readonly MapPin = MapPin;
  readonly Calendar = Calendar;
  readonly Users = Users;
  readonly Clock = Clock;
  readonly CheckCircle = CheckCircle;
  readonly X = X; // Added for the modal close button

  searchTerm = '';
  selectedActivity: Activity | null = null; // Tracks which card is currently open in full screen

  activities: Activity[] = [
    {
      id: 1,
      title: 'Green Earth Foundation',
      category: 'Environmental',
      description:
        'Tree planting and park restoration in the community garden. Volunteers will help plant native species, clear invasive weeds, and set up new irrigation lines to ensure the long-term health of the local ecosystem. Please wear comfortable outdoor clothing, closed-toe shoes, and bring a reusable water bottle. All tools will be provided on-site.',
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
      description:
        'Prepare and distribute meals to underserved communities. Volunteers will be involved in food preparation, packaging, and managing the distribution lines. This initiative aims to serve over 500 hot meals to families in need. No prior cooking experience is required; our head chefs will guide all teams.',
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
      description:
        'STEM workshop mentoring for underprivileged youth. Teach basic coding and robotics to students aged 12-15 using interactive kits. No prior expert coding experience is required, just a willingness to guide, encourage students through problem-solving exercises, and foster a fun learning environment.',
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
      description:
        'Assist in building homes for families in need. Activities include painting, basic construction, drywall installation, landscaping, and site cleanup. Professional site managers will be present to guide all volunteers, ensuring a safe, educational, and highly productive environment for everyone involved.',
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
      description:
        'Help care for rescued animals, including feeding, grooming, and socializing with adoptable pets. Volunteers will also assist in cleaning enclosures, organizing donated supplies, and walking the larger dogs. It is a highly rewarding day for animal lovers wanting to make a direct impact on shelter operations.',
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
      description:
        'Assist elderly residents with basic technology needs. You will be helping them set up smartphones, use email, recognize and avoid online scams, and learn how to video call their families. Your patience and friendly guidance will drastically help them stay connected in an increasingly digital world.',
      date: '2026-03-18',
      time: '14:00',
      location: 'Sunrise Senior Living',
      slotsFilled: 10,
      slotsTotal: 12,
      cutoff: '2026-03-16 at 17:00',
      registered: true,
    },
  ];

  get filteredActivities() {
    return this.activities.filter(
      (a) =>
        a.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        a.location.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(this.searchTerm.toLowerCase()),
    );
  }

  // Opens the modal
  openDetails(activity: Activity) {
    this.selectedActivity = activity;
  }

  // Closes the modal
  closeDetails() {
    this.selectedActivity = null;
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
