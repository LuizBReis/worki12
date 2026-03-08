// Worki - Shared TypeScript Interfaces
// Centralized types for database entities

// =============================================
// USER & PROFILE
// =============================================

export interface WorkerProfile {
  id: string;
  full_name: string;
  city?: string;
  phone?: string;
  bio?: string;
  pix_key?: string;
  primary_role?: string;
  roles?: string[];
  tags?: string[];
  cover_url?: string;
  avatar_url?: string;
  photo_url?: string;
  verified_identity?: boolean;
  level?: number;
  xp?: number;
  rating_average?: number;
  reviews_count?: number;
  completed_jobs_count?: number;
  completed_jobs?: number;
  earnings_total?: number;
  experience_years?: number;
  availability?: string;
  recommendation_score?: number;
  location?: string;
  joined_at?: string;
  created_at?: string;
  updated_at?: string;
  onboarding_completed?: boolean;
}

export interface CompanyProfile {
  id?: string;
  name: string;
  industry?: string;
  description?: string;
  website?: string;
  email?: string;
  address?: string;
  logo_url?: string;
  cover_url?: string;
  rating_average?: number;
  reviews_count?: number;
  onboarding_completed?: boolean;
  owner_id?: string;
}

// =============================================
// JOB
// =============================================

export interface Job {
  id: string;
  display_code?: string;
  title: string;
  description?: string;
  type?: string;
  status: string;
  location: string;
  start_date: string;
  created_at?: string;
  work_start_time?: string;
  work_end_time?: string;
  estimated_hours?: number;
  has_lunch?: boolean;
  budget: number;
  budget_period?: string;
  candidates_count?: number;
  views?: number;
  company_id?: string;
  company?: {
    name: string;
    logo_url?: string;
    rating_average?: number;
    reviews_count?: number;
  };
}

// =============================================
// APPLICATION
// =============================================

export interface Application {
  id: string;
  job_id: string;
  worker_id: string;
  status: string;
  cover_letter?: string;
  created_at?: string;
  worker_checkin_at?: string | null;
  worker_checkout_at?: string | null;
  company_checkin_confirmed_at?: string | null;
  company_checkout_confirmed_at?: string | null;
  worker?: Partial<WorkerProfile>;
  job?: Partial<Job>;
}

// =============================================
// MESSAGING
// =============================================

export interface Message {
  id: string;
  content: string;
  senderid: string;
  createdat: string;
  conversationid?: string;
  read_at?: string | null;
  is_mine?: boolean;
}

export interface ConversationItem {
  id: string;
  application_uuid: string;
  job_title: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  status: string;
}

export interface WorkerConversationItem extends ConversationItem {
  company_name: string;
  company_logo?: string;
}

export interface CompanyConversationItem extends ConversationItem {
  worker_name: string;
  worker_avatar?: string;
}

// =============================================
// REVIEW
// =============================================

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  reviewer_id: string;
  reviewee_id?: string;
  application_id?: string;
  created_at?: string;
  company?: { name: string };
}

// =============================================
// NOTIFICATION
// =============================================

export interface Notification {
  id: string;
  user_id?: string;
  type: 'status_change' | 'message' | 'payment' | 'system';
  title: string;
  message: string;
  link?: string;
  read_at: string | null;
  created_at: string;
}

// =============================================
// ANALYTICS
// =============================================

export interface AnalyticsEvent {
  id?: string;
  user_id: string;
  event_type: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

// =============================================
// JOB CATEGORY
// =============================================

export interface JobCategory {
  name: string;
  slug: string;
}
