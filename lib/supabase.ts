import { createClient } from '@supabase/supabase-js';

// Access environment variables directly for Vite static replacement
// We use a fallback to the provided credentials if env vars are missing
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://bowfpiknjsxfqybtpilr.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvd2ZwaWtuanN4ZnF5YnRwaWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzkwMTAsImV4cCI6MjA3OTc1NTAxMH0.mrr2rPLpdeJw5G403piqeRbh6ADb7CeCGV9WLmvezXQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
    return supabaseUrl && supabaseUrl.length > 0 && 
           supabaseAnonKey && supabaseAnonKey.length > 0;
};