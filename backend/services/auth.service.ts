import { Injectable, signal } from '@angular/core';

export interface User {
  name: string;
  department: string;
  role: 'admin' | 'employee';
}

const USERS: Record<string, { password: string; user: User }> = {
  'admin@company.com': {
    password: 'admin123',
    user: { name: 'Alex Carter', department: 'Administration', role: 'admin' },
  },
  'jane@company.com': {
    password: 'employee123',
    user: { name: 'Jane Smith', department: 'Engineering', role: 'employee' },
  },
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser = signal<User | null>(null);

  readonly currentUser = this._currentUser.asReadonly();

  login(email: string, password: string): boolean {
    const entry = USERS[email];
    if (entry && entry.password === password) {
      this._currentUser.set(entry.user);
      return true;
    }
    return false;
  }

  logout() {
    this._currentUser.set(null);
  }
}
