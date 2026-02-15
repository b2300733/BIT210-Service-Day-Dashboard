import { Component } from '@angular/core';
import { LucideAngularModule, Heart, Bell, LogOut } from 'lucide-angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  readonly Heart = Heart;
  readonly Bell = Bell;
  readonly LogOut = LogOut;
}
