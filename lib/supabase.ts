import { createClient } from '@supabase/supabase-js';

// Access environment variables securely for Vite production
// The 'import.meta.env' object is statically replaced during build
const getEnv = (key: string) => {
  // @ts-ignore
  return import.meta.env[key];
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://bowfpiknjsxfqybtpilr.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvd2ZwaWtuanN4ZnF5YnRwaWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzkwMTAsImV4cCI6MjA3OTc1NTAxMH0.mrr2rPLpdeJw5G403piqeRbh6ADb7CeCGV9WLmvezXQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
    return supabaseUrl && supabaseUrl.length > 0 && supabaseUrl !== 'https://bowfpiknjsxfqybtpilr.supabase.co' && 
           supabaseAnonKey && supabaseAnonKey.length > 0;
};