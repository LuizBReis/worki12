import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private apiUrl = '/api/applications';

  constructor(private http: HttpClient) { }

  updateStatus(applicationId: string, status: string): Observable<any> {
    const url = `${this.apiUrl}/${applicationId}/status`;
    return this.http.patch(url, { status });
  }

  // --- NOVA FUNÇÃO PARA DELETAR UMA CANDIDATURA ---
  deleteApplication(applicationId: string): Observable<any> {
    const url = `${this.apiUrl}/${applicationId}`;
    return this.http.delete(url);
  }

  // --- Fluxo de encerramento ---
  requestClosure(applicationId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${applicationId}/request-closure`, {});
  }

  confirmClosure(applicationId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${applicationId}/confirm-closure`, {});
  }

  // --- Avaliações ---
  reviewClient(applicationId: string, payload: { rating: number; comment: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${applicationId}/review-client`, payload);
  }

  reviewFreelancer(applicationId: string, payload: { rating: number; comment?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${applicationId}/review-freelancer`, payload);
  }
}