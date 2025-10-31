// src/app/services/job.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Skill } from './skill';

// --- INTERFACES CENTRALIZADAS ---
export interface AuthorUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface JobAuthor {
  id: string; // ID do ClientProfile
  companyName?: string;
  user: AuthorUser;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  budget?: number;
  author: JobAuthor;
  hasApplied?: boolean;
  requiredSkills?: Skill[]; // ✅ RENAMED FROM 'skills' to 'requiredSkills'
}

export interface JobApplication {
  id: string;
  status: string;
  jobStatus?: 'ACTIVE' | 'PENDING_CLOSE' | 'COMPLETED' | 'REVIEWED';
  createdAt: Date;
  applicant: AuthorUser;
  job: Job;
  // Presença de reviews (opcional, depende do backend)
  freelancerReview?: any | null;
  clientReview?: any | null;
}

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = '/api/jobs';

  constructor(private http: HttpClient) { }

  // ✅ FUNÇÃO getJobs ATUALIZADA
  getJobs(filters: any): Observable<Job[]> {
    let params = new HttpParams();
    
    // Filtros existentes
    if (filters.search) params = params.append('search', filters.search);
    if (filters.minBudget) params = params.append('minBudget', filters.minBudget);
    if (filters.maxBudget) params = params.append('maxBudget', filters.maxBudget);
    if (filters.skills && Array.isArray(filters.skills) && filters.skills.length > 0) {
      params = params.append('skills', filters.skills.join(','));
    }
    if (filters.match) params = params.append('match', filters.match);
    
    // --- ✅ NOVOS FILTROS DE LOCALIZAÇÃO ---
    if (filters.city) {
      params = params.append('city', filters.city);
    }
    if (filters.state) {
      params = params.append('state', filters.state);
    }
    if (filters.address) {
      params = params.append('address', filters.address);
    }

    return this.http.get<Job[]>(this.apiUrl, { params });
  }

  getJobById(id: string): Observable<Job> {
    return this.http.get<Job>(`${this.apiUrl}/${id}`);
  }
  
  createJob(jobData: any): Observable<Job> {
    return this.http.post<Job>(this.apiUrl, jobData);
  }

  applyToJob(jobId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${jobId}/apply`, {});
  }

  updateJob(jobId: string, jobData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${jobId}`, jobData);
  }

  deleteJob(jobId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${jobId}`);
  }

  getJobApplicants(jobId: string, filters: any): Observable<JobApplication[]> {
    let params = new HttpParams();
    if (filters.skill) params = params.append('skill', filters.skill);
    return this.http.get<JobApplication[]>(`${this.apiUrl}/${jobId}/applications`, { params });
  }
}