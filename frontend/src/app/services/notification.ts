import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import Swal from 'sweetalert2';


export interface MessageNotification {
  conversationId: string;
  message: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
    sender: {
      id: string;
      firstName: string;
    }
  };
  isSystemMessage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // ====== SOCKET.IO PARA NOTIFICAÇÕES EM TEMPO REAL ======
  private socket: Socket;
  private hasUnreadMessages$ = new BehaviorSubject<boolean>(false);
  private unreadConversations$ = new BehaviorSubject<Set<string>>(new Set());
  private isInMessagesPage = false;
  private readonly STORAGE_KEY = 'worki_unread_messages';
  private readonly UNREAD_CONVERSATIONS_KEY = 'worki_unread_conversations';
  private currentUserId: string | null = null;

  constructor(private zone: NgZone) {
    // Recupera o estado persistido do localStorage
    const savedState = localStorage.getItem(this.STORAGE_KEY);
    if (savedState === 'true') {
      this.hasUnreadMessages$.next(true);
    }

    // Conecta ao socket
    this.socket = io(window.location.origin, { path: '/api/socket.io' });
    
    // Configura listeners
    this.setupSocketListeners();

    // Re-autentica quando reconectar após F5
    this.socket.on('connect', () => {
      console.log('Socket reconectado');
      if (this.currentUserId) {
        console.log(`Re-autenticando usuário ${this.currentUserId}`);
        this.socket.emit('authenticate', this.currentUserId);
      }
    });
  }

  // ====== MÉTODOS DE SWEETALERT2 (MANTIDOS) ======
  
  success(title: string, text?: string) {
    return Swal.fire({
      icon: 'success',
      title,
      text: text || '',
      confirmButtonColor: '#34c759'
    });
  }

  error(title: string, text?: string) {
    return Swal.fire({
      icon: 'error',
      title,
      text: text || '',
      confirmButtonColor: '#d33'
    });
  }

  info(title: string, text?: string) {
    return Swal.fire({
      icon: 'info',
      title,
      text: text || '',
      confirmButtonColor: '#34c759'
    });
  }

  warn(title: string, text?: string) {
    return Swal.fire({
      icon: 'warning',
      title,
      text: text || '',
      confirmButtonColor: '#34c759'
    });
  }

  confirm(options: {
    title?: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    cancelColor?: string;
  } = {}) {
    const {
      title = 'Tem certeza?',
      text = '',
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
      confirmColor = '#34c759',
      cancelColor = '#999'
    } = options;

    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: confirmColor,
      cancelButtonColor: cancelColor
    }).then(res => res.isConfirmed);
  }

  // ====== MÉTODOS DE SOCKET.IO (NOVOS) ======

  /**
   * Autentica o usuário no socket (entra na sala pessoal)
   */
  authenticate(userId: string): void {
    if (userId) {
      this.currentUserId = userId; // Guarda o userId
      this.socket.emit('authenticate', userId);
      console.log(`Usuário ${userId} autenticado no socket de notificações`);
    }
  }

  /**
   * Configura os listeners do socket
   */
  private setupSocketListeners(): void {
    // Escuta notificações de novas mensagens
    this.socket.on('new_message_notification', (notification: MessageNotification) => {
      
      this.zone.run(() => {
              console.log('Nova notificação de mensagem recebida:', notification);
              
              // Se o usuário NÃO está na página de mensagens, mostra o badge
              if (!this.isInMessagesPage) {
                this.setUnreadStatus(true);
              }
            });

      }); 

    // Escuta confirmação de leitura
    this.socket.on('notifications_cleared', () => {
      this.zone.run(() => {
        this.setUnreadStatus(false);
      });
    });
  }

  /**
   * Atualiza o status de mensagens não lidas e persiste no localStorage
   */
  private setUnreadStatus(hasUnread: boolean): void {
    this.hasUnreadMessages$.next(hasUnread);
    localStorage.setItem(this.STORAGE_KEY, String(hasUnread));
  }

  /**
   * Observable para saber se há mensagens não lidas
   */
  getUnreadMessagesStatus(): Observable<boolean> {
    return this.hasUnreadMessages$.asObservable();
  }

  /**
   * Marca que o usuário entrou na página de mensagens
   */
  setInMessagesPage(isInPage: boolean): void {
    this.isInMessagesPage = isInPage;
    
    if (isInPage) {
      // Limpa o badge quando entra na página
      this.clearNotifications();
    }
  }

  /**
   * Limpa as notificações (remove o badge)
   */
  clearNotifications(): void {
    this.setUnreadStatus(false);
    this.socket.emit('mark_notifications_read');
  }

  /**
   * Desconecta o socket (para quando o usuário faz logout)
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    // Limpa o localStorage e o userId ao fazer logout
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUserId = null;
  }
}