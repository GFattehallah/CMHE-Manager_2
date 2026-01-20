import React, { useState, useEffect } from 'react';
import { LOGO_URL } from '../../constants.ts';

interface AppLogoProps {
  className?: string;
  size?: 'small' | 'default' | 'large' | number; // Garde compatibilité
  showText?: boolean;
}

/**
 * Composant Logo universel du cabinet.
 * Résout le chemin de l'image de manière sécurisée et robuste.
 */
export const AppLogo: React.FC<AppLogoProps> = ({ 
  className = "", 
  size = 'default', 
  showText = false 
}) => {
  
  const [imageError, setImageError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string>(LOGO_URL);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const href = window.location.href.split('#')[0];
        
        if (href && href.startsWith('http')) {
          const base = href.endsWith('/') ? href : href.substring(0, href.lastIndexOf('/') + 1);
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

  // Mapping des tailles responsives (remplace style={{ width: size, height: size }})
  const sizeClasses = {
    small: 'w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14',
    default: 'w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20',
    large: 'w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24'
  };

  // Rétrocompatibilité avec size numérique
  const logoSizeClass = typeof size === 'string' 
    ? sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.default 
    : 'w-12 h-12'; // fallback pour nombres

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      <div 
        className={`flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden shrink-0 transition-transform hover:scale-105 max-w-[20vw] max-h-[20vh] ${logoSizeClass}`}
      >
        {!imageError ? (
          <img 
            src={resolvedUrl} 
            alt="Logo CMHE"
            className="w-full h-full max-w-full h-auto object-contain object-center p-1"
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
        <div className="flex flex-col min-w-0">
          <span className="font-black text-sm sm:text-base md:text-lg text-slate-800 tracking-tighter uppercase leading-tight truncate">
            CMHE Mgr
          </span>
          <span className="text-[7px] sm:text-[8px] font-black text-medical-600 uppercase tracking-widest leading-none">
            Ait Melloul
          </span>
        </div>
      )}
    </div>
  );
};
