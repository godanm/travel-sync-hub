'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  CheckCircle2, Circle, ArrowLeft, Plus, Calendar, 
  ListChecks, UserPlus, Tag, Trash2, X, Loader2, Users, Check, MapPin, Clock,
  Sun, Moon, Waves, TreePine, History, GripVertical, LogOut, Crown, Link as LinkIcon, Copy, Check as CheckIcon
} from 'lucide-react';
import Link from 'next/link';

// Integrated Components
import MemberDirectory from '@/components/MemberDirectory';
import ActivityFeed from '@/components/ActivityFeed';
import { useAuth } from '@/components/AuthProvider';

const themes = {
  classic: { bg: 'bg-slate-50', card: 'bg-white', text: 'text-slate-900', subtext: 'text-slate-400', accent: 'bg-blue-600', accentText: 'text-blue-600', border: 'border-slate-100', categoryBg: 'bg-blue-100/50' },
  midnight: { bg: 'bg-slate-950', card: 'bg-slate-900', text: 'text-slate-50', subtext: 'text-slate-500', accent: 'bg-indigo-500', accentText: 'text-indigo-400', border: 'border-slate-800', categoryBg: 'bg-slate-800' },
  ocean: { bg: 'bg-cyan-50', card: 'bg-white', text: 'text-cyan-900', subtext: 'text-cyan-400', accent: 'bg-cyan-600', accentText: 'text-cyan-600', border: 'border-cyan-100', categoryBg: 'bg-cyan-100/50' },
  forest: { bg: 'bg-emerald-50', card: 'bg-white', text: 'text-emerald-900', subtext: 'text-emerald-400', accent: 'bg-emerald-600', accentText: 'text-emerald-600', border: 'border-emerald-100', categoryBg: 'bg-emerald-100/50' }
};

export default function TripPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('classic');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checklist' | 'itinerary'>('checklist');
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [tripData, setTripData] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [copied, setCopied] = useState(false);
  const t = themes[currentTheme] || themes.classic;

  const [items, setItems] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [tripMembers, setTripMembers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') as keyof typeof themes;
    if (savedTheme && themes[savedTheme]) setCurrentTheme(savedTheme);
    
    if (!authLoading) {
      if (user && slug) {
        loadInitialData();
      } else if (!user) {
        setLoading(false);
      }
    }
  }, [user, authLoading, slug]);

  async function loadInitialData() {
    setLoading(true);
    const userEmail = user?.email;

    const [itemRes, eventRes, memberRes, allMembers, logs, cats, tripInfo] = await Promise.all([
      supabase.from('checklist_items').select('*').eq('trip_slug', slug).order('created_at', { ascending: false }),
      supabase.from('itinerary_events').select('*').eq('trip_slug', slug).order('event_date', { ascending: true }),
      supabase.from('trip_members').select('*').eq('trip_slug', slug).eq('user_email', userEmail).single(),
      supabase.from('trip_members').select('*').eq('trip_slug', slug).order('status', { ascending: true }),
      supabase.from('activity_log').select('*').eq('trip_slug', slug).order('created_at', { ascending: false }).limit(10),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('trips').select('*').eq('slug', slug).single()
    ]);

    if (memberRes.error || !memberRes.data) {
      setIsMember(false);
    } else {
      setIsMember(true);
      setIsOwner(memberRes.data.status === 'Owner');
      setTripData(tripInfo.data);
      setItems(itemRes.data || []);
      setEvents(eventRes.data || []);
      setTripMembers(allMembers.data || []);
      setActivities(logs.data || []);
      setDbCategories(cats.data || []);
      if (cats.data?.length) setSelectedCategory(cats.data[0].name);
    }
    setLoading(false);
  }

  const logAction = useCallback(async (action: string, itemName: string, target?: string) => {
    if (!user?.email) return;
    const actor = user.email.split('@')[0];
    const fullAction = target ? `${action} ${itemName} for ${target}` : `${action} ${itemName}`;

    const { error } = await supabase.from('activity_log').insert([{ 
      trip_slug: slug, 
      user_name: actor, 
      action_type: fullAction, 
      item_name: '' 
    }]);

    if (!error) {
      const { data } = await supabase.from('activity_log').select('*').eq('trip_slug', slug).order('created_at', { ascending: false }).limit(10);
      if (data) setActivities(data);
    }
  }, [slug, user]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const item = items.find(i => i.id === draggableId);
    if (item && item.category_name !== destination.droppableId) {
      await supabase.from('checklist_items').update({ category_name: destination.droppableId }).eq('id', draggableId);
      setItems(items.map(i => i.id === draggableId ? { ...i, category_name: destination.droppableId } : i));
      logAction('moved', item.item_name);
    }
  };

  const copyJoinLink = () => {
    if (!tripData?.share_token) return;
    const url = `${window.location.origin}/join/${tripData.share_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || authLoading) return <div className={`min-h-screen flex items-center justify-center ${t.bg}`}><Loader2 className={`animate-spin ${t.accentText}`} size={48} /></div>;

  if (!user || isMember === false) return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${t.bg} p-6 text-center`}>
      <X size={64} className="text-red-500 mb-4" />
      <h2 className="text-2xl font-black uppercase mb-2">Access Denied</h2>
      <p className={`${t.subtext} mb-8 max-w-xs font-bold`}>
        {!user ? "Please login to access GatherGo." : "You are not a member of this trip group."}
      </p>
      <button onClick={() => router.push('/login')} className={`${t.accent} text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest`}>Go to Login</button>
    </div>
  );

  return (
    <main className={`min-h-screen ${t.bg} ${t.text} p-4 md:p-12 transition-colors duration-500`}>
      <div className="max-w-[1440px] mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <Link href="/" className={`${t.subtext} flex items-center gap-2 font-black mb-4 hover:${t.accentText} uppercase text-[10px] tracking-widest`}>
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <h1 className="text-5xl font-black capitalize tracking-tight">{String(slug).replace(/-/g, ' ')}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] font-black uppercase tracking-tighter leading-none mb-1">{user?.email?.split('@')[0]}</p>
              <button onClick={() => supabase.auth.signOut()} className={`${t.subtext} text-[8px] font-bold hover:text-red-500`}>LOGOUT</button>
            </div>
            <div className={`${t.card} p-2 rounded-2xl flex gap-1 border ${t.border} shadow-sm`}>
              {(['classic', 'midnight', 'ocean', 'forest'] as const).map(name => (
                <button key={name} onClick={() => { setCurrentTheme(name); localStorage.setItem('app_theme', name); }} className={`p-2 rounded-lg ${currentTheme === name ? t.accent + ' text-white' : t.subtext}`}>
                  {name === 'classic' && <Sun size={18}/>}
                  {name === 'midnight' && <Moon size={18}/>}
                  {name === 'ocean' && <Waves size={18}/>}
                  {name === 'forest' && <TreePine size={18}/>}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-3 order-2 lg:order-1">
            <MemberDirectory members={tripMembers} theme={t} />
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className={`flex gap-8 mb-8 border-b ${t.border}`}>
              <button onClick={() => setActiveTab('checklist')} className={`pb-4 px-2 font-black text-[10px] uppercase tracking-widest ${activeTab === 'checklist' ? `border-b-4 ${t.accentText} border-current` : t.subtext}`}>Checklist</button>
              <button onClick={() => setActiveTab('itinerary')} className={`pb-4 px-2 font-black text-[10px] uppercase tracking-widest ${activeTab === 'itinerary' ? `border-b-4 ${t.accentText} border-current` : t.subtext}`}>Itinerary</button>
            </div>

            {activeTab === 'checklist' ? (
              <section className="animate-in fade-in pb-12">
                {isOwner && (
                  <div className={`${t.card} p-6 rounded-[32px] border ${t.border} mb-8 shadow-sm flex items-center justify-between gap-4`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${t.categoryBg} ${t.accentText}`}><LinkIcon size={20}/></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Permanent Join Link</p>
                        <p className={`${t.subtext} text-[9px] font-bold truncate max-w-[200px]`}>.../join/{tripData?.share_token}</p>
                      </div>
                    </div>
                    <button onClick={copyJoinLink} className={`${t.accent} text-white px-6 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 active:scale-95 transition-all`}>
                      {copied ? <><CheckIcon size={14}/> COPIED</> : <><Copy size={14}/> COPY LINK</>}
                    </button>
                  </div>
                )}

                <form onSubmit={async (e) => {
                  e.preventDefault(); if(!newItem) return;
                  const { data } = await supabase.from('checklist_items').insert([{ item_name: newItem, trip_slug: slug, category_name: selectedCategory }]).select().single();
                  if(data) { setItems([data, ...items]); logAction('added', newItem); setNewItem(''); }
                }} className={`${t.card} p-6 rounded-[32px] border ${t.border} mb-8 shadow-sm space-y-4`}>
                  <div className="flex gap-2">
                    <input className={`flex-grow p-4 ${t.bg} rounded-2xl focus:outline-none font-bold`} placeholder="Add item..." value={newItem} onChange={(e) => setNewItem(e.target.value)} />
                    <button className={`${t.accent} text-white px-8 py-2 rounded-2xl font-black`}>ADD</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dbCategories.map(cat => (
                      <button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.name)} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${selectedCategory === cat.name ? `${t.accent} text-white` : `${t.bg} ${t.subtext}`}`}>{cat.name}</button>
                    ))}
                  </div>
                </form>

                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="space-y-12">
                    {dbCategories.map(category => (
                      <Droppable key={category.id} droppableId={category.name}>
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef}>
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${t.categoryBg} mb-4`}>
                              <Tag size={12} className={t.accentText} />
                              <h3 className="text-[10px] font-black uppercase tracking-widest">{category.name}</h3>
                            </div>
                            <div className="space-y-3">
                              {items.filter(i => i.category_name === category.name).map((item, index) => (
                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                  {(provided) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} className={`${t.card} p-5 rounded-3xl border ${t.border} shadow-sm flex flex-col`}>
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                          {/* FIXED: DRAG HANDLE RESTRICTED TO ICON ONLY */}
                                          <div {...provided.dragHandleProps} className={t.subtext}><GripVertical size={20} /></div>
                                          <button onClick={async (e) => {
                                            e.stopPropagation();
                                            const newState = !item.is_packed;
                                            await supabase.from('checklist_items').update({ is_packed: newState }).eq('id', item.id);
                                            setItems(items.map(i => i.id === item.id ? { ...i, is_packed: newState } : i));
                                            logAction(newState ? 'completed' : 'updated', item.item_name);
                                          }}>
                                            {item.is_packed ? <CheckCircle2 className="text-green-500" size={24} /> : <Circle className={t.subtext} size={24} />}
                                          </button>
                                          <p className={`font-bold ${item.is_packed ? `line-through ${t.subtext}` : ''}`}>{item.item_name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button onClick={() => setClaimingId(claimingId === item.id ? null : item.id)} className={t.subtext}><UserPlus size={18} /></button>
                                          <button onClick={async () => { await supabase.from('checklist_items').delete().eq('id', item.id); setItems(items.filter(i => i.id !== item.id)); }} className={`${t.subtext} hover:text-red-500`}><Trash2 size={18} /></button>
                                        </div>
                                      </div>
                                      {claimingId === item.id && (
                                        <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                                          {tripMembers.map(member => (
                                            <button key={member.id} onClick={async (e) => {
                                              e.stopPropagation();
                                              const targetName = member.family_name || member.user_email?.split('@')[0];
                                              const current = item.claimed_by_name || [];
                                              const isAdding = !current.includes(targetName);
                                              const updated = isAdding ? [...current, targetName] : current.filter((n:string) => n !== targetName);
                                              await supabase.from('checklist_items').update({ claimed_by_name: updated }).eq('id', item.id);
                                              setItems(items.map(i => i.id === item.id ? { ...i, claimed_by_name: updated } : i));
                                              logAction(isAdding ? 'claimed' : 'unclaimed', item.item_name, targetName);
                                            }} className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${item.claimed_by_name?.includes(member.family_name || member.user_email?.split('@')[0]) ? t.accent + ' text-white border-transparent' : `${t.bg} ${t.subtext}`}`}>
                                              <span className="flex items-center gap-1">{member.family_name || member.user_email?.split('@')[0]}{member.status === 'Owner' && <Crown size={8} />}</span>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            </div>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    ))}
                  </div>
                </DragDropContext>
              </section>
            ) : (
              <section className="animate-in fade-in pb-20">
                <form onSubmit={async (e) => {
                  e.preventDefault(); if(!eventTitle || !eventDate) return;
                  const { data } = await supabase.from('itinerary_events').insert([{ title: eventTitle, event_date: eventDate, trip_slug: slug }]).select().single();
                  if(data) { setEvents([...events, data].sort((a,b) => a.event_date.localeCompare(b.event_date))); logAction('scheduled', eventTitle); setEventTitle(''); }
                }} className={`${t.card} p-6 rounded-[32px] border ${t.border} mb-12 space-y-4`}>
                  <input className={`w-full p-4 ${t.bg} rounded-2xl focus:outline-none font-bold`} placeholder="Itinerary Event..." value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
                  <input type="date" className={`w-full p-4 ${t.bg} rounded-2xl focus:outline-none font-bold`} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                  <button className={`${t.accent} text-white py-4 rounded-2xl font-black uppercase w-full`}>Add Event</button>
                </form>
                <div className={`relative pl-8 space-y-10 before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-0.5 before:${t.border.replace('border', 'bg')}`}>
                  {events.map(event => (
                    <div key={event.id} className="relative">
                      <div className={`absolute -left-[32px] top-1.5 w-6 h-6 ${t.card} border-4 ${t.accentText.replace('text', 'border')} rounded-full shadow-sm`} />
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${t.accentText}`}>
                            {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                          </p>
                          <h4 className="text-xl font-black flex items-center gap-2 mt-1"><MapPin size={18} className={t.subtext} /> {event.title}</h4>
                        </div>
                        <button onClick={async () => { await supabase.from('itinerary_events').delete().eq('id', event.id); setEvents(events.filter(e => e.id !== event.id)); }} className={t.subtext}><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-3 order-3">
            <ActivityFeed activities={activities} theme={t} />
          </div>
        </div>
      </div>
    </main>
  );
}