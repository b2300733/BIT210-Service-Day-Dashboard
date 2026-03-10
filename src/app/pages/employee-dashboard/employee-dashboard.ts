import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Heart, CalendarCheck, Search, Bell } from 'lucide-angular';
import { EmployeeNavbarComponent } from '../../components/employee-navbar/employee-navbar';
import { HeaderComponent } from '../../components/header/header';
import { COMMON_PAGES_MODULES } from '../../module/common.pages.module';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [EmployeeNavbarComponent, RouterOutlet, HeaderComponent, COMMON_PAGES_MODULES],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css',
})
export class EmployeeDashboardPage {
  readonly Heart = Heart;
  readonly CalendarCheck = CalendarCheck;
  readonly Search = Search;
}
