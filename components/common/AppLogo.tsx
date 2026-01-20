import React, { useState, useEffect } from 'react';
import { LOGO_URL } from '../../constants.ts';

interface AppLogoProps {
  className?: string;
  size?: 'small' | 'default' | 'large';
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

  // Mapping des tailles responsives
  const sizeClasses = {
    small: 'w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14',
    default: 'w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20',
    large: 'w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24'
  };

  const logoSizeClass = sizeClasses[size] || sizeClasses.default;

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      <div 
        className={`flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden shrink-0 transition-transform hover:scale-105 max-w-[20vw] max-h-[20vh] ${logoSizeClass}`}
      >
        {!imageError ? (
          <img 
            src={resolvedUrl} 
            alt="Logo CMHE" 
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
