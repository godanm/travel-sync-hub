'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Map, ArrowRight, Plus, Loader2, Sun, Moon, Waves, TreePine } from 'lucide-react';

// 1. Define themes OUTSIDE the component so they are immediately available
const themes = {
  classic: { 
    bg: 'bg-slate-50', 
    card: 'bg-white', 
    text: 'text-slate-900', 
    subtext: 'text-slate-400', 
    accent: 'bg-blue-600', 
    accentText: 'text-blue-600', 
    border: 'border-slate-100' 
  },
  midnight: { 
    bg: 'bg-slate-950', 
    card: 'bg-slate-900', 
    text: 'text-slate-50', 
    subtext: 'text-slate-500', 
    accent: 'bg-indigo-500', 
    accentText: 'text-indigo-400', 
    border: 'border-slate-800' 
  },
  ocean: { 
    bg: 'bg-cyan-50', 
    card: 'bg-white', 
    text: 'text-cyan-900', 
    subtext: 'text-cyan-400', 
    accent: 'bg-cyan-600', 
    accentText: 'text-cyan-600', 
    border: 'border-cyan-100' 
  },
  forest: { 
    bg: 'bg-emerald-50', 
    card: 'bg-white', 
    text: 'text-emerald-900', 
    subtext: 'text-emerald-400', 
    accent: 'bg-emerald-600', 
    accentText: 'text-emerald-600', 
    border: 'border-emerald-100' 
  }
};

export default function Dashboard() {
  const [trips, setTrips] = useState<any[]>([]);
  const [newTripName, setNewTripName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('classic');
  const [loading, setLoading] = useState(true);

  // 2. Safety Check: Default to 'classic' if currentTheme is invalid
  const t = themes[currentTheme] || themes.classic;

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') as keyof typeof themes;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    fetchTrips();
  }, []);

  async function fetchTrips() {
    const { data } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
    if (data) setTrips(data);
    setLoading(false);
  }

  const toggleTheme = (themeName: keyof typeof themes) => {
    setCurrentTheme(themeName);
    localStorage.setItem('app_theme', themeName);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
  );

  return (
    <main className={`min-h-screen ${t.bg} ${t.text} p-6 md:p-16 transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header with Theme Switcher */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black tracking-tight mb-2">Expeditions</h1>
            <p className={`${t.subtext} font-bold uppercase text-[10px] tracking-[0.2em]`}>
              Mannazhi Family Hub
            </p>
          </div>
          
          <div className={`${t.card} p-2 rounded-2xl flex gap-1 border ${t.border} shadow-sm`}>
            <button onClick={() => toggleTheme('classic')} className={`p-3 rounded-xl transition-all ${currentTheme === 'classic' ? t.accent + ' text-white' : t.subtext}`}><Sun size={20}/></button>
            <button onClick={() => toggleTheme('midnight')} className={`p-3 rounded-xl transition-all ${currentTheme === 'midnight' ? t.accent + ' text-white' : t.subtext}`}><Moon size={20}/></button>
            <button onClick={() => toggleTheme('ocean')} className={`p-3 rounded-xl transition-all ${currentTheme === 'ocean' ? t.accent + ' text-white' : t.subtext}`}><Waves size={20}/></button>
            <button onClick={() => toggleTheme('forest')} className={`p-3 rounded-xl transition-all ${currentTheme === 'forest' ? t.accent + ' text-white' : t.subtext}`}><TreePine size={20}/></button>
          </div>
        </header>

        {/* Create Trip Form */}
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!newTripName || isCreating) return;
          setIsCreating(true);
          const slug = newTripName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
          const { error } = await supabase.from('trips').insert([{ slug, name: newTripName }]);
          if (!error) window.location.href = `/trip/${slug}`;
          setIsCreating(false);
        }} className={`${t.card} p-6 rounded-[32px] shadow-xl border ${t.border} mb-12 flex flex-col sm:flex-row gap-3`}>
          <input 
            className={`flex-grow p-4 ${t.bg} rounded-2xl focus:outline-none font-bold placeholder-slate-400`} 
            placeholder="Trip Name (e.g. Rocky Point 2026)" 
            value={newTripName} 
            onChange={(e) => setNewTripName(e.target.value)} 
          />
          <button disabled={isCreating} className={`${t.accent} text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-current/20 active:scale-95 transition-all`}>
            {isCreating ? <Loader2 className="animate-spin" size={20} /> : 'CREATE'}
          </button>
        </form>

        {/* Trips List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trips.map((trip) => (
            <Link key={trip.slug} href={`/trip/${trip.slug}`}>
              <div className={`${t.card} p-8 rounded-[40px] shadow-sm border ${t.border} hover:border-current transition-all flex justify-between items-center group`}>
                <div className="flex items-center gap-6">
                  <div className={`${t.bg} p-5 rounded-3xl ${t.accentText} group-hover:${t.accent} group-hover:text-white transition-all`}>
                    <Map size={32} />
                  </div>
                  <h3 className="font-black text-2xl capitalize">{trip.name}</h3>
                </div>
                <ArrowRight className={`${t.subtext} group-hover:${t.text} transition-colors`} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}