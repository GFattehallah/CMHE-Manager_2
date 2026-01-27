import React, { useState, useEffect } from 'react';
import { LOGO_URL } from '../../constants';

interface AppLogoProps {
  className?: string;
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = "",
  showText = false
}) => {

const [imageError, setImageError] = useState(false);
const [resolvedUrl, setResolvedUrl] = useState<string>(LOGO_URL);

useEffect(() => {
  try {
    const href = window.location.href.split('#')[0];
    const base = href.endsWith('/') ? href : href.substring(0, href.lastIndexOf('/') + 1);
    const cleanLogoPath = LOGO_URL.replace('./', '');
    const url = new URL(cleanLogoPath, base);
    setResolvedUrl(url.href);
  } catch {
    setResolvedUrl(LOGO_URL);
  }
}, []);

return (
<div className={`w-full h-full flex items-center justify-center ${className}`}>

{!imageError ? (

<img
src={resolvedUrl}
alt="Logo"
className="max-w-full max-h-full object-contain"
/>

) : (

<div className="w-full h-full bg-medical-900 text-white flex items-center justify-center font-black text-xs">
CMHE
</div>

)}

</div>
);
};
