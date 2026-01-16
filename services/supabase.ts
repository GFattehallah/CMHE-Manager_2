import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fonction simple pour récupérer les clés sans nettoyage risqué
const getRawEnv = (key: string): string => {
  try {
    const valFromMeta = (import.meta as any).env?.[key];
    const valFromWindow = (window as any).process?.env?.[key];
    const raw = valFromMeta || valFromWindow || "";
    return typeof raw === 'string' ? raw.trim().replace(/["']/g, "") : "";
  } catch (e) {
    return "";
  }
};

const supabaseUrl = getRawEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getRawEnv('VITE_SUPABASE_ANON_KEY');

const isKeyValid = (key: string) => 
  key && key.startsWith('eyJ') && key.length > 100;

const isUrlValid = (url: string) => 
  url && url.startsWith('https://') && url.includes('supabase.co');

let client: SupabaseClient | null = null;

if (isUrlValid(supabaseUrl) && isKeyValid(supabaseAnonKey)) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    console.log("✅ Supabase configuré avec succès");
  } catch (err) {
    console.error("❌ Erreur Supabase:", err);
  }
}

export const supabase = client;

export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};

export const getConfigurationStatus = () => {
  return {
    url: supabaseUrl,
    hasUrl: isUrlValid(supabaseUrl),
    hasKey: isKeyValid(supabaseAnonKey),
    isWrongProvider: supabaseAnonKey.startsWith('ssb_')
  };
};