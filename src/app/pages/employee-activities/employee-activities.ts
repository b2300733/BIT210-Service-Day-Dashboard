import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import {
  LucideAngularModule,
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  X,
  AlertTriangle,
} from 'lucide-angular'; // <-- Added AlertTriangle
import { ActivitiesService } from '../../../../backend/services/activities.service';
import { AuthService } from '../../../../backend/services/auth.service';
import { RegistrationsService } from '../../../../backend/services/registrations.service';
import { Activity } from '../../models/activity.model';

@Component({
  selector: 'app-employee-activities',
  imports: [CommonModule, MatCardModule, MatButtonModule, LucideAngularModule, FormsModule],
  templateUrl: './employee-activities.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeActivitiesComponent implements OnInit {
  readonly MapPin = MapPin;
  readonly Calendar = Calendar;
  readonly Users = Users;
  readonly Clock = Clock;
  readonly CheckCircle = CheckCircle;
  readonly X = X;
  readonly AlertTriangle = AlertTriangle; // <-- Added for the conflict modal

  private readonly activitiesService = inject(ActivitiesService);
  private readonly registrationsService = inject(RegistrationsService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly cardBaseClass =
    'flex min-h-105 cursor-pointer flex-col justify-between rounded-xl !bg-white p-6 transition-all duration-200 ease-in hover:-translate-y-1 hover:shadow-lg';

  searchTerm = '';
  selectedActivity: Activity | null = null;

  // Tracks conflicting activities to trigger the warning modal
  conflictWarning: { attempting: Activity; existing: Activity } | null = null;

  activities: Activity[] = [];
  private userRegistrations = new Set<string>();

  ngOnInit() {
    this.activitiesService.activities$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((activities) => {
        this.activities = activities;
        this.changeDetectorRef.markForCheck();
      });

    this.activitiesService.fetchActivities().subscribe({
      error: (err) => {
        console.error('Error loading activities:', err);
      },
    });

    this.ensureEmployeeId().subscribe(() => {
      this.loadRegistrations();
    });
  }

  get filteredActivities() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.activities;
    }

    return this.activities.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.location.toLowerCase().includes(term) ||
        a.serviceType.toLowerCase().includes(term),
    );
  }

  openDetails(activity: Activity) {
    this.selectedActivity = activity;
  }

  closeDetails() {
    this.selectedActivity = null;
  }

  isRegistered(activity: Activity): boolean {
    return this.userRegistrations.has(this.getActivityKey(activity));
  }

  getCutoffLabel(activity: Activity): string {
    return `${activity.cutoffDate} at ${activity.cutoffTime}`;
  }

  isCutoffPassed(activity: Activity): boolean {
    if (!activity.cutoffDate || !activity.cutoffTime) {
      return false;
    }

    const cutoffDateTime = new Date(`${activity.cutoffDate}T${activity.cutoffTime}`);
    return Number.isNaN(cutoffDateTime.getTime()) ? false : cutoffDateTime < new Date();
  }

  register(activity: Activity) {
    console.log('Attempting to register for:', activity.name);

    if (this.isCutoffPassed(activity)) {
      console.warn('Registration cutoff has passed.');
      return;
    }

    // 1. Check if the user is already registered for an event on this same date
    const existingRegistration = this.activities.find(
      (a) =>
        this.isRegistered(a) &&
        a.scheduleDate === activity.scheduleDate &&
        this.getActivityKey(a) !== this.getActivityKey(activity),
    );

    // 2. If a conflict exists, show the warning modal and stop the registration
    if (existingRegistration) {
      console.log('Conflict found! Already registered for:', existingRegistration.name);

      // Close the details modal (if open) so they don't overlap
      this.selectedActivity = null;

      // Trigger the warning modal
      this.conflictWarning = {
        attempting: activity,
        existing: existingRegistration,
      };
      return;
    }

    // 3. Otherwise, proceed with registration
    console.log('Registration successful!');
    this.ensureEmployeeId().subscribe((employeeId) => {
      if (!employeeId || !activity._id) {
        console.error('Missing employee or activity id.', {
          employeeId,
          activityId: activity._id,
        });
        return;
      }

      this.registrationsService.createRegistration(employeeId, activity._id).subscribe({
        next: () => {
          this.userRegistrations = new Set(this.userRegistrations).add(
            this.getActivityKey(activity),
          );
          this.changeDetectorRef.markForCheck();
          this.refreshActivities();
        },
        error: (err) => {
          console.error('Registration failed:', err);
        },
      });
    });
  }

  cancelRegistration(activity: Activity) {
    this.ensureEmployeeId().subscribe((employeeId) => {
      if (!employeeId || !activity._id) {
        console.error('Missing employee or activity id.', {
          employeeId,
          activityId: activity._id,
        });
        return;
      }

      this.registrationsService.deleteRegistration(employeeId, activity._id).subscribe({
        next: () => {
          const nextRegistrations = new Set(this.userRegistrations);
          nextRegistrations.delete(this.getActivityKey(activity));
          this.userRegistrations = nextRegistrations;
          this.changeDetectorRef.markForCheck();
          this.refreshActivities();
        },
        error: (err) => {
          console.error('Cancel registration failed:', err);
        },
      });
    });
  }

  // Closes the conflict warning modal
  closeConflictWarning() {
    this.conflictWarning = null;
  }

  private getActivityKey(activity: Activity): string {
    return activity._id ?? activity.name;
  }

  private refreshActivities() {
    this.activitiesService.fetchActivities().subscribe({
      error: (err) => {
        console.error('Error refreshing activities:', err);
      },
    });
  }

  private loadRegistrations() {
    const employeeId = this.getEmployeeId();
    if (!employeeId) {
      return;
    }

    this.registrationsService.listRegistrations(employeeId).subscribe({
      next: (registrations) => {
        this.userRegistrations = new Set(
          registrations.map((registration) => registration.activityId),
        );
        this.changeDetectorRef.markForCheck();
      },
      error: (err) => {
        console.error('Error loading registrations:', err);
      },
    });
  }

  private getEmployeeId(): string | null {
    return this.authService.currentUser()?._id ?? null;
  }

  private ensureEmployeeId() {
    const current = this.authService.currentUser();
    if (!current) {
      return of(null);
    }

    if (current._id) {
      return of(current._id);
    }

    return this.authService.fetchUserId(current.email);
  }
}
