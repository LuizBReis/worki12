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
  activeConversation$: Observable<Conversation | undefined>;
  messages$ = new BehaviorSubject<Message[]>([]);
  currentUserId: string | null;

  // FormControl para a caixa de texto
  messageControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  constructor(
    private messageService: MessageService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.currentUserId = this.authService.getUserId();
    this.conversations$ = of([]);
    this.activeConversation$ = of(undefined);
  }

  ngOnInit(): void {
    // 1. Busca a lista de conversas
    this.notificationService.setInMessagesPage(true);
    this.conversations$ = this.messageService.getMyConversations();

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
        this.messageService.joinConversation(conversationId);
        return this.messageService.getMessages(conversationId);
      })
    ).subscribe(messages => {
      this.messages$.next(messages);
    });

// Ouve por novas mensagens (só funciona quando este componente está ativo)
    this.messageService.onNewMessage().subscribe(newMessage => {
      if (newMessage.senderId !== this.currentUserId) {
        const currentMessages = this.messages$.getValue();
        this.messages$.next([...currentMessages, newMessage]);
      }
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
        },
        error: (error) => {
          console.error('Erro ao enviar mensagem:', error);
        }
      });
    }
  }