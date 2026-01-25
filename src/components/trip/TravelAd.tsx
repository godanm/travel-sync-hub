'use client';
import { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Plus, ShieldCheck, Wine, Luggage, Loader2, ExternalLink } from 'lucide-react';

export default function TravelAd({ theme }: { theme: any }) {
  const [adLoaded, setAdLoaded] = useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';
  const adClient = isDevelopment ? "ca-pub-3940256099942544" : "ca-pub-7325718702070526";
  const adSlot = isDevelopment ? "1033173712" : "5698172557";

  const fallbackAds = useMemo(() => [
    { title: "Universal Power Adapter", desc: "Best for India & International", icon: <Plus size={14}/> },
    { title: "Family Travel Insurance", desc: "Coverage for 5 Families", icon: <ShieldCheck size={14}/> },
    { title: "Sweet Red Collection", desc: "High-alcohol, no added sugar", icon: <Wine size={14}/> },
    { title: "Premium Luggage Set", desc: "Durable for Shirdi Trip", icon: <Luggage size={14}/> }
  ], []);

  const [randomAd] = useState(() => fallbackAds[Math.floor(Math.random() * fallbackAds.length)]);

  useEffect(() => {
    // Delay solves 'availableWidth=0' by letting the layout settle
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setAdLoaded(true);
        }
      } catch (err) { console.error("AdSense SDK Error:", err); }
    }, 1200); 
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`${theme.card} p-6 rounded-[32px] border ${theme.border} shadow-sm mt-8 overflow-hidden relative group`}>
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag size={16} className={theme.accentText} />
        <h3 className="text-[10px] font-black uppercase tracking-widest">Sponsored Deals</h3>
      </div>
      <div className="w-full min-h-[250px] bg-slate-50/50 rounded-2xl relative border border-slate-100 overflow-hidden">
        <div className="absolute inset-0 z-10 pointer-events-none">
          <ins className="adsbygoogle" style={{ display: 'block', width: '100%', height: '100%' }} data-ad-client={adClient} data-ad-slot={adSlot} data-ad-format="auto" data-full-width-responsive="true"></ins>
        </div>
        {!adLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center animate-pulse"><Loader2 className={theme.accentText} size={24}/></div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
             <div className={`w-12 h-12 rounded-full ${theme.bg} flex items-center justify-center mb-4 ${theme.accentText}`}>{randomAd.icon}</div>
             <p className="text-xs font-black uppercase tracking-tighter mb-1">{randomAd.title}</p>
             <p className={`${theme.subtext} text-[10px] font-medium mb-4`}>{randomAd.desc}</p>
             <button className={`${theme.accent} text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg`}>
               Get Deal <ExternalLink size={10} className="inline ml-1" />
             </button>
          </div>
        )}
      </div>
    </div>
  );
}