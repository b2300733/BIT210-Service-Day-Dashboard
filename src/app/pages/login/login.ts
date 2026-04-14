import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Heart, LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../../backend/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, LucideAngularModule, MatCardModule, MatFormFieldModule, MatInputModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginPage {
  readonly Heart = Heart;

  email = '';
  password = '';
  error = '';

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  signIn() {
    this.error = '';
    this.authService.login(this.email, this.password).subscribe((user) => {
      if (!user) {
        this.error = 'Invalid credentials. Please try again.';
        return;
      }
      if (user.role === 'admin') {
        this.router.navigate(['/admin-dashboard']);
      } else {
        this.router.navigate(['/employee-dashboard']);
      }
    });
  }
}
