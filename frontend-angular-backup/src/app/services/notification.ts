import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Conversation } from './message';
import { SupabaseService } from './supabase.service';
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
  // Supabase Channel Subscription
  private subscription: any = null; // RealtimeChannel

  private hasUnreadMessages$ = new BehaviorSubject<boolean>(false);
  private unreadConversations$ = new BehaviorSubject<Set<string>>(new Set());
  private isInMessagesPage = false;
  private readonly STORAGE_KEY = 'worki_unread_messages';
  private readonly UNREAD_CONVERSATIONS_KEY = 'worki_unread_conversations';
  private readonly LAST_READ_TS_KEY = 'worki_conversation_last_read';
  private currentUserId: string | null = null;

  // --- ✅ NOVOS OBSERVABLES PARA O "SININHO" ---
  private notifications$ = new BehaviorSubject<AppNotification[]>([]);
  private hasUnreadNotifications$ = new BehaviorSubject<boolean>(false);

  constructor(
    private zone: NgZone,
    private supabase: SupabaseService
  ) {
    // Recupera o estado persistido do localStorage
    const savedState = localStorage.getItem(this.STORAGE_KEY);
    if (savedState === 'true') {
      this.hasUnreadMessages$.next(true);
    }
    // Restaura conversas não lidas do localStorage
    const savedUnread = localStorage.getItem(this.UNREAD_CONVERSATIONS_KEY);
    if (savedUnread) {
      try {
        const arr: string[] = JSON.parse(savedUnread);
        this.unreadConversations$.next(new Set(arr));
        if (arr.length > 0) {
          this.hasUnreadMessages$.next(true);
        }
      } catch (_) {
        // ignore parsing error
      }
    }
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

  // ====== MÉTODOS DE SUPABASE REALTIME (MIGRADO) ======

  /**
   * Inicia a escuta no canal pessoal do usuário (Supabase Broadcast)
   */
  authenticate(userId: string): void {
    if (userId && userId !== this.currentUserId) {
      this.currentUserId = userId;
      this.setupRealtimeListeners(userId);
    }
  }

  private setupRealtimeListeners(userId: string): void {
    if (this.subscription) {
      this.supabase.client.removeChannel(this.subscription);
    }

    const channelName = `user:${userId}`;
    this.subscription = this.supabase.client.channel(channelName)
      .on('broadcast', { event: 'new_message_notification' }, (payload: any) => {
        const data = payload.payload as MessageNotification;
        this.zone.run(() => {
          console.log('Nova notificação de mensagem (Supabase):', data);
          if (!this.isInMessagesPage) {
            this.setUnreadStatus(true);
          }
        });
      })
      .on('broadcast', { event: 'new_notification' }, (payload: any) => {
        const data = payload.payload;
        this.zone.run(() => {
          console.log('Nova notificação do SININHO (Supabase):', data);
          const newNotification: AppNotification = {
            ...data,
            id: Math.random().toString(36).substring(2),
            read: false,
            createdAt: new Date()
          };

          const currentNotifications = this.notifications$.getValue();
          this.notifications$.next([newNotification, ...currentNotifications]);
          this.hasUnreadNotifications$.next(true);
        });
      })
      .subscribe((status: any) => {
        console.log(`Status da inscrição no canal ${channelName}:`, status);
      });
  }

  // --- MÉTODOS DO "SINALZINHO" DE CHAT ---

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
      setTimeout(() => this.clearNotifications(), 0);
    }
  }

  clearNotifications(): void {
    this.setUnreadStatus(false);
  }

  // --- ✅ MÉTODOS DO "SININHO" ---

  getHasUnreadNotifications(): Observable<boolean> {
    return this.hasUnreadNotifications$.asObservable();
  }

  getNotifications(): Observable<AppNotification[]> {
    return this.notifications$.asObservable();
  }

  markBellAsRead(): void {
    this.hasUnreadNotifications$.next(false);
  }

  // --- MÉTODO DE DESCONECTAR ---
  disconnect(): void {
    if (this.subscription) {
      this.supabase.client.removeChannel(this.subscription);
      this.subscription = null;
    }
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.UNREAD_CONVERSATIONS_KEY);
    this.currentUserId = null;
  }

  // --- Método de teste: injeta uma notificação para validação de UI ---
  injectTestNotification(message: string = 'Notificação de teste', link?: string): void {
    this.zone.run(() => {
      const newNotification: AppNotification = {
        id: Math.random().toString(36).substring(2),
        message,
        link,
        read: false,
        createdAt: new Date()
      };
      const current = this.notifications$.getValue();
      this.notifications$.next([newNotification, ...current]);
      this.hasUnreadNotifications$.next(true);
    });
  }

  // ====== MÉTODOS DE CONVERSAS NÃO LIDAS ======
  getUnreadConversations(): Observable<Set<string>> {
    return this.unreadConversations$.asObservable();
  }

  markConversationUnread(conversationId: string): void {
    const set = new Set(this.unreadConversations$.getValue());
    set.add(conversationId);
    this.unreadConversations$.next(set);
    this.setUnreadStatus(true);
    localStorage.setItem(this.UNREAD_CONVERSATIONS_KEY, JSON.stringify(Array.from(set)));
  }

  markConversationRead(conversationId: string): void {
    const set = new Set(this.unreadConversations$.getValue());
    if (set.delete(conversationId)) {
      this.unreadConversations$.next(set);
      localStorage.setItem(this.UNREAD_CONVERSATIONS_KEY, JSON.stringify(Array.from(set)));
    }
    if (set.size === 0) {
      this.setUnreadStatus(false);
    }
    this.setLastReadTimestamp(conversationId, Date.now());
  }

  // ====== SUPORTE A CÁLCULO INICIAL DE NÃO LIDAS ======
  private getLastReadMap(): Record<string, number> {
    try {
      const raw = localStorage.getItem(this.LAST_READ_TS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  private setLastReadMap(map: Record<string, number>): void {
    localStorage.setItem(this.LAST_READ_TS_KEY, JSON.stringify(map));
  }

  private getLastReadTimestamp(conversationId: string): number | null {
    const map = this.getLastReadMap();
    return map[conversationId] ?? null;
  }

  private setLastReadTimestamp(conversationId: string, ts: number): void {
    const map = this.getLastReadMap();
    map[conversationId] = ts;
    this.setLastReadMap(map);
  }

  reconcileUnreadFromConversations(conversations: Conversation[], currentUserId: string | null): void {
    const nextSet = new Set<string>();
    conversations.forEach(conv => {
      const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[0] : null;
      if (!lastMsg) { return; }
      const lastTs = new Date(lastMsg.createdAt).getTime();
      const lastRead = this.getLastReadTimestamp(conv.id) || 0;
      const isFromOther = currentUserId ? (lastMsg.senderId !== currentUserId) : true;
      if (isFromOther && lastTs > lastRead) {
        nextSet.add(conv.id);
      }
    });
    this.unreadConversations$.next(nextSet);
    localStorage.setItem(this.UNREAD_CONVERSATIONS_KEY, JSON.stringify(Array.from(nextSet)));
    this.setUnreadStatus(nextSet.size > 0);
  }
}