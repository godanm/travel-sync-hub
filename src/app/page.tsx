'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Map, ArrowRight, Plus, Loader2, Sun, Moon, Waves, TreePine, 
  LogOut, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const themes = {
  classic: { bg: 'bg-slate-50', card: 'bg-white', text: 'text-slate-900', subtext: 'text-slate-400', accent: 'bg-blue-600', accentText: 'text-blue-600', border: 'border-slate-100' },
  midnight: { bg: 'bg-slate-950', card: 'bg-slate-900', text: 'text-slate-50', subtext: 'text-slate-500', accent: 'bg-indigo-500', accentText: 'text-indigo-400', border: 'border-slate-800' },
  ocean: { bg: 'bg-cyan-50', card: 'bg-white', text: 'text-cyan-900', subtext: 'text-cyan-400', accent: 'bg-cyan-600', accentText: 'text-cyan-600', border: 'border-cyan-100' },
  forest: { bg: 'bg-emerald-50', card: 'bg-white', text: 'text-emerald-900', subtext: 'text-emerald-400', accent: 'bg-emerald-600', accentText: 'text-emerald-600', border: 'border-emerald-100' }
};

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // Dynamically identifying the real user
  
  const [trips, setTrips] = useState<any[]>([]);
  const [newTripName, setNewTripName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('classic');
  const [loading, setLoading] = useState(true);

  const t = themes[currentTheme] || themes.classic;

  useEffect(() => {
    // Route Guard: Pushes unauthenticated families to the login screen
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      const savedTheme = localStorage.getItem('app_theme') as keyof typeof themes;
      if (savedTheme && themes[savedTheme]) setCurrentTheme(savedTheme);
      fetchTrips();
    }
  }, [user, authLoading, router]);

  async function fetchTrips() {
    // Fetches only the trips where the user is an authorized member
    const { data: membershipData } = await supabase
      .from('trip_members')
      .select('trip_slug')
      .eq('user_email', user?.email);

    if (membershipData && membershipData.length > 0) {
      const slugs = membershipData.map(m => m.trip_slug);
      const { data: tripData } = await supabase
        .from('trips')
        .select('*')
        .in('slug', slugs)
        .order('created_at', { ascending: false });
      
      if (tripData) setTrips(tripData);
    }
    setLoading(false);
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (authLoading || (loading && user)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${t.bg}`}>
        <Loader2 className={`animate-spin ${t.accentText}`} size={48} />
      </div>
    );
  }

  return (
    <main className={`min-h-screen ${t.bg} ${t.text} p-6 md:p-16 transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto">
        
        {/* COMPACT HEADER: Consistent with Trip Hub */}
        <div className="flex justify-end items-center mb-16 gap-6">
          <div className="text-right">
            <p className="text-[11px] font-black uppercase tracking-tighter leading-none mb-1">
              {user?.email?.split('@')[0]}
            </p>
            <button 
              onClick={handleSignOut}
              className={`${t.subtext} text-[9px] font-bold hover:text-red-500 transition-colors uppercase tracking-widest`}
            >
              Logout
            </button>
          </div>

          <div className={`${t.card} p-1.5 rounded-2xl flex gap-1 border ${t.border} shadow-sm`}>
            {(['classic', 'midnight', 'ocean', 'forest'] as const).map((name) => (
              <button 
                key={name} 
                onClick={() => { setCurrentTheme(name); localStorage.setItem('app_theme', name); }} 
                className={`p-2.5 rounded-xl transition-all ${currentTheme === name ? t.accent + ' text-white' : t.subtext}`}
              >
                {name === 'classic' && <Sun size={18}/>}
                {name === 'midnight' && <Moon size={18}/>}
                {name === 'ocean' && <Waves size={18}/>}
                {name === 'forest' && <TreePine size={18}/>}
              </button>
            ))}
          </div>
        </div>

        <header className="mb-12">
          <h1 className="text-6xl font-black tracking-tighter mb-2">Expeditions</h1>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-green-500" />
            <p className={`${t.subtext} font-bold uppercase text-[10px] tracking-[0.3em]`}>Trip Coordination Hub</p>
          </div>
        </header>

        {/* TRIP CREATION FORM */}
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!newTripName || isCreating) return;
          setIsCreating(true);
          
          const slug = newTripName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
          
          // 1. Create the trip entry
          const { error: tripError } = await supabase.from('trips').insert([{ slug, name: newTripName }]);
          
          // 2. Automatically grant owner access to the creator
          if (!tripError) {
            await supabase.from('trip_members').insert([{ trip_slug: slug, user_email: user?.email, status: 'Owner' }]);
            router.push(`/trip/${slug}`);
          }
          setIsCreating(false);
        }} className={`${t.card} p-6 rounded-[40px] shadow-2xl shadow-current/5 border ${t.border} mb-12 flex flex-col sm:flex-row gap-3`}>
          <input 
            className={`flex-grow p-5 ${t.bg} rounded-[24px] focus:outline-none font-bold text-lg placeholder:opacity-30`} 
            placeholder="Plan a new journey..." 
            value={newTripName} 
            onChange={(e) => setNewTripName(e.target.value)} 
          />
          <button className={`${t.accent} text-white px-12 py-5 rounded-[24px] font-black uppercase tracking-widest shadow-lg shadow-current/20 active:scale-95 transition-all flex items-center justify-center gap-2`}>
            {isCreating ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} /> CREATE</>}
          </button>
        </form>

        {/* TRIP LISTING */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trips.length === 0 ? (
            <div className={`col-span-full py-24 text-center border-2 border-dashed ${t.border} rounded-[40px]`}>
              <Map className={`mx-auto mb-4 opacity-10`} size={48} />
              <p className={`${t.subtext} font-bold uppercase tracking-widest text-[10px]`}>No active expeditions found</p>
            </div>
          ) : (
            trips.map((trip) => (
              <Link key={trip.slug} href={`/trip/${trip.slug}`}>
                <div className={`${t.card} p-8 rounded-[40px] shadow-sm border ${t.border} hover:border-current transition-all flex justify-between items-center group cursor-pointer`}>
                  <div className="flex items-center gap-6">
                    <div className={`${t.bg} p-5 rounded-3xl ${t.accentText} group-hover:${t.accent} group-hover:text-white transition-all`}>
                      <Map size={32} />
                    </div>
                    <div>
                      <h3 className="font-black text-2xl capitalize leading-none mb-2">{trip.name}</h3>
                      <p className={`${t.subtext} text-[10px] font-bold uppercase tracking-widest`}>Shared Trip</p>
                    </div>
                  </div>
                  <ArrowRight className={`${t.subtext} group-hover:translate-x-1 transition-transform`} />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}