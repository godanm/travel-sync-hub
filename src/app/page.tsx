'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Plus, Map, ArrowRight, Plane, Loader2, Globe } from 'lucide-react';

export default function Dashboard() {
  const [trips, setTrips] = useState<any[]>([]);
  const [newTripName, setNewTripName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  async function fetchTrips() {
    const { data } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
    if (data) setTrips(data);
  }

  const createSlug = (name: string) => name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

  async function handleCreateTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!newTripName || isCreating) return;
    setIsCreating(true);
    
    const slug = createSlug(newTripName);

    // Gracefully handle existing trips (like Rocky Point or Shirdi)
    const { data: existingTrip } = await supabase
      .from('trips')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    if (existingTrip) {
      window.location.href = `/trip/${slug}`;
      return;
    }

    // Insert new trip directly
    const { error } = await supabase.from('trips').insert([{ slug, name: newTripName }]);
    
    if (!error) {
      window.location.href = `/trip/${slug}`;
    } else {
      console.error("Insert Error:", error.message);
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-16 text-slate-900">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-2 text-blue-600 font-black tracking-widest uppercase text-[10px] mb-2 bg-blue-50 w-fit px-3 py-1 rounded-full border border-blue-100">
            <Globe size={12} /> PUBLIC ACCESS ENABLED
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Travel Sync Hub</h1>
          <p className="text-slate-500 font-medium">Open coordination for the Mannazhi & Friends expeditions.</p>
        </header>

        <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-blue-900/5 border border-slate-100 mb-10">
          <form onSubmit={handleCreateTrip} className="flex flex-col sm:flex-row gap-3">
            <input 
              className="flex-grow p-4 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
              placeholder="Trip Name (e.g. India 2026)"
              value={newTripName}
              onChange={(e) => setNewTripName(e.target.value)}
            />
            <button 
               disabled={isCreating}
               className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {isCreating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              CREATE
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trips.map((trip) => (
            <Link key={trip.slug} href={`/trip/${trip.slug}`}>
              <div className="group bg-white p-8 rounded-[40px] shadow-sm border border-slate-50 hover:border-blue-500 hover:shadow-2xl transition-all flex justify-between items-center cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className="bg-blue-50 p-5 rounded-3xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Map size={32} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-2xl capitalize leading-tight">{trip.name}</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Open Hub</p>
                  </div>
                </div>
                <ArrowRight className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" size={24} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}