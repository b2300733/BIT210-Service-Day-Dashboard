import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap, map, catchError } from 'rxjs/operators';
import { Activity, ACTIVITIES_DATA } from '../data/activities.data';

const API_URL = '/api/activities';

@Injectable({
  providedIn: 'root',
})
export class ActivitiesService {
  private http = inject(HttpClient);

  private mockDatabase: Activity[] = [...ACTIVITIES_DATA];

  private activitiesSubject = new BehaviorSubject<Activity[]>([...ACTIVITIES_DATA]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public activities$ = this.activitiesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  getActivities(): Activity[] {
    return this.activitiesSubject.value;
  }

  fetchActivities(): Observable<Activity[]> {
    this.loadingSubject.next(true);

    return of([...this.mockDatabase]).pipe(
      tap((activities) => {
        this.activitiesSubject.next(activities);
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      }),
    );
  }

  addActivity(activity: Activity): Observable<Activity> {
    this.loadingSubject.next(true);

    return of(activity).pipe(
      tap((newActivity) => {
        console.log('Adding activity:', newActivity.name);
        this.mockDatabase = [...this.mockDatabase, newActivity];
        this.activitiesSubject.next([...this.mockDatabase]);
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        console.error('Error adding activity:', error);
        return throwError(() => error);
      }),
    );
  }

  updateActivity(oldActivity: Activity, newActivity: Activity): Observable<Activity> {
    this.loadingSubject.next(true);

    return of(newActivity).pipe(
      tap((updated) => {
        console.log('Updating activity:', updated.name);
        const index = this.mockDatabase.findIndex((a) => a.name === oldActivity.name);
        if (index !== -1) {
          this.mockDatabase = [...this.mockDatabase];
          this.mockDatabase[index] = updated;
          this.activitiesSubject.next([...this.mockDatabase]);
        }
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        console.error('Error updating activity:', error);
        return throwError(() => error);
      }),
    );
  }

  deleteActivity(activity: Activity): Observable<void> {
    this.loadingSubject.next(true);

    return of(undefined).pipe(
      tap(() => {
        console.log('Deleting activity:', activity.name);
        this.mockDatabase = this.mockDatabase.filter((a) => a.name !== activity.name);
        this.activitiesSubject.next([...this.mockDatabase]);
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        console.error('Error deleting activity:', error);
        return throwError(() => error);
      }),
    );
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

    if (now > cutoffDateTime) {
      return 'Closed';
    }

    if (activity.registered >= activity.totalSlots) {
      return 'Full';
    }

    return 'Open';
  }
}
