import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Building2, ChartColumn, Bell, QrCode } from 'lucide-angular';

@Component({
  selector: 'app-admin-navbar',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './admin-navbar.html',
  styleUrl: './admin-navbar.css',
})
export class AdminNavbarComponent {
  readonly Building2 = Building2;
  readonly ChartColumn = ChartColumn;
  readonly Bell = Bell;
  readonly QrCode = QrCode;
}
