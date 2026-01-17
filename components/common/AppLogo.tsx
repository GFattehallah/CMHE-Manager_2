import React, { useState } from 'react';
import { LOGO_URL } from '../../constants';

interface AppLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = "", size = 48, showText = false }) => {
  const [hasError, setHasError] = useState(false);

  /**
   * LOGO DE SECOURS (SVG INTERNE)
   * Affiché uniquement si le chargement de logo.png échoue.
   */
  const CMHE_Logo_Internal = () => (
    <div 
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center bg-white rounded-[30%] shadow-lg border border-slate-100 p-[12%] overflow-hidden shrink-0"
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        <defs>
          <linearGradient id="medicalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        <path 
          d="M50 10V90M10 50H90" 
          stroke="url(#medicalGradient)" 
          strokeWidth="15" 
          strokeLinecap="round"
        />
        <circle cx="50" cy="50" r="6" fill="white" fillOpacity="0.3" />
      </svg>
    </div>
  );

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {!hasError && LOGO_URL ? (
        <div 
          style={{ width: size, height: size }}
          className="flex items-center justify-center bg-white rounded-[30%] shadow-lg border border-slate-100 p-0 overflow-hidden transition-all hover:shadow-xl shrink-0"
        >
          <img 
            src={LOGO_URL} 
            alt="Logo CMHE" 
            className="w-full h-full object-contain p-[10%]"
            onError={() => setHasError(true)}
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