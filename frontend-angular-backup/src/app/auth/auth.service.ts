// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, from, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Mirror Supabase user state
  private currentUserIdSubject = new BehaviorSubject<string | null>(null);
  public currentUserId$ = this.currentUserIdSubject.asObservable();

  constructor(
    private supabase: SupabaseService
  ) {
    // Sync with Supabase Auth state
    this.supabase.currentUser.subscribe(user => {
      this.currentUserIdSubject.next(user ? user.id : null);
    });
  }

  register(userData: any): Observable<any> {
    const { email, password, firstName, lastName, ...rest } = userData;
    return from(this.supabase.signUp(email, password, { firstName, lastName, ...rest })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  login(credentials: any): Observable<any> {
    return from(this.supabase.signIn(credentials.email, credentials.password)).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return {
          user: data.user,
          token: data.session?.access_token
        };
      })
    );
  }

  getProfile(): Observable<any> {
    // Migrate to Supabase: Fetch from User table and join with Profile tables
    const userId = this.getUserId();
    if (!userId) return of(null);

    return from(
      this.supabase.client
        .from('User')
        .select(`
          *,
          ClientProfile(*),
          FreelancerProfile(*, skills:Skill(*))
        `)
        .eq('id', userId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  getUserId(): string | null {
    return this.currentUserIdSubject.getValue();
  }

  getUserRole(): string | null {
    return null;
  }

  logout(): void {
    this.supabase.signOut();
    this.currentUserIdSubject.next(null);
  }

  changePassword(passwordData: any): Observable<any> {
    // Use Supabase Auth update
    return from(this.supabase.client.auth.updateUser({ password: passwordData.newPassword })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  changeEmail(emailData: any): Observable<any> {
    // Use Supabase Auth update
    return from(this.supabase.client.auth.updateUser({ email: emailData.newEmail })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  requestPasswordReset(email: string): Observable<any> {
    return from(this.supabase.client.auth.resetPasswordForEmail(email));
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return from(this.supabase.client.auth.updateUser({ password: newPassword }));
  }

  async getToken(): Promise<string | null> {
    const { data } = await this.supabase.getSession();
    return data.session?.access_token ?? null;
  }
}
