import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  constructor(private http: HttpClient, private supabase: SupabaseService) { }

  updateStatus(applicationId: string, status: string): Observable<any> {
    return new Observable(observer => {
      this.supabase.client.functions.invoke('applications-api', {
        body: { action: 'update_status', payload: { applicationId, newStatus: status } }
      }).then(({ data, error }) => {
        if (error) observer.error(error);
        else observer.next(data);
        observer.complete();
      });
    });
  }

  // --- DELETE SIMPLES (RLS) ---
  deleteApplication(applicationId: string): Observable<any> {
    return new Observable(observer => {
      this.supabase.client
        .from('JobApplication')
        .delete()
        .eq('id', applicationId)
        .then(({ data, error }) => {
          if (error) observer.error(error);
          else observer.next({ message: 'Deleted' });
          observer.complete();
        });
    });
  }

  // --- Fluxo de encerramento ---
  requestClosure(applicationId: string): Observable<any> {
    return new Observable(observer => {
      this.supabase.client.functions.invoke('applications-api', {
        body: { action: 'request_closure', payload: { applicationId } }
      }).then(({ data, error }) => {
        if (error) observer.error(error);
        else observer.next(data);
        observer.complete();
      });
    });
  }

  confirmClosure(applicationId: string): Observable<any> {
    return new Observable(observer => {
      this.supabase.client.functions.invoke('applications-api', {
        body: { action: 'confirm_closure', payload: { applicationId } }
      }).then(({ data, error }) => {
        if (error) observer.error(error);
        else observer.next(data);
        observer.complete();
      });
    });
  }

  // --- Avaliações ---
  reviewClient(applicationId: string, payload: { rating: number; comment: string }): Observable<any> {
    return new Observable(observer => {
      this.supabase.client.functions.invoke('applications-api', {
        body: { action: 'review', payload: { ...payload, applicationId } }
      }).then(({ data, error }) => {
        if (error) observer.error(error);
        else observer.next(data);
        observer.complete();
      });
    });
  }

  reviewFreelancer(applicationId: string, payload: { rating: number; comment?: string }): Observable<any> {
    return new Observable(observer => {
      this.supabase.client.functions.invoke('applications-api', {
        body: { action: 'review', payload: { ...payload, applicationId } }
      }).then(({ data, error }) => {
        if (error) observer.error(error);
        else observer.next(data);
        observer.complete();
      });
    });
  }

  // --- Cancelar candidatura (com lógica extra) ---
  cancelApplication(applicationId: string): Observable<any> {
    return new Observable(observer => {
      this.supabase.client.functions.invoke('applications-api', {
        body: { action: 'cancel', payload: { applicationId } }
      }).then(({ data, error }) => {
        if (error) observer.error(error);
        else observer.next(data);
        observer.complete();
      });
    });
  }
}
