import { Component, OnInit, OnDestroy, isDevMode, ChangeDetectorRef } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common'; // ✅ 1. Importe AsyncPipe
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
// ✅ 2. Importe a interface AppNotification
import { NotificationService, AppNotification } from '../../services/notification'; 
import { Observable, Subscription } from 'rxjs';

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
    MatBadgeModule,
    AsyncPipe // ✅ 3. Adicione AsyncPipe aos imports
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss']
})
export class MainLayout implements OnInit, OnDestroy {
  devMode = isDevMode();
  userId: string | null = null;
  private authSubscription!: Subscription;
  hasUnreadMessages$: Observable<boolean>;
  // --- ✅ 4. NOVAS PROPRIEDADES PARA O "SININHO" ---
  hasUnreadNotifications$!: Observable<boolean>; // Badge do "Sininho"
  notifications$!: Observable<AppNotification[]>; // Lista de Notificações

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Observa o status do "sinalzinho" de chat
    this.hasUnreadMessages$ = this.notificationService.getUnreadMessagesStatus();
    
    // --- ✅ 5. PEGA OS OBSERVABLES DO "SININHO" ---
    this.hasUnreadNotifications$ = this.notificationService.getHasUnreadNotifications();
    this.notifications$ = this.notificationService.getNotifications();
  }

ngOnInit(): void {
  // ✅ MUDANÇA CRÍTICA: Inscreve-se no Observable do ID
  this.authSubscription = this.authService.currentUserId$.subscribe(userId => {
   // Se o ID mudou e existe (seja no F5 ou após o login)
   if (userId && userId !== this.userId) { 
    this.userId = userId;
    console.log('MainLayout detectou userId. Chamando Socket.authenticate...');
    // Isso chamará a função do NotificationService com o ID garantido
    this.notificationService.authenticate(userId);
   } else if (!userId) {
          // Opcional: Limpar o userId local no logout
          this.userId = null;
      }
  });
 }

ngOnDestroy(): void {
  // ✅ CRÍTICO: Desfaz a inscrição
    if (this.authSubscription) {
        this.authSubscription.unsubscribe();
    }
  // Desconecta o socket quando o componente é destruído
  this.notificationService.disconnect();
 }
  // --- ✅ 6. NOVA FUNÇÃO (para o "Sininho") ---
  // Chamada quando o usuário clica no "sininho" para abrir o menu
  onBellClick(): void {
    // Agenda atualização para o próximo tick, evitando NG0100
    setTimeout(() => {
      this.notificationService.markBellAsRead();
      this.cdr.markForCheck();
    }, 0);
  }

  // --- ✅ 7. NOVA FUNÇÃO (para o "Sininho") ---
  // Chamada quando o usuário clica em um item da lista de notificação
  onNotificationClick(notification: AppNotification): void {
    if (notification.link) {
      this.router.navigate([notification.link]);
    }
    // Opcional: marcar a notificação individual como lida
  }

  // Botão de teste (apenas em modo dev) para validar a UI do sino
  // Removido para produção

  // --- ✅ 8. FUNÇÃO QUE FALTAVA (para o "Sinalzinho" de Mensagens) ---
  // Seu HTML (main-layout.html) chama esta função quando o link "Mensagens" é clicado
  onMessagesClick(): void {
    this.notificationService.clearNotifications();
  }

  // --- Funções existentes ---
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