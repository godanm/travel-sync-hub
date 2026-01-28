'use client';
import { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, ExternalLink } from 'lucide-react';

export default function TravelAd({ theme }: { theme: any }) {
  const [adLoaded, setAdLoaded] = useState(false);
  const adClient = "ca-pub-7325718702070526"; // Matches layout.tsx
  const adSlot = "5698172557"; 

  const fallbackAds = useMemo(() => [
    { title: "Universal Power Adapter", desc: "Best for India Travel", link: "#" },
    { title: "Travel Insurance", desc: "Group Coverage for 7 Adults", link: "#" }
  ], []);

  const [randomAd] = useState(() => fallbackAds[Math.floor(Math.random() * fallbackAds.length)]);

  useEffect(() => {
    // 1. Recursive check ensures we don't 'push' until SODAR/SDK is ready 
    const initAd = () => {
      try {
        if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          setAdLoaded(true);
        }
      } catch (e) { console.error("AdSense Error:", e); }
    };

    // 2. 2-second delay gives the JS file you found time to validate the environment 
    const timer = setTimeout(initAd, 2000); 
    return () => clearTimeout(timer);
  }, []);

 // src/components/trip/TravelAd.tsx

return (
  <div className="w-full max-w-[1600px] mx-auto mb-6 px-4">
    <div className={`${theme.card} p-2 px-4 rounded-[20px] border ${theme.border} flex items-center justify-between min-h-[60px] shadow-sm relative overflow-hidden`}>
      
      {/* Left side: Icon and Text */}
      <div className="flex items-center gap-3 overflow-hidden shrink-0">
        <div className={`p-2 rounded-lg ${theme.bg} ${theme.accentText}`}>
          <ShoppingBag size={14} />
        </div>
        <div className="truncate">
          <p className="text-[9px] font-black uppercase tracking-tighter">{randomAd.title}</p>
        </div>
      </div>

      {/* FIXED: Standard dimensions to avoid 400 error */}
      {/* FIXED AD CONTAINER: Prevents the h=280 conflict */}
<div className="flex-1 max-w-[728px] h-[90px] mx-4 overflow-hidden flex items-center justify-center">
  <ins
    className="adsbygoogle"
    style={{ display: 'inline-block', width: '728px', height: '90px' }}
    data-ad-client="ca-pub-7325718702070526"
    data-ad-slot="5698172557"
    /* CRITICAL: Remove 'auto' and 'full-width-responsive' */
    data-ad-format="" 
    data-adtest="on"
    data-full-width-responsive="false"
  ></ins>
</div>

      <button className={`${theme.accent} text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0`}>
        View <ExternalLink size={10} className="inline ml-1" />
      </button>
    </div>
  </div>
);
}