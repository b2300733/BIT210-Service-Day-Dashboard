import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface User {
  _id?: string;
  email: string;
  name: string;
  department: string;
  role: 'admin' | 'employee';
}

interface UserRecord {
  _id: string;
  email: string;
  name: string;
  department: string;
  role: 'admin' | 'employee';
}

const API_URL = 'http://localhost:3000/api/users';
const STORAGE_KEY = 'auth.currentUser';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private _currentUser = signal<User | null>(null);

  readonly currentUser = this._currentUser.asReadonly();

  constructor() {
    this.restoreUser();
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<UserRecord>(`${API_URL}/login`, { email, password }).pipe(
      tap((user) => {
        const nextUser: User = {
          _id: user._id,
          email: user.email,
          name: user.name,
          department: user.department,
          role: user.role,
        };
        this._currentUser.set(nextUser);
        this.persistUser(nextUser);
      }),
      map((user) => ({
        _id: user._id,
        email: user.email,
        name: user.name,
        department: user.department,
        role: user.role,
      })),
    );
  }

  logout() {
    this._currentUser.set(null);
    this.clearPersistedUser();
  }

  fetchUserId(email: string): Observable<string | null> {
    return this.http.get<UserRecord>(`${API_URL}/by-email?email=${encodeURIComponent(email)}`).pipe(
      tap((user) => {
        const current = this._currentUser();
        if (current?.email === email) {
          const nextUser = { ...current, _id: user._id };
          this._currentUser.set(nextUser);
          this.persistUser(nextUser);
        }
      }),
      map((user) => user?._id ?? null),
      catchError((err) => {
        console.error('Failed to resolve user id:', err);
        return of(null);
      }),
    );
  }

  private restoreUser() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as User;
      if (parsed?.email && parsed?.role) {
        this._currentUser.set(parsed);
      }
    } catch (err) {
      console.error('Failed to restore user:', err);
      this.clearPersistedUser();
    }
  }

  private persistUser(user: User) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  private clearPersistedUser() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
  }
}
