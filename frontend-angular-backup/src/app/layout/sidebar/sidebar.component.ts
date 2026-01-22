
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  menuItems = [
    { icon: 'home', label: 'Home', route: '/dashboard' },
    { icon: 'search', label: 'Vagas', route: '/dashboard' }, // Adjusted to match existing routes
    { icon: 'work', label: 'Meus Trabalhos', route: '/my-jobs' },
    { icon: 'chat', label: 'Mensagens', route: '/messages/inbox' },
    { icon: 'person', label: 'Perfil', route: '/profile/me' }, // Will need dynamic ID later
    { icon: 'settings', label: 'Configurações', route: '/settings' },
  ];
}
