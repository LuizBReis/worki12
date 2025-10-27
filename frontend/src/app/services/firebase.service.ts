import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  app: any;
  analytics: Analytics | undefined;

  constructor() {
    this.app = initializeApp(environment.firebase);
    try {
      this.analytics = getAnalytics(this.app);
    } catch (error) {
      console.warn('Analytics não pôde ser inicializado:', error);
    }
    console.log('Firebase inicializado:', this.app);
  }
}
