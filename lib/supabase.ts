import { createClient } from '@supabase/supabase-js';

// Função auxiliar para ler variáveis de ambiente de forma segura em diferentes ambientes (Dev/Prod)
const getEnvVar = (key: string): string | undefined => {
  try {
    // Tenta acessar via import.meta.env (Padrão Vite)
    // O uso de 'any' evita erros de tipagem se os tipos do Vite não estiverem carregados
    const meta = import.meta as any;
    if (meta && meta.env && meta.env[key]) {
      return meta.env[key];
    }
  } catch (e) {
    // Ignora erros de acesso
  }
  return undefined;
};

// URL e Chave com fallbacks seguros
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://bowfpiknjsxfqybtpilr.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvd2ZwaWtuanN4ZnF5YnRwaWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzkwMTAsImV4cCI6MjA3OTc1NTAxMH0.mrr2rPLpdeJw5G403piqeRbh6ADb7CeCGV9WLmvezXQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
    return supabaseUrl && supabaseUrl.length > 0 && 
           supabaseAnonKey && supabaseAnonKey.length > 0;
};