import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule, Heart, CalendarCheck, Search, Bell } from 'lucide-angular';
import { EmployeeNavbarComponent } from '../../components/employee-navbar/employee-navbar';

@Component({
  selector: 'app-employee-dashboard',
  imports: [EmployeeNavbarComponent, MatCardModule, RouterOutlet, LucideAngularModule],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css',
})
export class EmployeeDashboardPage {
  readonly Heart = Heart;
  readonly CalendarCheck = CalendarCheck;
  readonly Search = Search;
  readonly Bell = Bell;
}
