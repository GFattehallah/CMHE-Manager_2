import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Nettoyage robuste des valeurs
const cleanValue = (val: any): string => {
  if (typeof val !== 'string') return "";
  // On enlève les guillemets, on trim, et SURTOUT on ne garde que le premier mot (avant l'espace)
  return val.trim().replace(/["']/g, "").split(/\s+/)[0];
};

const isKeyValid = (key: string) =>
  key && 
  key.startsWith('eyJ') && 
  key.length > 50;

// Récupération intelligente : on cherche la première source qui contient une clé VALIDE (eyJ)
const getEnv = (key: string): string => {
  try {
    const valFromWindow = cleanValue((window as any).process?.env?.[key]);
    const valFromMeta = cleanValue((import.meta as any).env?.[key]);
    
    // Si on cherche la clé API, on privilégie celle qui commence par eyJ
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
    
    client.from('patients').select('id', { head: true, count: 'estimated' }).limit(1).then(({ error }) => {
      if (!error) {
        console.log("✅ CONNECTÉ À SUPABASE (GCMHE.MA)");
      } else {
        console.warn("⚠️ Connexion établie mais erreur de droits (RLS) :", error.message);
      }
    });
  } catch (err) {
    console.error("❌ Erreur client Supabase:", err);
  }
} else {
  if (supabaseAnonKey.startsWith('ssb_')) {
    console.error("❌ ERREUR : La clé '" + supabaseAnonKey.substring(0, 15) + "...' appartient à CLERK, pas à SUPABASE.");
  } else if (supabaseUrl && supabaseAnonKey) {
    console.warn("⚠️ Mode Local : La clé fournie n'est pas un jeton JWT valide (Format incorrect ou texte parasite).");
  } else {
    console.log("ℹ️ Mode Stockage Local (Navigateur) activé.");
  }
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