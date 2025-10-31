// src/app/services/user.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Skill } from './skill';
import { Job, JobApplication } from './job';

// --- INTERFACES ATUALIZADAS ---
export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  employmentType: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
}

export interface ReviewAuthor {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  clientProfile?: { companyName?: string };
}

export interface PublicClientReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  author: ReviewAuthor;
}

export interface PrivateFreelancerReview {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: Date;
  author: ReviewAuthor;
}

export interface FreelancerProfileModel {
  id: string;
  description?: string;
  skills: Skill[];
  workExperiences: WorkExperience[];
}

export interface ClientProfileModel {
  id: string;
  companyName?: string;
  description?: string;
  city?: string;
  state?: string;
  address?: string;
  averageRating?: number | null;
  receivedReviews?: PublicClientReview[];
}

// A interface UserProfile agora reflete a estrutura aninhada da API
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: Date;
  avatarUrl?: string | null;
  freelancerProfile: FreelancerProfileModel | null;
  clientProfile: ClientProfileModel | null;
  averageFreelancerRating?: number | null;
  freelancerReviewsReceived?: PrivateFreelancerReview[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/users';
  private profileApiUrl = '/api/profile';

  constructor(private http: HttpClient) { }

  getUserProfile(id: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${id}`);
  }

  updateMyProfile(profileData: any): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.profileApiUrl}/me`, profileData);
  }

  addSkill(skillName: string): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.profileApiUrl}/me/skills`, { skillName });
  }

  removeSkill(skillName: string): Observable<UserProfile> {
    return this.http.delete<UserProfile>(`${this.profileApiUrl}/me/skills`, { body: { skillName } });
  }

  addWorkExperience(experienceData: any): Observable<WorkExperience> {
    return this.http.post<WorkExperience>(`${this.profileApiUrl}/me/experience`, experienceData);
  }

  updateWorkExperience(expId: string, experienceData: any): Observable<any> {
    return this.http.patch(`${this.profileApiUrl}/me/experience/${expId}`, experienceData);
  }

  deleteWorkExperience(expId: string): Observable<any> {
    return this.http.delete(`${this.profileApiUrl}/me/experience/${expId}`);
  }

  deleteMyAccount(): Observable<any> {
    return this.http.delete(`${this.profileApiUrl}/me`);
  }

  getMyPostedJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.profileApiUrl}/me/jobs`);
  }

  getMyApplications(): Observable<JobApplication[]> {
    return this.http.get<JobApplication[]>(`${this.profileApiUrl}/me/applications`);
  }

  updateUserAvatar(file: File): Observable<UserProfile> {
    // Para enviar arquivos, precisamos usar FormData
    const formData = new FormData();
    // A chave 'avatar' DEVE ser a mesma que usamos no middleware do backend:
    // uploadAvatar.single('avatar')
    formData.append('avatar', file, file.name);

    // O browser vai definir o 'Content-Type' como 'multipart/form-data' automaticamente
    return this.http.post<UserProfile>(`${this.profileApiUrl}/me/avatar`, formData);
  }

  deleteUserAvatar(): Observable<UserProfile> {
    return this.http.delete<UserProfile>(`${this.profileApiUrl}/me/avatar`);
  }
}