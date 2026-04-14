import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Registration {
  _id?: string;
  employeeId: string;
  activityId: string;
  createdAt?: string;
  updatedAt?: string;
}

const API_URL = 'http://localhost:3000/api/registrations';

@Injectable({
  providedIn: 'root',
})
export class RegistrationsService {
  private http = inject(HttpClient);

  listRegistrations(employeeId: string): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${API_URL}?employeeId=${encodeURIComponent(employeeId)}`);
  }

  createRegistration(employeeId: string, activityId: string): Observable<Registration> {
    return this.http.post<Registration>(API_URL, { employeeId, activityId });
  }

  deleteRegistration(employeeId: string, activityId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${API_URL}?employeeId=${encodeURIComponent(employeeId)}&activityId=${encodeURIComponent(
        activityId,
      )}`,
    );
  }
}
