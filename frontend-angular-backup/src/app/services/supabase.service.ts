import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;
    private _currentUser = new BehaviorSubject<User | null>(null);

    constructor() {
        this.supabase = createClient(environment.supabase.url, environment.supabase.key);

        // Initialize user session
        this.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                this._currentUser.next(session.user);
            }
        });

        // Listen for auth changes
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                this._currentUser.next(session?.user ?? null);
            } else if (event === 'SIGNED_OUT') {
                this._currentUser.next(null);
            }
        });
    }

    get currentUser(): Observable<User | null> {
        return this._currentUser.asObservable();
    }

    get user(): User | null {
        return this._currentUser.getValue();
    }

    get client() {
        return this.supabase;
    }

    // --- Auth Wrappers ---

    async signUp(email: string, password: string, data: any = {}) {
        return this.supabase.auth.signUp({
            email,
            password,
            options: {
                data // saves additional user metadata (firstName, lastName, role)
            }
        });
    }

    async signIn(email: string, password: string) {
        return this.supabase.auth.signInWithPassword({
            email,
            password
        });
    }

    async signOut() {
        return this.supabase.auth.signOut();
    }

    async getSession() {
        return this.supabase.auth.getSession();
    }
}
