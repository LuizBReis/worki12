// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { SupabaseService } from './supabase.service';
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
  videoUrl?: string | null;
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

  constructor(private supabase: SupabaseService) { }

  getUserProfile(id: string): Observable<UserProfile> {
    // Complex query to fetch everything
    // Note: Skill!_FreelancerProfileToSkill might vary based on Supabase introspection.
    // If it fails, we might need to adjust or make separate calls, but let's try deep select.
    // Also PostgREST uses resource embedding.
    const query = `
      *,
      freelancerProfile:FreelancerProfile(*, skills:Skill(*), workExperiences:WorkExperience(*)),
      clientProfile:ClientProfile(*)
    `;
    // Note: 'Skill' might be implicitly linked if Supabase detected M-N. If not, we might need explicit junction.
    // For now, assuming simple embedding works if FKs exist. The metadata said _FreelancerProfileToSkill exists.
    // PostgREST might expose it as 'Skill'.

    return from(
      this.supabase.client
        .from('User')
        .select(query)
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as unknown as UserProfile;
      })
    );
  }

  // Obtém perfil público (sem necessidade de token)
  getPublicUserProfile(id: string): Observable<UserProfile> {
    // Same query structure, RLS should handle public access if policy allows SELECT for anon.
    return this.getUserProfile(id);
  }

  updateMyProfile(profileData: any): Observable<UserProfile> {
    return from(
      this.supabase.client.functions.invoke('profiles-api', {
        body: { action: 'update_profile', payload: profileData }
      })
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        // Fetch updated profile to return
        const userId = this.supabase.user?.id;
        if (!userId) throw new Error('No user');
        return this.getUserProfile(userId);
      })
    );
  }

  addSkill(skillName: string): Observable<UserProfile> {
    return from(
      this.supabase.client.functions.invoke('profiles-api', {
        body: { action: 'add_skill', payload: { skillName } }
      })
    ).pipe(
      switchMap(({ error }) => {
        if (error) throw error;
        return this.getUserProfile(this.supabase.user!.id);
      })
    );
  }

  removeSkill(skillName: string): Observable<UserProfile> {
    return from(
      this.supabase.client.functions.invoke('profiles-api', {
        body: { action: 'remove_skill', payload: { skillName } }
      })
    ).pipe(
      switchMap(({ error }) => {
        if (error) throw error;
        return this.getUserProfile(this.supabase.user!.id);
      })
    );
  }

  addWorkExperience(experienceData: any): Observable<WorkExperience> {
    return from(
      this.supabase.client.functions.invoke('profiles-api', {
        body: { action: 'add_experience', payload: experienceData }
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  updateWorkExperience(expId: string, experienceData: any): Observable<any> {
    return from(
      this.supabase.client.functions.invoke('profiles-api', {
        body: { action: 'update_experience', payload: { id: expId, ...experienceData } }
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  deleteWorkExperience(expId: string): Observable<any> {
    return from(
      this.supabase.client.functions.invoke('profiles-api', {
        body: { action: 'delete_experience', payload: { id: expId } }
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  deleteMyAccount(): Observable<any> {
    // This is DANGEROUS and usually requires 'usuário' to confirm.
    // Supabase generic deleteUser requires admin.
    // We can use a function or just 'profiles-api' with delete action?
    // Not implemented in 'profiles-api'.
    // Or just delete from 'User' table if RLS allows users to delete themselves?
    // Supabase Auth deletion is separate.
    // Let's implement this as: Delete 'User' row via RLS?
    // If we delete the 'User' record, the cascade triggers.
    // Check if 'User' table has RLS policy: DELETE using (id = auth.uid())
    return from(
      this.supabase.client.from('User').delete().eq('id', this.supabase.user!.id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        // Also signOut
        this.supabase.signOut();
        return { message: 'Deleted' };
      })
    );
  }

  getMyPostedJobs(): Observable<Job[]> {
    return from(
      this.supabase.client
        .from('Job')
        .select(`
                *,
                author:ClientProfile!inner(*, user:User(*))
             `)
        .eq('author.userId', this.supabase.user!.id)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as unknown as Job[];
      })
    );
  }

  getMyApplications(): Observable<JobApplication[]> {
    return from(
      this.supabase.client
        .from('JobApplication')
        .select(`*, job:Job(*, author:ClientProfile(*, user:User(*)))`)
        .eq('applicantId', this.supabase.user!.id)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as unknown as JobApplication[];
      })
    );
  }

  updateUserAvatar(file: File): Observable<UserProfile> {
    const fileName = `avatar-${this.supabase.user!.id}-${Date.now()}`;
    return from(
      this.supabase.client.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        const { data: { publicUrl } } = this.supabase.client.storage.from('avatars').getPublicUrl(data.path);

        // Update Profile
        return this.updateMyProfile({ avatarUrl: publicUrl });
      })
    );
  }

  deleteUserAvatar(): Observable<UserProfile> {
    // Just update to null
    return this.updateMyProfile({ avatarUrl: null });
  }

  updateUserVideo(file: File): Observable<UserProfile> {
    const fileName = `video-${this.supabase.user!.id}-${Date.now()}`;
    return from(
      this.supabase.client.storage
        .from('videos')
        .upload(fileName, file, { upsert: true })
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        const { data: { publicUrl } } = this.supabase.client.storage.from('videos').getPublicUrl(data.path);

        return this.updateMyProfile({ videoUrl: publicUrl });
      })
    );
  }

  deleteUserVideo(): Observable<UserProfile> {
    return this.updateMyProfile({ videoUrl: null });
  }
}
