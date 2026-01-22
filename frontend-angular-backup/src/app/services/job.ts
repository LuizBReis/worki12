// src/app/services/job.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Skill } from './skill';
import { SupabaseService } from './supabase.service';

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

  constructor(private http: HttpClient, private supabase: SupabaseService) { }

  // ✅ FUNÇÃO getJobs MIGRADA PARA SUPABASE CLIENT
  getJobs(filters: any): Observable<Job[]> {
    return new Observable(observer => {
      let query = this.supabase.client
        .from('Job')
        .select(`
          id, title, description, budget, createdAt,
          author:ClientProfile (
            id, companyName, city, state, address,
            user ( id, firstName, lastName )
          ),
          skills:Skill ( id, name )
        `)
        .order('createdAt', { ascending: false });

      // Filtros
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      if (filters.minBudget) {
        query = query.gte('budget', filters.minBudget);
      }
      if (filters.maxBudget) {
        query = query.lte('budget', filters.maxBudget);
      }

      // Filtros de Localização (Author)
      if (filters.city) {
        query = query.filter('author.city', 'ilike', `%${filters.city}%`);
      }

      query.then(({ data, error }) => {
        if (error) {
          console.error('Error fetching jobs:', error);
          observer.error(error);
        } else {
          // Mapeamento para ajustar estrutura se necessário (ex: requiredSkills)
          const jobs = (data as any[]).map(job => ({
            ...job,
            requiredSkills: job.skills // Renomeia para interface do frontend
          }));
          observer.next(jobs);
          observer.complete();
        }
      });
    });
  }

  getJobById(id: string): Observable<Job> {
    // Retornamos Observable para manter compatibilidade com componentes existentes que usam .subscribe()
    return new Observable(observer => {
      this.supabase.client
        .from('Job')
        .select(`
          id, title, description, budget,
          author:ClientProfile (
            id, companyName,
            user ( id, firstName, lastName )
          ),
          skills:Skill ( id, name )
        `)
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) observer.error(error);
          else {
            const job = { ...data, requiredSkills: data.skills };
            observer.next(job as any);
            observer.complete();
          }
        });
    });
  }

  createJob(jobData: any): Observable<Job> {
    // Chama Edge Function 'jobs-api'
    return new Observable(observer => {
      this.supabase.client.functions.invoke('jobs-api', {
        body: { action: 'create', payload: jobData }
      }).then(({ data, error }) => {
        if (error) observer.error(error);
        else observer.next(data);
        observer.complete();
      });
    });
  }

  applyToJob(jobId: string): Observable<any> {
    // Chama Edge Function 'jobs-api'
    return new Observable(observer => {
      this.supabase.client.functions.invoke('jobs-api', {
        body: { action: 'apply', payload: { jobId } }
      }).then(({ data, error }) => {
        if (error) observer.error(error);
        else observer.next(data);
        observer.complete();
      });
    });
  }

  // updateJob e deleteJob ainda precisam ser migrados logicamente (Edge Function ou RLS)
  // Por enquanto, vou deixar mockado ou erro, pois focamos no Create/Apply primeiro.
  // Se o componente chamar e falhar, saberemos.
  updateJob(jobId: string, jobData: any): Observable<any> {
    // TODO: Implementar update via Edge Function
    return new Observable();
  }

  deleteJob(jobId: string): Observable<any> {
    // TODO: Implementar delete via Edge Function
    return new Observable();
  }

  getJobApplicants(jobId: string, filters: any): Observable<JobApplication[]> {
    // TODO: Implementar via RLS direto ou Function
    return new Observable();
  }
}