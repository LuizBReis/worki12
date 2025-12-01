import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, of, switchMap, map, BehaviorSubject } from 'rxjs';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

// Serviços e Interfaces
import { MessageService, Conversation, Message } from '../../services/message';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../services/notification';

// Imports do Material
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TextFieldModule } from '@angular/cdk/text-field';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule, MatListModule, MatIconModule, MatButtonModule,
    MatTooltipModule, MatFormFieldModule, MatInputModule, TextFieldModule,
    RouterLink, ReactiveFormsModule
  ],
  templateUrl: './messages.html',
  styleUrls: ['./messages.scss']
})
export class Messages implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('messageListContainer') private messageListContainer!: ElementRef;

  conversations$: Observable<Conversation[]>;
  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  activeConversation$: Observable<Conversation | undefined>;
  messages$ = new BehaviorSubject<Message[]>([]);
  currentUserId: string | null;
  // Unread tracking
  private unreadSet = new Set<string>();
  unreadConversations$: Observable<Set<string>>;

  // FormControl para a caixa de texto
  messageControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  constructor(
    private messageService: MessageService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.currentUserId = this.authService.getUserId();
    this.conversations$ = this.conversationsSubject.asObservable();
    this.activeConversation$ = of(undefined);
    this.unreadConversations$ = this.notificationService.getUnreadConversations();
  }

  ngOnInit(): void {
    // Garante autenticação no socket de notificações se o layout ainda não tiver autenticado
    if (this.currentUserId) {
      this.notificationService.authenticate(this.currentUserId);
    }
    // 1. Busca a lista de conversas
    this.notificationService.setInMessagesPage(true);
    this.messageService.getMyConversations().subscribe(convs => {
      this.conversationsSubject.next(this.sortByLastActivity(convs));
      // Reconcilia estado de não lidas baseado nos timestamps
      this.notificationService.reconcileUnreadFromConversations(convs, this.currentUserId);
    });

    // 2. Ouve a URL para saber qual conversa está ativa
    this.activeConversation$ = this.route.paramMap.pipe(
      switchMap(params => {
        const conversationId = params.get('id');
        if (!conversationId || conversationId === 'inbox') {
          return of(undefined);
        }
        return this.conversations$.pipe(
          map(conversations => conversations.find(c => c.id === conversationId))
        );
      })
    );

    // Busca mensagens e entra na sala
    this.route.paramMap.pipe(
      switchMap(params => {
        const conversationId = params.get('id');
        if (!conversationId || conversationId === 'inbox') {
          return of([]);
        }
        // Adia a marcação como lida para o próximo tick para evitar NG0100
        setTimeout(() => {
          this.notificationService.markConversationRead(conversationId);
        }, 0);
        this.messageService.joinConversation(conversationId);
        return this.messageService.getMessages(conversationId);
      })
    ).subscribe(messages => {
      this.messages$.next(messages);
    });

// Ouve por novas mensagens (só funciona quando este componente está ativo)
    this.messageService.onNewMessage().subscribe(newMessage => {
      // Atualiza a janela da conversa apenas para mensagens recebidas
      if (newMessage.senderId !== this.currentUserId) {
        const currentMessages = this.messages$.getValue();
        this.messages$.next([...currentMessages, newMessage]);
      }
      // Sempre reordena a lista de conversas pelo último activity
      this.updateConversationActivity(newMessage.conversationId, newMessage);
      // Atualiza o estado local de não lidas
      this.unreadConversations$.subscribe(set => {
        this.unreadSet = new Set(set);
      });
    });

    // Mantém espelhado o set de não lidas
    this.unreadConversations$.subscribe(set => {
      this.unreadSet = new Set(set);
    });
  }

ngOnDestroy(): void {
    // Informa que saiu da página de mensagens
    this.notificationService.setInMessagesPage(false);
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.messageListContainer) {
        this.messageListContainer.nativeElement.scrollTop = 
          this.messageListContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Erro ao fazer scroll:', err);
    }
  }

  onSendMessage(): void {
      if (this.messageControl.invalid) return;

      const conversationId = this.route.snapshot.paramMap.get('id');
      if (!conversationId || conversationId === 'inbox') return;

      const content = this.messageControl.value.trim();
      if (!content) return;

      this.messageService.sendMessage(conversationId, content).subscribe({
        next: (newMessage) => {
          const currentMessages = this.messages$.getValue();
          this.messages$.next([...currentMessages, newMessage]);
          this.messageControl.reset();
          // Reordena a conversa ativa para o topo
          this.updateConversationActivity(conversationId, newMessage);
          // Mensagem enviada pelo usuário marca como lida
          this.notificationService.markConversationRead(conversationId);
        },
        error: (error) => {
          console.error('Erro ao enviar mensagem:', error);
        }
      });
  }

  // --- Helpers de ordenação por última atividade ---
  private sortByLastActivity(conversations: Conversation[]): Conversation[] {
    return [...conversations].sort((a, b) => {
      const aTs = this.getConversationLastTimestamp(a);
      const bTs = this.getConversationLastTimestamp(b);
      return bTs - aTs;
    });
  }

  private getConversationLastTimestamp(conv: Conversation): number {
    const lastMsgDate = conv.messages && conv.messages.length > 0
      ? new Date(conv.messages[0].createdAt).getTime()
      : new Date(conv.createdAt).getTime();
    return lastMsgDate;
  }

  private updateConversationActivity(conversationId: string, lastMessage?: Message): void {
    const list = this.conversationsSubject.getValue();
    const idx = list.findIndex(c => c.id === conversationId);
    if (idx >= 0) {
      const conv = list[idx];
      const updated: Conversation = {
        ...conv,
        messages: lastMessage ? [lastMessage] : conv.messages
      };
      const newList = [...list];
      newList[idx] = updated;
      this.conversationsSubject.next(this.sortByLastActivity(newList));
    } else {
      // Se não estiver na lista (caso raro), refetch garantido
      this.messageService.getMyConversations().subscribe(convs => {
        this.conversationsSubject.next(this.sortByLastActivity(convs));
      });
    }
  }

  // --- Helpers de UI ---
  isUnread(conversationId: string): boolean {
    return this.unreadSet.has(conversationId);
  }
}