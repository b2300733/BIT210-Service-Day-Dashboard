export interface Activity {
  name: string;
  serviceType: string;
  scheduleDate: string;
  scheduleTime: string;
  location: string;
  registered: number;
  totalSlots: number;
  cutoffDate: string;
  cutoffTime: string;
  status: string;
}

export const ACTIVITIES_DATA: Activity[] = [
  {
    name: 'Green Earth Foundation',
    serviceType: 'Environment',
    scheduleDate: '2026-03-15',
    scheduleTime: '08:00',
    location: 'Central Community Park',
    registered: 10,
    totalSlots: 25,
    cutoffDate: '2026-03-12',
    cutoffTime: '17:00',
    status: 'Open',
  },
  {
    name: 'Helping Hands Shelter',
    serviceType: 'Social',
    scheduleDate: '2026-03-20',
    scheduleTime: '09:00',
    location: 'Downtown Shelter',
    registered: 4,
    totalSlots: 17,
    cutoffDate: '2026-03-18',
    cutoffTime: '17:00',
    status: 'Open',
  },
  {
    name: 'Food for All Initiative',
    serviceType: 'Hunger Relief',
    scheduleDate: '2026-03-25',
    scheduleTime: '10:00',
    location: 'City Food Bank',
    registered: 5,
    totalSlots: 27,
    cutoffDate: '2026-03-22',
    cutoffTime: '17:00',
    status: 'Closed',
  },
  {
    name: 'Clean Water Project',
    serviceType: 'Health',
    scheduleDate: '2026-03-30',
    scheduleTime: '11:00',
    location: 'Riverside Community Center',
    registered: 35,
    totalSlots: 35,
    cutoffDate: '2026-03-27',
    cutoffTime: '17:00',
    status: 'Full',
  },
];
