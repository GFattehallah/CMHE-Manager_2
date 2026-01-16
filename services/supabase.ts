import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Nettoyage robuste pour ne garder que la clé pure sans texte parasite
const cleanValue = (val: any): string => {
  if (typeof val !== 'string') return "";
  // Supprime tout ce qui n'est pas un caractère alphanumérique de clé (lettres, chiffres, points, tirets, underscores)
  // On s'arrête dès qu'on rencontre un caractère invalide comme un espace ou un retour à la ligne
  const match = val.trim().replace(/["']/g, "").match(/^[A-Za-z0-9\._\-]+/);
  return match ? match[0] : "";
};

const isKeyValid = (key: string) =>
  key && 
  key.startsWith('eyJ') && 
  key.length > 100;

const getEnv = (key: string): string => {
  try {
    const valFromWindow = cleanValue((window as any).process?.env?.[key]);
    const valFromMeta = cleanValue((import.meta as any).env?.[key]);
    
    if (key === 'VITE_SUPABASE_ANON_KEY') {
      if (isKeyValid(valFromWindow)) return valFromWindow;
      if (isKeyValid(valFromMeta)) return valFromMeta;
      return valFromWindow || valFromMeta || "";
    }
    
    return valFromWindow || valFromMeta || "";
  } catch (e) {
    return "";
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

let client: SupabaseClient | null = null;

const isUrlValid = (url: string) => 
  url && 
  url.startsWith('https://') && 
  url.includes('supabase.co');

if (isUrlValid(supabaseUrl) && isKeyValid(supabaseAnonKey)) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    
    console.log("✅ INITIALISATION SUPABASE REUSSIE");
  } catch (err) {
    console.error("❌ Erreur client Supabase:", err);
  }
} else {
  console.warn("⚠️ Mode Local : Supabase non configuré ou clés corrompues.");
}

export const supabase = client;

export const isSupabaseConfigured = (): boolean => {
  return !!supabase && isUrlValid(supabaseUrl) && isKeyValid(supabaseAnonKey);
};

export const getConfigurationStatus = () => {
  return {
    url: supabaseUrl,
    hasUrl: isUrlValid(supabaseUrl),
    hasKey: isKeyValid(supabaseAnonKey),
    isWrongProvider: supabaseAnonKey.startsWith('ssb_')
  };
};