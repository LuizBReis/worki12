// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs'; // ✅ Adicionado BehaviorSubject e tap
import { environment } from '../../environments/environment';

@Injectable({
 providedIn: 'root'
})
export class AuthService {
 private base = environment.apiBaseUrl || '';
 private apiUrl = `${this.base}/api/auth`;
 private profileApiUrl = `${this.base}/api/profile`;

 // ✅ NOVO: Fonte de verdade para o User ID (inicializa com o valor atual do token)
 private currentUserIdSubject = new BehaviorSubject<string | null>(this.getUserIdFromToken());
 public currentUserId$ = this.currentUserIdSubject.asObservable(); // Observable público

 constructor(private http: HttpClient) { }

 register(userData: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/register`, userData);
 }

 login(credentials: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
   // ✅ CRÍTICO: Usar 'tap' para salvar o token e notificar o BehaviorSubject
   tap((response: any) => {
    if (response.token) {
     localStorage.setItem('authToken', response.token);
     // Atualiza o BehaviorSubject com o novo ID (o tap roda após o sucesso HTTP)
     const userId = this.getUserIdFromToken(response.token);
     this.currentUserIdSubject.next(userId);
    }
   })
  );
 }

 getProfile(): Observable<any> {
  return this.http.get(`${this.profileApiUrl}/me`);
 }

 

 // Função auxiliar para decodificar (melhor usar 'jwt-decode' ou similar)
 private decodeToken(token: string): any | null {
  if (!token) return null;
  try {
   // Assumindo que você usa um payload JSON decodificável
   return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
   return null;
  }
 }

 // ✅ Função unificada para obter o ID do token (lê do localStorage ou do token fornecido)
 getUserIdFromToken(token?: string): string | null {
  const currentToken = token || localStorage.getItem('authToken');
  if (!currentToken) return null;
  
  const payload = this.decodeToken(currentToken);
  return payload ? payload.userId : null;
 }

 // Manter o getUserId() para compatibilidade, mas agora usa o Subject
 getUserId(): string | null {
  return this.currentUserIdSubject.getValue();
 }
 
 getUserRole(): string | null {
  const payload = this.decodeToken(localStorage.getItem('authToken') || '');
  return payload ? payload.role : null;
 }

 logout(): void {
  localStorage.removeItem('authToken');
  // ✅ CRÍTICO: Notifica o BehaviorSubject sobre o logout
  this.currentUserIdSubject.next(null); 
 }

 changePassword(passwordData: any): Observable<any> {
    return this.http.post(`${this.profileApiUrl}/me/change-password`, passwordData);
  }
  
  changeEmail(emailData: any): Observable<any> {
    return this.http.post(`${this.profileApiUrl}/me/change-email`, emailData);
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    // Atenção ao nome da propriedade: 'newPassword' como no backend
    return this.http.post(`${this.apiUrl}/reset-password/${token}`, { newPassword });
  }
}
