import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { JobApplication } from './job';

// Import or define Message type
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  sender: { // Adicionando o sender que já vem da API
    id: string;
    firstName: string;
  }
}
// Interface para o objeto Conversation que a API retorna
export interface Conversation {
  id: string;
  applicationId: string;
  createdAt: Date;
  senderId: string;
  sender: {
    id: string;
    firstName: string;
  }
  isLocked: boolean;
}
export interface Conversation {
  id: string;
  application: JobApplication;
  messages?: Message[]; // Mensagens são opcionais na lista geral
  createdAt: Date;
  isLocked: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = '/api/messages';
  private socket: Socket; // 🚀 -> NOVO

  constructor(private http: HttpClient) { this.socket = io(window.location.origin, { path: '/api/socket.io' }); }

  // Inicia ou encontra uma conversa baseada no ID da candidatura
  startConversation(applicationId: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.apiUrl}/start`, { applicationId });
  }

  // --- NOVOS MÉTODOS ---
  getMyConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(this.apiUrl);
  }

  getMessages(conversationId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/${conversationId}`);
  }

  sendMessage(conversationId: string, content: string): Observable<Message> {
    const url = `${this.apiUrl}/${conversationId}`;
    return this.http.post<Message>(url, { content });
  }

  // Método para entrar em uma sala de conversa
  joinConversation(conversationId: string) {
    this.socket.emit('join_conversation', conversationId);
  }

  onNewMessage(): Observable<Message> {
    return new Observable(observer => {
      this.socket.on('receive_message', (message: Message) => {
        observer.next(message);
      });
    });
  }
}