import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Registration {
  _id?: string;
  employeeId: string;
  activityId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegistrationWithActivity {
  _id?: string;
  employeeId: string;
  activity: {
    _id?: string;
    name: string;
    serviceType: string;
    scheduleDate: string;
    scheduleTime: string;
    location: string;
    description: string;
    cutoffDate: string;
    cutoffTime: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeRegistration {
  _id?: string;
  employeeName: string;
  email: string;
  department: string;
  activity: string;
  registeredDate: string;
  registeredTime: string;
}

const API_URL = 'http://localhost:3000/api/registrations';

@Injectable({
  providedIn: 'root',
})
export class RegistrationsService {
  private http = inject(HttpClient);
  private registrationsSubject = new BehaviorSubject<Registration[]>([]);
  private activeEmployeeId: string | null = null;

  readonly registrations$ = this.registrationsSubject.asObservable();

  setActiveEmployeeId(employeeId: string) {
    this.activeEmployeeId = employeeId;
  }

  refreshActiveRegistrations() {
    if (!this.activeEmployeeId) {
      return;
    }

    this.listRegistrations(this.activeEmployeeId).subscribe({
      error: (err) => {
        console.error('Error refreshing registrations:', err);
      },
    });
  }

  listRegistrations(employeeId: string): Observable<Registration[]> {
    return this.http
      .get<Registration[]>(`${API_URL}?employeeId=${encodeURIComponent(employeeId)}`)
      .pipe(
        tap((registrations) => {
          this.registrationsSubject.next(registrations);
        }),
      );
  }

  listRegistrationsWithActivity(employeeId: string): Observable<RegistrationWithActivity[]> {
    return this.http.get<RegistrationWithActivity[]>(
      `${API_URL}/with-activity?employeeId=${encodeURIComponent(employeeId)}`,
    );
  }

  listRegistrationsWithEmployee(): Observable<EmployeeRegistration[]> {
    return this.http.get<EmployeeRegistration[]>(`${API_URL}/with-employee`);
  }

  createRegistration(employeeId: string, activityId: string): Observable<Registration> {
    return this.http.post<Registration>(API_URL, { employeeId, activityId }).pipe(
      tap(() => {
        this.refreshActiveRegistrations();
      }),
    );
  }

  deleteRegistration(employeeId: string, activityId: string): Observable<{ message: string }> {
    return this.http
      .delete<{
        message: string;
      }>(
        `${API_URL}?employeeId=${encodeURIComponent(employeeId)}&activityId=${encodeURIComponent(activityId)}`,
      )
      .pipe(
        tap(() => {
          this.refreshActiveRegistrations();
        }),
      );
  }
}
