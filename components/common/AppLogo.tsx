import React from 'react';
import { LOGO_URL } from '../../constants';

interface AppLogoProps {
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = "" }) => {
  return (
    <img
      src={LOGO_URL}
      alt="Logo"
      className={`w-full h-full object-contain object-top ${className}`}
    />
  );
};
