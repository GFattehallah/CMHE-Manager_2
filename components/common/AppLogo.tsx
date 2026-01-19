
import React, { useState, useEffect } from 'react';
import { LOGO_URL } from '../../constants.ts';

interface AppLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

/**
 * Composant Logo universel du cabinet.
 * Résout le chemin de l'image de manière sécurisée et robuste.
 */
export const AppLogo: React.FC<AppLogoProps> = ({ className = "", size = 48, showText = false }) => {
  
  const [imageError, setImageError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string>(LOGO_URL);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        // Nettoyage de l'URL de base pour éviter les problèmes avec le routing Hash
        const href = window.location.href.split('#')[0];
        
        if (href && href.startsWith('http')) {
          // On s'assure que le chemin se termine par un slash pour la résolution relative
          const base = href.endsWith('/') ? href : href.substring(0, href.lastIndexOf('/') + 1);
          
          // On résout "logo.png" par rapport à l'URL actuelle du projet
          const cleanLogoPath = LOGO_URL.replace('./', '');
          const url = new URL(cleanLogoPath, base);
          
          setResolvedUrl(url.href);
        }
      }
    } catch (e) {
      console.warn("AppLogo: Erreur de résolution d'URL, repli sur le chemin statique.", e);
      setResolvedUrl(LOGO_URL);
    }
  }, []);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        /* style={{ width: size, height: size }} */
/* Modif 19012026*/
        <div
  style={{ maxWidth: typeof size === 'number' ? `${size}em` : size, maxHeight: typeof size === 'number' ? `${size}em` : size }}
>
  <img
    src={resolvedUrl}
    alt="Logo"
    style={{ width: '100%', height: 'auto' }}
  />
</div>
/*fin modif 19012026 */
        
        className="flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden shrink-0 transition-transform hover:scale-105"
      >
        {!imageError ? (
          <img 
            src={resolvedUrl} 
            alt="Logo" 
            className="w-full h-full object-contain p-1"
            onError={() => {
              console.warn("AppLogo: Échec du chargement à :", resolvedUrl);
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full bg-medical-900 text-white flex items-center justify-center font-black text-[10px] uppercase leading-none text-center p-1">
            CMHE
          </div>
        )}
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className="font-black text-lg text-slate-800 tracking-tighter uppercase leading-tight">CMHE Mgr</span>
          <span className="text-[8px] font-black text-medical-600 uppercase tracking-widest leading-none">Ait Melloul</span>
        </div>
      )}
    </div>
  );
};
