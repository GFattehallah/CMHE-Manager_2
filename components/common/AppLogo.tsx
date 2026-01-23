import React, { useState, useEffect } from 'react';
import { LOGO_URL } from '../../constants.ts';

interface AppLogoProps {
  className?: string;
  size?: 'small' | 'default' | 'large' | number | string;
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ 
  className = "", 
  size = 'default', 
  showText = false 
}) => {
  const [resolvedUrl, setResolvedUrl] = useState('');
  const [imageError, setImageError] = useState(false);

  // Mapping responsive des tailles
  const sizeClasses = {
    small: 'w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14',
    default: 'w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20',
    large: 'w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24'
  };
  
  const logoSizeClass = typeof size === 'string' 
    ? sizeClasses[size as keyof typeof sizeClasses] ?? sizeClasses.default 
    : `${size}px md:${Math.min(size * 1.33, 80)}px lg:${Math.min(size * 1.66, 96)}px`; // Rétrocompatible

  useEffect(() => {
    const loadImage = async () => {
      try {
        const url = new URL(LOGO_URL, import.meta.url).href;
        setResolvedUrl(url);
      } catch (error) {
        console.warn('AppLogo: Erreur résolution URL', error);
        setImageError(true);
      }
    };
    loadImage();
  }, []);

  return (
    <div className={`max-w-[20vw] max-h-[20vh] flex flex-col items-center gap-2 sm:gap-3 ${className}`}>
      <div className={`${logoSizeClass} flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-transform hover:scale-105`}>
        {!imageError ? (
          <img 
            src={resolvedUrl} 
            alt="CMHE Logo"
            className="w-full h-full max-w-full h-auto object-contain object-center p-1"
            onError={() => {
              console.warn("AppLogo: Échec du chargement à :", resolvedUrl);
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full bg-medical-900 text-white flex items-center justify-center font-black text-[10px] sm:text-xs uppercase leading-none text-center p-1">
            CMHE
          </div>
        )}
      </div>
      {showText && (
        <div className="w-full text-center truncate">
          <span className="text-sm sm:text-base md:text-lg font-black text-slate-800 tracking-tighter uppercase leading-tight">
            CMHE Mgr
          </span>
          <span className="text-[8px] sm:text-sm font-black text-medical-600 uppercase tracking-widest leading-none block sm:inline">
            Ait Melloul
          </span>
        </div>
      )}
    </div>
  );
};
