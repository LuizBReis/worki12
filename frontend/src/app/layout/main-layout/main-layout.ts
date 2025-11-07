import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../services/notification';
import { Observable } from 'rxjs';

// Imports do Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss']
})
export class MainLayout implements OnInit, OnDestroy {
  userId: string | null = null;
  hasUnreadMessages$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Observa o status de mensagens não lidas
    this.hasUnreadMessages$ = this.notificationService.getUnreadMessagesStatus();
  }

  ngOnInit(): void {
    // Pega o ID do usuário
    this.userId = this.authService.getUserId();
    
    // Autentica o usuário no socket de notificações
    if (this.userId) {
      this.notificationService.authenticate(this.userId);
    }
  }

  ngOnDestroy(): void {
    // Desconecta o socket quando o componente é destruído
    this.notificationService.disconnect();
  }

  navigateToProfile(): void {
    if (this.userId) {
      this.router.navigate(['/profile', this.userId]);
    }
  }

  logout(): void {
    this.notificationService.disconnect();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}