'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Map, ArrowRight, Plus, Loader2, Sun, Moon, Waves, TreePine, ShieldCheck, Crown, Users, MapPin } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const themes = {
  classic: { bg: 'bg-slate-50', card: 'bg-white', text: 'text-slate-900', subtext: 'text-slate-400', accent: 'bg-blue-600', accentText: 'text-blue-600', border: 'border-slate-100', banner: 'bg-blue-600' },
  midnight: { bg: 'bg-slate-950', card: 'bg-slate-900', text: 'text-slate-50', subtext: 'text-slate-500', accent: 'bg-indigo-500', accentText: 'text-indigo-400', border: 'border-slate-800', banner: 'bg-indigo-500' },
  ocean: { bg: 'bg-cyan-50', card: 'bg-white', text: 'text-cyan-900', subtext: 'text-cyan-400', accent: 'bg-cyan-600', accentText: 'text-cyan-600', border: 'border-cyan-100', banner: 'bg-cyan-600' },
  forest: { bg: 'bg-emerald-50', card: 'bg-white', text: 'text-emerald-900', subtext: 'text-emerald-400', accent: 'bg-emerald-600', accentText: 'text-emerald-600', border: 'border-emerald-100', banner: 'bg-emerald-600' }
};

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [ownedTrips, setOwnedTrips] = useState<any[]>([]);
  const [joinedTrips, setJoinedTrips] = useState<any[]>([]);
  const [newTripName, setNewTripName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('classic');
  const [loading, setLoading] = useState(true);

  const t = themes[currentTheme] || themes.classic;

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) {
      const savedTheme = localStorage.getItem('app_theme') as keyof typeof themes;
      if (savedTheme && themes[savedTheme]) setCurrentTheme(savedTheme);
      fetchTrips();
    }
  }, [user, authLoading, router]);

  async function fetchTrips() {
    const { data: membershipData } = await supabase.from('trip_members').select('trip_slug, status').eq('user_email', user?.email);
    if (membershipData && membershipData.length > 0) {
      const slugs = membershipData.map(m => m.trip_slug);
      const { data: tripData } = await supabase.from('trips').select('*').in('slug', slugs).order('created_at', { ascending: false });
      if (tripData) {
        setOwnedTrips(tripData.filter(trip => membershipData.find(m => m.trip_slug === trip.slug)?.status === 'Owner'));
        setJoinedTrips(tripData.filter(trip => membershipData.find(m => m.trip_slug === trip.slug)?.status === 'Joined'));
      }
    }
    setLoading(false);
  }

  if (authLoading || (loading && user)) return <div className={`min-h-screen flex items-center justify-center ${t.bg}`}><Loader2 className={`animate-spin ${t.accentText}`} size={48} /></div>;

  return (
    <main className={`min-h-screen ${t.bg} ${t.text} transition-colors duration-500`}>
      <div className={`h-1.5 w-full ${t.banner}`} />
      
      <div className="max-w-4xl mx-auto p-6 md:p-16">
        <header className="flex justify-between items-start mb-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-900 rounded-2xl flex items-center justify-center shadow-lg">
               <MapPin size={24} className="text-white fill-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter leading-none">GatherGo</h1>
              <p className={`${t.subtext} text-[10px] font-bold uppercase tracking-widest mt-1`}>Expedition Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[11px] font-black uppercase tracking-tighter leading-none mb-1">{user?.email?.split('@')[0]}</p>
              <button onClick={() => supabase.auth.signOut()} className={`${t.subtext} text-[8px] font-bold hover:text-red-500 uppercase tracking-widest`}>Logout</button>
            </div>
            <div className={`${t.card} p-1.5 rounded-2xl flex gap-1 border ${t.border} shadow-sm`}>
              {(['classic', 'midnight', 'ocean', 'forest'] as const).map(name => (
                <button key={name} onClick={() => { setCurrentTheme(name); localStorage.setItem('app_theme', name); }} className={`p-2.5 rounded-xl transition-all ${currentTheme === name ? t.accent + ' text-white shadow-md' : t.subtext}`}>
                  {name === 'classic' && <Sun size={18}/>} {name === 'midnight' && <Moon size={18}/>} {name === 'ocean' && <Waves size={18}/>} {name === 'forest' && <TreePine size={18}/>}
                </button>
              ))}
            </div>
          </div>
        </header>

        <form onSubmit={async (e) => {
          e.preventDefault(); if (!newTripName || isCreating) return;
          setIsCreating(true);
          const slug = newTripName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
          const { error } = await supabase.from('trips').insert([{ slug, name: newTripName }]);
          if (!error) {
            await supabase.from('trip_members').insert([{ trip_slug: slug, user_email: user?.email, status: 'Owner' }]);
            router.push(`/trip/${slug}`);
          }
          setIsCreating(false);
        }} className={`${t.card} p-6 rounded-[40px] border ${t.border} mb-12 flex flex-col sm:flex-row gap-3 shadow-sm`}>
          <input className={`flex-grow p-5 ${t.bg} rounded-[24px] focus:outline-none font-bold text-lg`} placeholder="Plan a new journey..." value={newTripName} onChange={(e) => setNewTripName(e.target.value)} />
          <button className={`${t.accent} text-white px-12 py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest`}>CREATE</button>
        </form>

        <div className="space-y-16">
          {ownedTrips.map((trip) => (
            <Link key={trip.slug} href={`/trip/${trip.slug}`}>
              <div className={`${t.card} p-8 rounded-[40px] border ${t.border} hover:border-current transition-all flex justify-between items-center group`}>
                <div className="flex items-center gap-6">
                  <div className={`${t.bg} p-5 rounded-3xl ${t.accentText} group-hover:${t.accent} group-hover:text-white transition-all`}><Map size={32} /></div>
                  <div><h3 className="font-black text-2xl capitalize mb-1">{trip.name}</h3><p className={`${t.subtext} text-[9px] font-bold uppercase tracking-widest`}>Lead Organizer</p></div>
                </div>
                <ArrowRight className={`${t.subtext} group-hover:translate-x-1 transition-transform`} />
              </div>
            </Link>
          ))}
          {joinedTrips.map((trip) => (
            <Link key={trip.slug} href={`/trip/${trip.slug}`}>
              <div className={`${t.card} p-8 rounded-[40px] border ${t.border} hover:border-current transition-all flex justify-between items-center group opacity-80`}>
                <div className="flex items-center gap-6">
                  <div className={`${t.bg} p-5 rounded-3xl ${t.subtext} group-hover:${t.accent} group-hover:text-white transition-all`}><Map size={32} /></div>
                  <div><h3 className="font-black text-2xl capitalize mb-1">{trip.name}</h3><p className={`${t.subtext} text-[9px] font-bold uppercase tracking-widest`}>Participant</p></div>
                </div>
                <ArrowRight className={`${t.subtext} group-hover:translate-x-1 transition-transform`} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}