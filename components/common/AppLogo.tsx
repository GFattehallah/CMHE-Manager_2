import React, { useState } from 'react';
import { LOGO_URL } from '../../constants';

interface AppLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = "", size = 48, showText = false }) => {
  const [imgSrc, setImgSrc] = useState<string>(LOGO_URL);
  const [hasError, setHasError] = useState(false);

  /**
   * LOGO DE SECOURS HAUTE FIDÉLITÉ
   * Si l'image logo.png ne peut pas être servie, ce SVG prend le relais.
   * Il est conçu pour être un logo final à part entière.
   */
  const CMHE_Logo_Internal = () => (
    <div 
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center bg-white rounded-[30%] shadow-lg border border-slate-100 p-[12%] overflow-hidden shrink-0 group-hover:scale-105 transition-transform"
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        <defs>
          <linearGradient id="medicalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        {/* Croix Médicale Stylisée */}
        <path 
          d="M42 15C42 11.6863 44.6863 9 48 9H52C55.3137 9 58 11.6863 58 15V42H85C88.3137 42 91 44.6863 91 48V52C91 55.3137 88.3137 58 85 58H58V85C58 88.3137 55.3137 91 52 91H48C44.6863 91 42 88.3137 42 85V58H15C11.6863 58 9 55.3137 9 52V48C9 44.6863 11.6863 42 15 42H42V15Z" 
          fill="url(#medicalGradient)"
        />
        {/* Point de focus central */}
        <circle cx="50" cy="50" r="6" fill="white" fillOpacity="0.3" />
      </svg>
    </div>
  );

  const handleError = () => {
    // Si le chemin relatif échoue, on tente l'absolu, sinon on abandonne
    if (imgSrc === "logo.png") {
      setImgSrc("/logo.png");
    } else {
      setHasError(true);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {!hasError ? (
        <div 
          style={{ width: size, height: size }}
          className="flex items-center justify-center bg-white rounded-[30%] shadow-lg border border-slate-100 p-0 overflow-hidden transition-all hover:shadow-xl shrink-0"
        >
          <img 
            src={imgSrc} 
            alt="Logo CMHE" 
            className="w-full h-full object-contain p-[10%]"
            onError={handleError}
          />
        </div>
      ) : (
        <CMHE_Logo_Internal />
      )}
      
      {showText && (
        <div className="flex flex-col">
          <span className="font-black text-lg text-slate-800 tracking-tighter uppercase leading-tight">CMHE Mgr</span>
          <span className="text-[8px] font-black text-medical-600 uppercase tracking-widest leading-none">Ait Melloul</span>
        </div>
      )}
    </div>
  );
};