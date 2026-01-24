export const AppLogo: React.FC<AppLogoProps> = ({ className = "", showText = false }) => {
  
  const [imageError, setImageError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string>(LOGO_URL);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const href = window.location.href.split('#')[0];
        const base = href.endsWith('/') ? href : href.substring(0, href.lastIndexOf('/') + 1);
        const cleanLogoPath = LOGO_URL.replace('./', '');
        const url = new URL(cleanLogoPath, base);
        setResolvedUrl(url.href);
      }
    } catch (e) {
      console.warn("AppLogo: Erreur de résolution d'URL, repli sur le chemin statique.", e);
      setResolvedUrl(LOGO_URL);
    }
  }, []);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden shrink-0 w-full h-full">
        {!imageError ? (
          <img
            src={resolvedUrl}
            alt="Logo"
            className="w-full h-full object-contain p-1"
            onError={() => setImageError(true)}
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
