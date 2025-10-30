// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  private profileApiUrl = '/api/profile';

  constructor(private http: HttpClient) { }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.profileApiUrl}/me`);
  }

  getUserRole(): string | null {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role;
    } catch (e) {
      return null;
    }
  }

  getUserId(): string | null {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (e) {
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
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