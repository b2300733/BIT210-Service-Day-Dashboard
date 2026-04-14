import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, MapPin, Calendar, Clock } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { AuthService } from '../../../../backend/services/auth.service';
import { RegistrationsService } from '../../../../backend/services/registrations.service';

interface RegistrationItem {
  id: string;
  activityId: string;
  title: string;
  category: string;
  status: string;
  description: string;
  date: string;
  time: string;
  location: string;
  registeredOn: string;
  cutoffDate: string;
  cutoffTime: string;
}

@Component({
  selector: 'app-employee-registrations',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './employee-registrations.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeRegistrationsComponent {
  readonly MapPin = MapPin;
  readonly Calendar = Calendar;
  readonly Clock = Clock;

  private readonly registrationsService = inject(RegistrationsService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  registrations: RegistrationItem[] = [];

  constructor() {
    this.ensureEmployeeId().subscribe((employeeId) => {
      if (!employeeId) {
        return;
      }

      this.registrationsService
        .listRegistrationsWithActivity(employeeId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (registrations) => {
            this.registrations = registrations.map((registration) => ({
              id: registration._id ?? `${registration.activity._id ?? registration.activity.name}`,
              activityId:
                registration.activity._id ?? `${registration.activity.name}-${registration._id}`,
              title: registration.activity.name,
              category: registration.activity.serviceType,
              status: 'Confirmed',
              description: registration.activity.description,
              date: registration.activity.scheduleDate,
              time: registration.activity.scheduleTime,
              location: registration.activity.location,
              registeredOn: this.formatDate(registration.createdAt),
              cutoffDate: registration.activity.cutoffDate,
              cutoffTime: registration.activity.cutoffTime,
            }));
            this.changeDetectorRef.markForCheck();
          },
          error: (err) => {
            console.error('Error loading registrations:', err);
          },
        });
    });
  }

  cancelRegistration(registrationId: string) {
    const target = this.registrations.find((reg) => reg.id === registrationId);
    if (!target) {
      return;
    }

    if (this.isCutoffPassed(target)) {
      console.warn('Cancellation cutoff has passed.');
      return;
    }

    const employeeId = this.authService.currentUser()?._id ?? null;
    if (!employeeId) {
      return;
    }

    this.registrationsService.deleteRegistration(employeeId, target.activityId).subscribe({
      next: () => {
        this.registrations = this.registrations.filter((reg) => reg.id !== registrationId);
        this.changeDetectorRef.markForCheck();
      },
      error: (err) => {
        console.error('Cancel registration failed:', err);
      },
    });
  }

  private formatDate(value?: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
  }

  isCutoffPassed(registration: RegistrationItem): boolean {
    if (!registration.cutoffDate || !registration.cutoffTime) {
      return false;
    }

    const cutoffDateTime = new Date(`${registration.cutoffDate}T${registration.cutoffTime}`);
    return Number.isNaN(cutoffDateTime.getTime()) ? false : cutoffDateTime < new Date();
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
