import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import Swal from 'sweetalert2';

// --- INTERFACES ---

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

// --- ✅ NOVA INTERFACE PARA O "SININHO" ---
export interface AppNotification {
 id?: string; // ID aleatório
 message: string;
 link?: string;
 read: boolean;
 createdAt: Date;
}

@Injectable({
 providedIn: 'root'
})
export class NotificationService {
 // ✅ Declarado como null para controle de inicialização
 private socket: Socket | null = null;
 private hasUnreadMessages$ = new BehaviorSubject<boolean>(false);
 private unreadConversations$ = new BehaviorSubject<Set<string>>(new Set());
 private isInMessagesPage = false;
 private readonly STORAGE_KEY = 'worki_unread_messages';
 private readonly UNREAD_CONVERSATIONS_KEY = 'worki_unread_conversations';
 private currentUserId: string | null = null;

 // --- ✅ NOVOS OBSERVABLES PARA O "SININHO" ---
 private notifications$ = new BehaviorSubject<AppNotification[]>([]);
 private hasUnreadNotifications$ = new BehaviorSubject<boolean>(false);

 constructor(private zone: NgZone) {
  // Recupera o estado persistido do localStorage
  const savedState = localStorage.getItem(this.STORAGE_KEY);
  if (savedState === 'true') {
   this.hasUnreadMessages$.next(true);
  }
  // O socket não é inicializado aqui.
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

 // ====== MÉTODOS DE SOCKET.IO (AJUSTADOS) ======

 /**
 * Autentica o usuário no socket (entra na sala pessoal)
 * ✅ Inicia a conexão do socket se ainda não estiver ativa.
 */
 authenticate(userId: string): void {
  if (userId) {
   this.currentUserId = userId; 

   // ✅ MUDANÇA 2: Inicializa o socket SE ele for null.
   if (this.socket === null) {
     console.log('✅ FORÇANDO INICIALIZAÇÃO E CONEXÃO do Socket.io...');
     this.socket = io(window.location.origin, { path: '/api/socket.io' });
     this.setupSocketListeners(); // Adiciona os listeners

     // Adiciona o listener 'connect' (disparado na primeira conexão e reconexões)
     this.socket.on('connect', () => {
       console.log('Socket conectado! Disparando autenticação...');
       if (this.currentUserId) { 
         // Envia a autenticação
         (this.socket as Socket).emit('authenticate', this.currentUserId);
         console.log(`Usuário ${this.currentUserId} autenticado no socket de notificações`);
       }
     });

      // Trata especificamente reconexões automáticas
      this.socket.on('reconnect', () => {
          if (this.currentUserId) {
              (this.socket as Socket).emit('authenticate', this.currentUserId);
          }
      });
   } else if (this.socket.connected) {
      // Se já está inicializado e conectado
     this.socket.emit('authenticate', userId);
     console.log(`Usuário ${userId} re-autenticado no socket de notificações`);
   } else {
      // Se está inicializado, mas não conectado (Aguardando o 'connect' ou falha)
      console.log(`Socket está em processo de conexão. Aguardando evento 'connect'.`);
   }
  }
 }
 
 /**
 * Configura os listeners do socket
 */
 private setupSocketListeners(): void {
  // Adiciona o casting `as Socket` pois TypeScript sabe que ele não é null aqui.
  const socketNonNull = this.socket as Socket;

  // --- Listener do "Sinalzinho" de Chat ---
  socketNonNull.on('new_message_notification', (notification: MessageNotification) => {
   this.zone.run(() => {
      console.log('Nova notificação de mensagem recebida:', notification);
      if (!this.isInMessagesPage) {
       this.setUnreadStatus(true);
      }
     });
   }); 

  // --- NOVO LISTENER (para o "sininho") ---
  socketNonNull.on('new_notification', (notification: { message: string, link?: string }) => {
   this.zone.run(() => {
    console.log('Nova notificação do "SININHO" recebida:', notification);
    const newNotification: AppNotification = {
     ...notification,
     id: Math.random().toString(36).substring(2),
     read: false,
     createdAt: new Date()
    };
    
    // Adiciona a nova notificação no início da lista
    const currentNotifications = this.notifications$.getValue();
    this.notifications$.next([newNotification, ...currentNotifications]);
    
    // Acende o "sininho"
    this.hasUnreadNotifications$.next(true); 
   });
  });

  // --- Listener do "Limpar" ---
  socketNonNull.on('notifications_cleared', () => {
   this.zone.run(() => {
    this.setUnreadStatus(false);
   });
  });
 }

 // --- MÉTODOS DO "SINALZINHO" DE CHAT (já existentes) ---

 private setUnreadStatus(hasUnread: boolean): void {
  this.hasUnreadMessages$.next(hasUnread);
  localStorage.setItem(this.STORAGE_KEY, String(hasUnread));
 }

 getUnreadMessagesStatus(): Observable<boolean> {
  return this.hasUnreadMessages$.asObservable();
 }

 setInMessagesPage(isInPage: boolean): void {
  this.isInMessagesPage = isInPage;
  if (isInPage) {
   this.clearNotifications();
  }
 }

 /**
  * ✅ CORREÇÃO: Verifica se o socket está conectado antes de emitir.
  */
 clearNotifications(): void {
  this.setUnreadStatus(false);
  // 🛑 CHECAGEM DE NULO: Garante que o socket existe e está conectado
  if (this.socket && this.socket.connected) { 
      this.socket.emit('mark_notifications_read');
  } else {
      console.log('Tentativa de limpar notificações, mas o socket não está conectado.');
  }
 }

 // --- ✅ NOVOS MÉTODOS DO "SININHO" ---
 
 // Observable para o "sinalzinho" vermelho do sino
 getHasUnreadNotifications(): Observable<boolean> {
  return this.hasUnreadNotifications$.asObservable();
 }

 // Observable para a lista de notificações (dropdown)
 getNotifications(): Observable<AppNotification[]> {
  return this.notifications$.asObservable();
 }

 // Chamado quando o usuário clica no "sininho" para abrir o menu
 markBellAsRead(): void {
  this.hasUnreadNotifications$.next(false);
 }

 // --- MÉTODO DE DESCONECTAR (Ajustado) ---
 disconnect(): void {
  if (this.socket) {
   this.socket.disconnect();
   this.socket = null; // Zera o socket para forçar a inicialização no próximo login
  }
  localStorage.removeItem(this.STORAGE_KEY);
  this.currentUserId = null;
 }
}