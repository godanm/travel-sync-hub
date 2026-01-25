'use client';

// GLOBAL TYPE DEFINITION: Resolves Vercel build-blocking 'adsbygoogle' error
declare global { interface Window { adsbygoogle: any[]; } }

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  MapPin, Target, Sun, Moon, Waves, TreePine, 
  Loader2, Link as LinkIcon, ArrowLeft, Copy, Check 
} from 'lucide-react';
import Link from 'next/link';

import TravelAd from '@/components/trip/TravelAd';
import ActionBriefing from '@/components/trip/ActionBriefing';
import ChecklistModule from '@/components/trip/ChecklistModule';
import ItineraryModule from '@/components/trip/ItineraryModule';
import MemberDirectory from '@/components/MemberDirectory';
import ActivityFeed from '@/components/ActivityFeed';
import { useAuth } from '@/components/AuthProvider';

const themes = {
  classic: { bg: 'bg-slate-50', card: 'bg-white', text: 'text-slate-900', subtext: 'text-slate-400', accent: 'bg-blue-600', accentText: 'text-blue-600', border: 'border-slate-100', banner: 'bg-blue-600', categoryBg: 'bg-blue-100/50' },
  midnight: { bg: 'bg-slate-950', card: 'bg-slate-900', text: 'text-slate-50', subtext: 'text-slate-500', accent: 'bg-indigo-500', accentText: 'text-indigo-400', border: 'border-slate-800', banner: 'bg-indigo-500', categoryBg: 'bg-slate-800' },
  ocean: { bg: 'bg-cyan-50', card: 'bg-white', text: 'text-cyan-900', subtext: 'text-cyan-400', accent: 'bg-cyan-600', accentText: 'text-cyan-600', border: 'border-cyan-100', banner: 'bg-cyan-600', categoryBg: 'bg-cyan-100/50' },
  forest: { bg: 'bg-emerald-50', card: 'bg-white', text: 'text-emerald-900', subtext: 'text-emerald-400', accent: 'bg-emerald-600', accentText: 'text-emerald-600', border: 'border-emerald-100', banner: 'bg-emerald-600', categoryBg: 'bg-emerald-100/50' }
};

export default function TripPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('classic');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checklist' | 'itinerary'>('checklist');
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [tripData, setTripData] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [copied, setCopied] = useState(false);

  const [items, setItems] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [tripMembers, setTripMembers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  const t = themes[currentTheme] || themes.classic;

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    const [itemRes, eventRes, memberRes, allMembers, logs, cats, tripInfo] = await Promise.all([
      supabase.from('checklist_items').select('*').eq('trip_slug', slug).order('created_at', { ascending: false }),
      supabase.from('itinerary_events').select('*').eq('trip_slug', slug).order('event_date', { ascending: true }),
      supabase.from('trip_members').select('*').eq('trip_slug', slug).eq('user_email', user?.email).single(),
      supabase.from('trip_members').select('*').eq('trip_slug', slug).order('status', { ascending: true }),
      supabase.from('activity_log').select('*').eq('trip_slug', slug).order('created_at', { ascending: false }).limit(10),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('trips').select('*').eq('slug', slug).single()
    ]);

    if (memberRes.data) {
      setIsOwner(memberRes.data.status === 'Owner');
      setTripData(tripInfo.data);
      setItems(itemRes.data || []);
      setEvents(eventRes.data || []);
      setTripMembers(allMembers.data || []);
      setActivities(logs.data || []);
      setDbCategories(cats.data || []);
    }
    setLoading(false);
  }, [slug, user]);

  const logAction = useCallback(async (action: string, itemName: string, target?: string) => {
    if (!user?.email) return;
    const actor = user.email.split('@')[0];
    const fullAction = target ? `${action} ${itemName} for ${target}` : `${action} ${itemName}`;
    await supabase.from('activity_log').insert([{ trip_slug: slug, user_name: actor, action_type: fullAction, item_name: '' }]);
    loadInitialData();
  }, [slug, user, loadInitialData]);

  // RESTORED: This handles the actual Supabase database calls
  const handleUpdate = async (type: string, payload: any) => {
    if (type === 'claimItem') {
      const { item, handle } = payload;
      const current = item.claimed_by_name || [];
      const updated = current.includes(handle) ? current.filter((h:string) => h !== handle) : [...current, handle];
      
      const { error } = await supabase.from('checklist_items').update({ claimed_by_name: updated }).eq('id', item.id);
      if (!error) {
        logAction(current.includes(handle) ? 'unclaimed' : 'claimed', item.item_name, handle);
      }
    } else if (type === 'deleteItem') {
      const { error } = await supabase.from('checklist_items').delete().eq('id', payload);
      if (!error) logAction('removed', 'an item');
    } else if (type === 'togglePacked') {
      const newState = !payload.is_packed;
      const { error } = await supabase.from('checklist_items').update({ is_packed: newState }).eq('id', payload.id);
      if (!error) logAction(newState ? 'completed' : 'updated', payload.item_name);
    }
    loadInitialData();
  };

  const copyJoinLink = () => {
    if (!tripData?.share_token) return;
    const link = `${window.location.origin}/join/${tripData.share_token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (!authLoading && user && slug) loadInitialData();
  }, [user, authLoading, slug, router, loadInitialData]);

  if (loading || authLoading) return <div className={`min-h-screen flex items-center justify-center ${t.bg}`}><Loader2 className="animate-spin" size={48} /></div>;

  return (
    <main className={`min-h-screen ${t.bg} ${t.text} transition-colors duration-500`}>
      <div className={`h-1.5 w-full ${t.banner}`} />
      <ActionBriefing isOpen={isBriefingOpen} onClose={() => setIsBriefingOpen(false)} items={items} user={user} theme={t} />

      <div className="max-w-[1440px] mx-auto p-4 md:p-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-900 rounded-2xl flex items-center justify-center shadow-lg"><MapPin size={24} className="text-white fill-white" /></div>
             <h1 className="text-3xl font-black capitalize leading-none tracking-tight">{String(slug).replace(/-/g, ' ')}</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <p className="text-[11px] font-black uppercase mb-1">{user?.email?.split('@')[0]}</p>
              <button onClick={() => supabase.auth.signOut()} className={`${t.subtext} text-[8px] font-bold hover:text-red-500 uppercase tracking-widest`}>Logout</button>
            </div>
            <button onClick={() => setIsBriefingOpen(true)} className={`${t.accent} text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] shadow-xl`}>
              <Target size={14}/> Action Briefing
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-3 order-2 lg:order-1">
             <MemberDirectory members={tripMembers} theme={t} isOwner={isOwner} tripSlug={slug as string} onMemberRemoved={loadInitialData} logAction={logAction} />
             <TravelAd theme={t} />
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2">
            {isOwner && (
              <div className={`${t.card} p-6 rounded-[32px] border ${t.border} mb-8 flex items-center justify-between shadow-sm`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${t.categoryBg} ${t.accentText}`}><LinkIcon size={18} /></div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Share Hub Link</p>
                </div>
                <button onClick={copyJoinLink} className={`${t.accent} text-white px-6 py-2.5 rounded-2xl font-black uppercase text-[10px]`}>{copied ? 'COPIED' : 'COPY LINK'}</button>
              </div>
            )}

            <div className={`flex gap-8 mb-8 border-b ${t.border}`}>
              <button onClick={() => setActiveTab('checklist')} className={`pb-4 px-2 font-black text-[10px] uppercase ${activeTab === 'checklist' ? `border-b-4 ${t.accentText} border-current` : t.subtext}`}>Checklist</button>
              <button onClick={() => setActiveTab('itinerary')} className={`pb-4 px-2 font-black text-[10px] uppercase ${activeTab === 'itinerary' ? `border-b-4 ${t.accentText} border-current` : t.subtext}`}>Itinerary</button>
            </div>

            {activeTab === 'checklist' ? (
              <ChecklistModule 
                items={items} 
                categories={dbCategories} 
                members={tripMembers} 
                theme={t} 
                onUpdate={handleUpdate} // Connected to logic above
                logAction={logAction} 
              />
            ) : (
              <ItineraryModule events={events} theme={t} onUpdate={loadInitialData} slug={slug} />
            )}
          </div>

          <div className="lg:col-span-3 order-3"><ActivityFeed activities={activities} theme={t} /></div>
        </div>
      </div>
    </main>
  );
}