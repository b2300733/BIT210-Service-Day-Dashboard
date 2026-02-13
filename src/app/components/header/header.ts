import { Component } from '@angular/core';
import { LucideAngularModule, Heart, Bell, LogOut } from 'lucide-angular';

@Component({
  selector: 'app-header',
  imports: [LucideAngularModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  readonly Heart = Heart;
  readonly Bell = Bell;
  readonly LogOut = LogOut;
}
