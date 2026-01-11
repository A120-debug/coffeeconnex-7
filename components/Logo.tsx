
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService.ts';

/**
 * DEFAULT_LOGO serves as the fallback if no custom logo is configured in Admin settings.
 */
const DEFAULT_LOGO = 'https://ofvk1ytlehmxo0a3.public.blob.vercel-storage.com/Screenshot%202026-01-10%20at%204.29.43%E2%80%AFPM-GQZlZy4aRfyyNJvnoqsk357NItL5Jy.png'; 

interface LogoProps {
  variant?: 'light' | 'dark';
  className?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ variant = 'dark', className = '', onClick }) => {
  const isLight = variant === 'light';
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO);

  useEffect(() => {
    // Dynamically load the logo from platform settings
    const settings = dbService.getSettings();
    if (settings && settings.logoUrl) {
      setLogoUrl(settings.logoUrl);
    }

    // Add listener for storage changes if multiple tabs are open or settings update
    const handleStorage = () => {
      const updatedSettings = dbService.getSettings();
      if (updatedSettings && updatedSettings.logoUrl) {
        setLogoUrl(updatedSettings.logoUrl);
      }
    };

    window.addEventListener('storage', handleStorage);
    // Custom event for internal updates
    window.addEventListener('cc_settings_updated', handleStorage);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('cc_settings_updated', handleStorage);
    };
  }, []);
  
  return (
    <div 
      className={`flex items-center gap-3 ${onClick ? 'cursor-pointer group' : ''} ${className}`}
      onClick={onClick}
    >
      <div className={`
        relative overflow-hidden rounded-xl transition-all duration-500 flex items-center justify-center
        bg-white shadow-sm border border-white/10
        ${onClick ? 'group-hover:scale-110 group-hover:rotate-3 shadow-xl' : ''}
        w-10 h-10 shrink-0
      `}>
        {/* Custom Logo Image */}
        <img 
          src={logoUrl} 
          alt="CoffeeConnex" 
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            // Fallback if the URL is broken
            (e.target as HTMLImageElement).src = DEFAULT_LOGO;
          }}
        />
        
        {onClick && (
          <div className="absolute inset-0 bg-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        )}
      </div>

      <div className="flex flex-col">
        <span className={`text-xl font-black tracking-tighter leading-none ${isLight ? 'text-white' : 'text-blue-950'}`}>
          Coffee<span className={isLight ? 'text-blue-400' : 'text-blue-600'}>Connex</span>
        </span>
        <span className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 ${isLight ? 'text-white/40' : 'text-slate-400'}`}>
          Official Protocol
        </span>
      </div>
    </div>
  );
};

export default Logo;
