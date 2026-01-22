import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vrklakcbkcsonarmhqhp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZya2xha2Nia2Nzb25hcm1ocWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNTMzNzAsImV4cCI6MjA4MzkyOTM3MH0.GBoi9dzcYw0dK3EEFCKHV2T9Pc3bSWO8H_FSooeSoM0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
