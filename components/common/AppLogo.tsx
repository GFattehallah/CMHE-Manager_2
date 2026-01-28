import React, { useState, useEffect } from 'react';
import { LOGO_URL } from '../../constants';

interface AppLogoProps {
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = "" }) => {

const [error, setError] = useState(false);
const [url, setUrl] = useState(LOGO_URL);

useEffect(() => {
  try {
    const base = window.location.href.split('#')[0];
    const clean = LOGO_URL.replace('./', '');
    setUrl(new URL(clean, base).href);
  } catch {
    setUrl(LOGO_URL);
  }
}, []);

return (

<div className={`w-full h-full flex items-center justify-center ${className}`}>

{!error ? (

<img
src={url}
className="w-full h-full object-contain"
onError={() => setError(true)}
/>

) : (

<div className="w-full h-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
CMHE
</div>

)}

</div>
);
};
