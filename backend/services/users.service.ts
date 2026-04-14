import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserPayload {
  name: string;
  email: string;
  password: string;
  department: string;
}

export interface UserResponse {
  _id: string;
  name: string;
  email: string;
  department: string;
  createdAt: string;
}

const API_URL = 'http://localhost:3000/api/users';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private http = inject(HttpClient);

  createUser(payload: UserPayload): Observable<UserResponse> {
    return this.http.post<UserResponse>(API_URL, payload);
  }

  listUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(API_URL);
  }
}
