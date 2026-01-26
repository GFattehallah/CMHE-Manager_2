import React from 'react';
import { LOGO_URL } from '../../constants';

interface AppLogoProps {
  size?: number;
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 140,
  className = '',
}) => {
  return (
    <img
      src={LOGO_URL}
      alt="Logo"
      style={{ width: size, height: 'auto' }}
      className={`mx-auto ${className}`}
    />
  );
};
