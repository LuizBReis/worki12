import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, of, switchMap, map, BehaviorSubject } from 'rxjs';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

// Serviços e Interfaces
import { MessageService, Conversation, Message } from '../../services/message';
import { AuthService } from '../../auth/auth.service';

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
export class Messages implements OnInit, AfterViewChecked {

  @ViewChild('messageListContainer') private messageListContainer!: ElementRef;

  conversations$: Observable<Conversation[]>;
  activeConversation$: Observable<Conversation | undefined>;
  messages$ = new BehaviorSubject<Message[]>([]);
  currentUserId: string | null;

  // FormControl para a caixa de texto
  messageControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  constructor(
    private messageService: MessageService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.currentUserId = this.authService.getUserId();
    this.conversations$ = of([]);
    this.activeConversation$ = of(undefined);
  }

  ngOnInit(): void {
    // 1. Busca a lista de conversas
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

    // 3. Ouve a URL e busca as mensagens da conversa ativa
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

    // ==========================================================
    // ✅ CORREÇÃO APLICADA AQUI
    // ==========================================================
    this.messageService.onNewMessage().subscribe(newMessage => {
      // Apenas adiciona a mensagem via socket se o remetente (senderId)
      // for DIFERENTE do usuário que está vendo a tela (currentUserId).
      if (newMessage.senderId !== this.currentUserId) {
        const currentMessages = this.messages$.getValue();
        this.messages$.next([...currentMessages, newMessage]);
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.messageListContainer.nativeElement.scrollTop = this.messageListContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  onSendMessage(): void {
    if (this.messageControl.invalid) return;

    const conversationId = this.route.snapshot.paramMap.get('id');
    if (conversationId) {
      const content = this.messageControl.value;
      this.messageService.sendMessage(conversationId, content).subscribe({
        next: (newMessage) => {
          // Adição "otimista": adiciona a SUA PRÓPRIA mensagem imediatamente
          const currentMessages = this.messages$.getValue();
          this.messages$.next([...currentMessages, newMessage]);
          this.messageControl.reset();
        },
        error: (err) => console.error("Erro ao enviar mensagem:", err)
      });
    }
  }
}