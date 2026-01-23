'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  CheckCircle2, Circle, ArrowLeft, Plus, Calendar, 
  ListChecks, UserPlus, Tag, Trash2, X, Loader2, Users, Check, MapPin, Clock,
  Sun, Moon, Waves, TreePine, GripVertical
} from 'lucide-react';
import Link from 'next/link';

// 1. Define themes OUTSIDE to prevent "undefined" errors on mount
const themes = {
  classic: { bg: 'bg-slate-50', card: 'bg-white', text: 'text-slate-900', subtext: 'text-slate-400', accent: 'bg-blue-600', accentText: 'text-blue-600', border: 'border-slate-100', categoryBg: 'bg-blue-100/50' },
  midnight: { bg: 'bg-slate-950', card: 'bg-slate-900', text: 'text-slate-50', subtext: 'text-slate-500', accent: 'bg-indigo-500', accentText: 'text-indigo-400', border: 'border-slate-800', categoryBg: 'bg-slate-800' },
  ocean: { bg: 'bg-cyan-50', card: 'bg-white', text: 'text-cyan-900', subtext: 'text-cyan-400', accent: 'bg-cyan-600', accentText: 'text-cyan-600', border: 'border-cyan-100', categoryBg: 'bg-cyan-100/50' },
  forest: { bg: 'bg-emerald-50', card: 'bg-white', text: 'text-emerald-900', subtext: 'text-emerald-400', accent: 'bg-emerald-600', accentText: 'text-emerald-600', border: 'border-emerald-100', categoryBg: 'bg-emerald-100/50' }
};

export default function TripPage() {
  const { slug } = useParams();
  
  // App & Theme State
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('classic');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checklist' | 'itinerary'>('checklist');
  
  // 2. Safety Fallback: Use 'classic' if currentTheme is momentarily undefined
  const t = themes[currentTheme] || themes.classic;

  // Data State
  const [items, setItems] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]); 
  const [dbCategories, setDbCategories] = useState<any[]>([]); 
  
  // Interaction State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') as keyof typeof themes;
    if (savedTheme && themes[savedTheme]) setCurrentTheme(savedTheme);
    if (slug) loadInitialData();
  }, [slug]);

  async function loadInitialData() {
    setLoading(true);
    const [itemRes, eventRes, familyRes, catRes] = await Promise.all([
      supabase.from('checklist_items').select('*').eq('trip_slug', slug).order('created_at', { ascending: false }),
      supabase.from('itinerary_events').select('*').eq('trip_slug', slug).order('event_date', { ascending: true }).order('event_time', { ascending: true }),
      supabase.from('authorized_users').select('family_name').order('family_name'),
      supabase.from('categories').select('*').order('sort_order', { ascending: true })
    ]);
    if (itemRes.data) setItems(itemRes.data);
    if (eventRes.data) setEvents(eventRes.data);
    if (familyRes.data) setFamilies(familyRes.data);
    if (catRes.data) {
      setDbCategories(catRes.data);
      if (!selectedCategory) setSelectedCategory(catRes.data[0]?.name || 'General');
    }
    setLoading(false);
  }

  // --- Actions ---
  const resetMainView = () => {
    if (editingId) handleUpdateItem(editingId);
    setEditingId(null);
    setClaimingId(null);
  };

  const toggleTheme = (themeName: keyof typeof themes) => {
    setCurrentTheme(themeName);
    localStorage.setItem('app_theme', themeName);
  };

  const handleUpdateItem = async (id: string) => {
    if (!editText) { setEditingId(null); return; }
    await supabase.from('checklist_items').update({ item_name: editText }).eq('id', id);
    setEditingId(null);
    loadInitialData();
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const updatedItems = items.map(i => i.id === draggableId ? { ...i, category_name: destination.droppableId } : i);
    setItems(updatedItems);
    await supabase.from('checklist_items').update({ category_name: destination.droppableId }).eq('id', draggableId);
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${t.bg}`}><Loader2 className={`animate-spin ${t.accentText}`} size={48} /></div>;

  return (
    <main className={`min-h-screen ${t.bg} ${t.text} p-4 md:p-12 transition-colors duration-500 relative overflow-x-hidden`}>
      
      {/* Overlay to reset view on click-outside */}
      {(editingId || claimingId) && <div className="fixed inset-0 z-10 bg-black/5 backdrop-blur-[2px]" onClick={resetMainView} />}

      <div className="max-w-2xl mx-auto relative z-20">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Link href="/" className={`${t.subtext} flex items-center gap-2 font-bold mb-4 hover:${t.accentText} uppercase text-[10px] tracking-widest`}>
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <h1 className="text-4xl font-black capitalize tracking-tight">{String(slug).replace(/-/g, ' ')}</h1>
          </div>
          <div className={`${t.card} p-2 rounded-2xl flex gap-1 border ${t.border} shadow-sm`}>
            <button onClick={() => toggleTheme('classic')} className={`p-2 rounded-lg ${currentTheme === 'classic' ? t.accent + ' text-white' : t.subtext}`}><Sun size={18}/></button>
            <button onClick={() => toggleTheme('midnight')} className={`p-2 rounded-lg ${currentTheme === 'midnight' ? t.accent + ' text-white' : t.subtext}`}><Moon size={18}/></button>
            <button onClick={() => toggleTheme('ocean')} className={`p-2 rounded-lg ${currentTheme === 'ocean' ? t.accent + ' text-white' : t.subtext}`}><Waves size={18}/></button>
            <button onClick={() => toggleTheme('forest')} className={`p-2 rounded-lg ${currentTheme === 'forest' ? t.accent + ' text-white' : t.subtext}`}><TreePine size={18}/></button>
          </div>
        </header>

        <div className={`flex gap-8 mb-10 border-b ${t.border}`}>
          <button onClick={() => setActiveTab('checklist')} className={`pb-4 px-2 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'checklist' ? `border-b-4 border-current ${t.accentText}` : t.subtext}`}>Checklist</button>
          <button onClick={() => setActiveTab('itinerary')} className={`pb-4 px-2 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'itinerary' ? `border-b-4 border-current ${t.accentText}` : t.subtext}`}>Itinerary</button>
        </div>

        {activeTab === 'checklist' ? (
          <section className="animate-in fade-in">
            <form onSubmit={async (e) => { e.preventDefault(); if(!newItem) return; await supabase.from('checklist_items').insert([{ item_name: newItem, trip_slug: slug, category_name: selectedCategory, claimed_by_name: [] }]); setNewItem(''); loadInitialData(); }} 
                  className={`${t.card} p-6 rounded-[32px] shadow-sm border ${t.border} mb-8 space-y-4`}>
              <div className="flex gap-2">
                <input className={`flex-grow p-4 ${t.bg} rounded-2xl focus:outline-none font-bold`} placeholder="Add item..." value={newItem} onChange={(e) => setNewItem(e.target.value)} />
                <button className={`${t.accent} text-white px-8 py-2 rounded-2xl font-black`}>ADD</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {dbCategories.map(cat => (
                  <button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.name)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat.name ? `${t.accent} text-white` : `${t.bg} ${t.subtext}`}`}>{cat.name}</button>
                ))}
              </div>
            </form>

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="space-y-12 pb-10">
                {dbCategories.map(category => (
                  <Droppable key={category.id} droppableId={category.name}>
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${t.categoryBg} mb-4`}>
                          <Tag size={12} className={t.accentText} />
                          <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${t.text}`}>{category.name}</h3>
                        </div>
                        <div className="space-y-3">
                          {items.filter(i => i.category_name === category.name).map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                     onClick={(e) => { e.stopPropagation(); if (editingId !== item.id) { setEditingId(item.id); setEditText(item.item_name); } }}
                                     className={`${t.card} p-5 rounded-3xl border ${t.border} flex flex-col shadow-sm transition-all cursor-grab ${editingId === item.id || claimingId === item.id ? `ring-2 ring-current ${t.accentText} relative z-30` : ''}`}>
                                  <div className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-4 flex-grow">
                                      <button onClick={async (e) => { e.stopPropagation(); await supabase.from('checklist_items').update({ is_packed: !item.is_packed }).eq('id', item.id); loadInitialData(); }}>
                                        {item.is_packed ? <CheckCircle2 className="text-green-500" size={26} /> : <Circle className={t.subtext} size={26} />}
                                      </button>
                                      <div className="flex-grow">
                                        {editingId === item.id ? (
                                          <input className={`w-full p-2 ${t.bg} rounded-lg focus:outline-none font-bold text-lg border-b-2 border-blue-500`} value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateItem(item.id)} autoFocus onClick={(e) => e.stopPropagation()} />
                                        ) : (
                                          <>
                                            <p className={`text-lg font-bold leading-tight ${item.is_packed ? `line-through ${t.subtext}` : t.text}`}>{item.item_name}</p>
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                              {item.claimed_by_name?.map((name: string) => (
                                                <span key={name} className={`text-[9px] font-black ${t.accent} text-white px-2 py-0.5 rounded-full uppercase tracking-tighter`}>{name}</span>
                                              ))}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <button onClick={(e) => { e.stopPropagation(); setClaimingId(claimingId === item.id ? null : item.id); }} className={`p-2 transition-colors ${claimingId === item.id ? t.accentText : t.subtext}`}><UserPlus size={20} /></button>
                                      <button onClick={(e) => { e.stopPropagation(); supabase.from('checklist_items').delete().eq('id', item.id).then(() => loadInitialData()); }} className={`p-2 transition-colors ${t.subtext} hover:text-red-500`}><Trash2 size={20} /></button>
                                    </div>
                                  </div>
                                  {claimingId === item.id && (
                                    <div className={`mt-4 pt-4 border-t ${t.border}`} onClick={(e) => e.stopPropagation()}>
                                      <div className="flex flex-wrap gap-2">
                                        {families.map(f => (
                                          <button key={f.family_name} onClick={() => { 
                                            const claims = item.claimed_by_name || [];
                                            const updated = claims.includes(f.family_name) ? claims.filter((n: string) => n !== f.family_name) : [...claims, f.family_name];
                                            supabase.from('checklist_items').update({ claimed_by_name: updated }).eq('id', item.id).then(() => loadInitialData());
                                          }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${item.claimed_by_name?.includes(f.family_name) ? `${t.accent} text-white border-transparent shadow-md` : `${t.bg} ${t.subtext} ${t.border}`}`}>{f.family_name}</button>
                                        ))}
                                      </div>
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
          <section className="animate-in fade-in pb-12">
            <form onSubmit={async (e) => { e.preventDefault(); if(!eventTitle || !eventDate) return; await supabase.from('itinerary_events').insert([{ title: eventTitle, event_date: eventDate, event_time: eventTime || null, trip_slug: slug }]); setEventTitle(''); setEventDate(''); setEventTime(''); loadInitialData(); }} 
                  className={`${t.card} p-6 rounded-[32px] shadow-sm border ${t.border} mb-12 space-y-4`}>
              <input className={`w-full p-4 ${t.bg} rounded-2xl focus:outline-none font-bold`} placeholder="Event Title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
              <div className="flex gap-2">
                <input type="date" className={`w-1/2 p-4 ${t.bg} rounded-2xl focus:outline-none font-bold`} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                <input type="time" className={`w-1/2 p-4 ${t.bg} rounded-2xl focus:outline-none font-bold`} value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
              </div>
              <button className={`${t.accent} text-white py-4 rounded-2xl font-black uppercase tracking-widest w-full active:scale-[0.98] transition-all`}>Save to Timeline</button>
            </form>

            <div className={`relative pl-8 space-y-10 before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-0.5 before:${t.border.replace('border', 'bg')}`}>
              {events.map(event => (
                <div key={event.id} className="relative group">
                  <div className={`absolute -left-[32px] top-1.5 w-6 h-6 ${t.card} border-4 ${t.accentText.replace('text', 'border')} rounded-full shadow-sm`} />
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-1">
                        <p className={`text-[11px] font-black uppercase tracking-tighter ${t.accentText}`}>{new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        {event.event_time && <div className={`flex items-center gap-1 text-[11px] font-bold ${t.subtext}`}><Clock size={12} /> {formatTime(event.event_time)}</div>}
                      </div>
                      <h4 className="text-xl font-black flex items-center gap-2"><MapPin size={18} className={t.subtext} /> {event.title}</h4>
                    </div>
                    <button onClick={async () => { if(confirm("Delete this event?")) { await supabase.from('itinerary_events').delete().eq('id', event.id); loadInitialData(); } }} className={`${t.subtext} hover:text-red-500 transition-colors p-2`}><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}