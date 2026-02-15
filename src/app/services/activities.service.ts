import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Activity, ACTIVITIES_DATA } from '../data/activities.data';

@Injectable({
  providedIn: 'root',
})
export class ActivitiesService {
  private activitiesSubject = new BehaviorSubject<Activity[]>(ACTIVITIES_DATA);
  public activities$ = this.activitiesSubject.asObservable();

  getActivities(): Activity[] {
    return this.activitiesSubject.value;
  }

  addActivity(activity: Activity): void {
    const currentActivities = this.activitiesSubject.value;
    this.activitiesSubject.next([...currentActivities, activity]);
  }

  updateActivity(oldActivity: Activity, newActivity: Activity): void {
    const currentActivities = this.activitiesSubject.value;
    const index = currentActivities.indexOf(oldActivity);
    if (index !== -1) {
      const updated = [...currentActivities];
      updated[index] = newActivity;
      this.activitiesSubject.next(updated);
    }
  }

  deleteActivity(activity: Activity): void {
    const currentActivities = this.activitiesSubject.value;
    this.activitiesSubject.next(currentActivities.filter((a) => a !== activity));
  }

  getStatistics() {
    const activities = this.activitiesSubject.value;
    return {
      totalActivities: activities.length,
      totalSlots: activities.reduce((sum, a) => sum + a.totalSlots, 0),
      totalRegistered: activities.reduce((sum, a) => sum + a.registered, 0),
      get totalAvailable() {
        return this.totalSlots - this.totalRegistered;
      },
    };
  }

  getActivityStatus(activity: Activity): 'Open' | 'Full' | 'Closed' {
    const now = new Date();
    const cutoffDateTime = new Date(`${activity.cutoffDate}T${activity.cutoffTime}`);

    // Check if cutoff date/time has passed
    if (now > cutoffDateTime) {
      return 'Closed';
    }

    // Check if activity is full
    if (activity.registered >= activity.totalSlots) {
      return 'Full';
    }

    // Otherwise, it's open
    return 'Open';
  }
}
