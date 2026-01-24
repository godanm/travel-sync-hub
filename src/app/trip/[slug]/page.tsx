'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  CheckCircle2, Circle, ArrowLeft, Plus, Calendar, 
  ListChecks, UserPlus, Tag, Trash2, X, Loader2, Users, Check, MapPin, Clock,
  Sun, Moon, Waves, TreePine, History
} from 'lucide-react';
import Link from 'next/link';
import TripInvite from '@/components/TripInvite';
import MemberDirectory from '@/components/MemberDirectory';
import ActivityFeed from '@/components/ActivityFeed';

const themes = {
  classic: { bg: 'bg-slate-50', card: 'bg-white', text: 'text-slate-900', subtext: 'text-slate-400', accent: 'bg-blue-600', accentText: 'text-blue-600', border: 'border-slate-100', categoryBg: 'bg-blue-100/50' },
  midnight: { bg: 'bg-slate-950', card: 'bg-slate-900', text: 'text-slate-50', subtext: 'text-slate-500', accent: 'bg-indigo-500', accentText: 'text-indigo-400', border: 'border-slate-800', categoryBg: 'bg-slate-800' },
  ocean: { bg: 'bg-cyan-50', card: 'bg-white', text: 'text-cyan-900', subtext: 'text-cyan-400', accent: 'bg-cyan-600', accentText: 'text-cyan-600', border: 'border-cyan-100', categoryBg: 'bg-cyan-100/50' },
  forest: { bg: 'bg-emerald-50', card: 'bg-white', text: 'text-emerald-900', subtext: 'text-emerald-400', accent: 'bg-emerald-600', accentText: 'text-emerald-600', border: 'border-emerald-100', categoryBg: 'bg-emerald-100/50' }
};

export default function TripPage() {
  const { slug } = useParams();
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('classic');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checklist' | 'itinerary'>('checklist');
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const t = themes[currentTheme] || themes.classic;

  // Data State
  const [items, setItems] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [tripMembers, setTripMembers] = useState<any[]>([]);
  const [activeInvites, setActiveInvites] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') as keyof typeof themes;
    if (savedTheme && themes[savedTheme]) setCurrentTheme(savedTheme);
    if (slug) loadInitialData();
  }, [slug]);

  async function loadInitialData() {
    setLoading(true);
    const userEmail = "friend@example.com"; // Placeholder

    const [itemRes, eventRes, membershipRes, membersList, invitesList, activityRes, catRes] = await Promise.all([
      supabase.from('checklist_items').select('*').eq('trip_slug', slug).order('created_at', { ascending: false }),
      supabase.from('itinerary_events').select('*').eq('trip_slug', slug).order('event_date', { ascending: true }),
      supabase.from('trip_members').select('*').eq('trip_slug', slug).eq('user_email', userEmail).single(),
      supabase.from('trip_members').select('*').eq('trip_slug', slug),
      supabase.from('invitations').select('*').eq('trip_slug', slug).eq('is_used', false),
      supabase.from('activity_log').select('*').eq('trip_slug', slug).order('created_at', { ascending: false }).limit(10),
      supabase.from('categories').select('*').order('sort_order', { ascending: true })
    ]);

    if (membershipRes.error || !membershipRes.data) {
      setIsMember(false);
      setLoading(false);
      return; 
    }

    setIsMember(true);
    if (itemRes.data) setItems(itemRes.data);
    if (eventRes.data) setEvents(eventRes.data);
    if (membersList.data) setTripMembers(membersList.data);
    if (invitesList.data) setActiveInvites(invitesList.data);
    if (activityRes.data) setActivities(activityRes.data);
    if (catRes.data) setDbCategories(catRes.data);
    setLoading(false);
  }

  // Helper to log activities
  const logActivity = async (action: string, itemName: string) => {
    await supabase.from('activity_log').insert([
      { trip_slug: slug, user_name: "Group Member", action_type: action, item_name: itemName }
    ]);
    loadInitialData();
  };

  // UPDATED: Actions now include logging
  const handleTogglePacked = async (item: any) => {
    await supabase.from('checklist_items').update({ is_packed: !item.is_packed }).eq('id', item.id);
    logActivity(!item.is_packed ? 'completed' : 'updated', item.item_name);
  };

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${t.bg}`}><Loader2 className={`animate-spin ${t.accentText}`} size={48} /></div>;

  return (
    <main className={`min-h-screen ${t.bg} ${t.text} p-4 md:p-12 transition-colors duration-500`}>
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <Link href="/" className={`${t.subtext} flex items-center gap-2 font-black mb-4 hover:${t.accentText} uppercase text-[10px] tracking-widest`}>
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <h1 className="text-4xl font-black capitalize tracking-tight">{String(slug).replace(/-/g, ' ')}</h1>
          </div>
          {/* Theme Switcher... */}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT: Sidebar (Directory) */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <MemberDirectory members={tripMembers} invitations={activeInvites} theme={t} />
          </div>

          {/* CENTER: Checklist/Itinerary Hub */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className={`flex gap-8 mb-8 border-b ${t.border}`}>
              <button onClick={() => setActiveTab('checklist')} className={`pb-4 px-2 font-black text-[10px] uppercase tracking-widest ${activeTab === 'checklist' ? `border-b-4 ${t.accentText} border-current` : t.subtext}`}>Checklist</button>
              <button onClick={() => setActiveTab('itinerary')} className={`pb-4 px-2 font-black text-[10px] uppercase tracking-widest ${activeTab === 'itinerary' ? `border-b-4 ${t.accentText} border-current` : t.subtext}`}>Itinerary</button>
            </div>

            {activeTab === 'checklist' ? (
              <section className="animate-in fade-in">
                <TripInvite slug={slug as string} theme={t} />
                {/* Checklist input and items... */}
              </section>
            ) : (
              <section className="animate-in fade-in">
                {/* Itinerary content... */}
              </section>
            )}
          </div>

          {/* RIGHT: Sidebar (Activity Feed) */}
          <div className="lg:col-span-3 order-3">
            <ActivityFeed activities={activities} theme={t} />
          </div>

        </div>
      </div>
    </main>
  );
}