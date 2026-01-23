'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  CheckCircle2, Circle, ArrowLeft, Plus, Calendar, 
  ListChecks, UserPlus, Tag, Trash2, X, Loader2, Users, Check, MapPin, Clock,
  FileText, Package, Utensils 
} from 'lucide-react';
import Link from 'next/link';

// Map DB icon names to Lucide icons
const IconMap: Record<string, any> = {
  'file-text': FileText,
  'package': Package,
  'utensils': Utensils,
};

export default function TripPage() {
  const { slug } = useParams();
  
  // Data State
  const [items, setItems] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]); 
  const [dbCategories, setDbCategories] = useState<any[]>([]); 
  
  // Interaction State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checklist' | 'itinerary'>('checklist');
  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Itinerary State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');

  useEffect(() => {
    if (slug) loadInitialData();
  }, [slug]);

  async function loadInitialData() {
    setLoading(true);
    const [itemRes, eventRes, familyRes, catRes] = await Promise.all([
      supabase.from('checklist_items').select('*').eq('trip_slug', slug).order('created_at', { ascending: false }),
      supabase.from('itinerary_events').select('*').eq('trip_slug', slug).order('event_date', { ascending: true }).order('event_time', { ascending: true }),
      supabase.from('authorized_users').select('family_name').order('family_name'),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }) // Respecting your requested order
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

  // --- Global UX Fix: Reset View ---
  const resetMainView = () => {
    if (editingId) handleUpdateItem(editingId);
    setEditingId(null);
    setClaimingId(null);
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const updatedItems = items.map(i => i.id === draggableId ? { ...i, category_name: destination.droppableId } : i);
    setItems(updatedItems);

    await supabase.from('checklist_items').update({ category_name: destination.droppableId }).eq('id', draggableId);
  };

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem) return;
    await supabase.from('checklist_items').insert([{ 
      item_name: newItem, 
      trip_slug: slug, 
      category_name: selectedCategory,
      claimed_by_name: [] 
    }]);
    setNewItem('');
    loadInitialData();
  }

  async function handleToggleClaim(item: any, familyName: string) {
    const currentClaims = item.claimed_by_name || [];
    const updatedClaims = currentClaims.includes(familyName)
      ? currentClaims.filter((name: string) => name !== familyName)
      : [...currentClaims, familyName];

    setItems(items.map(i => i.id === item.id ? { ...i, claimed_by_name: updatedClaims } : i));
    await supabase.from('checklist_items').update({ claimed_by_name: updatedClaims }).eq('id', item.id);
  }

  async function handleUpdateItem(id: string) {
    if (!editText) { setEditingId(null); return; }
    await supabase.from('checklist_items').update({ item_name: editText }).eq('id', id);
    setEditingId(null);
    loadInitialData();
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-12 text-slate-900 font-sans relative overflow-x-hidden">
      
      {/* Overlay for clicking outside */}
      {(editingId || claimingId) && (
        <div className="fixed inset-0 z-10 bg-black/5 backdrop-blur-[2px]" onClick={resetMainView} />
      )}

      <div className="max-w-2xl mx-auto relative z-20">
        <Link href="/" className="flex items-center gap-2 text-slate-400 font-bold mb-6 hover:text-blue-600 uppercase text-xs tracking-widest transition-colors">
          <ArrowLeft size={16} /> Dashboard
        </Link>

        <header className="mb-10">
          <h1 className="text-4xl font-black capitalize tracking-tight">{String(slug).replace(/-/g, ' ')}</h1>
          <div className="flex gap-8 mt-8 border-b border-slate-200">
            <button onClick={() => setActiveTab('checklist')} className={`pb-4 px-2 flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'checklist' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-slate-300'}`}>
              <ListChecks size={18} /> Checklist
            </button>
            <button onClick={() => setActiveTab('itinerary')} className={`pb-4 px-2 flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'itinerary' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-slate-300'}`}>
              <Calendar size={18} /> Itinerary
            </button>
          </div>
        </header>

        {activeTab === 'checklist' ? (
          <section className="animate-in fade-in">
            <form onSubmit={handleAddItem} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-8 space-y-4">
              <div className="flex gap-2">
                <input className="flex-grow p-4 bg-slate-50 rounded-2xl focus:outline-none font-bold" placeholder="Add item..." value={newItem} onChange={(e) => setNewItem(e.target.value)} />
                <button className="bg-blue-600 text-white px-8 py-2 rounded-2xl font-black active:scale-95 shadow-lg shadow-blue-100">ADD</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {dbCategories.map(cat => (
                  <button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.name)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat.name ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>{cat.name}</button>
                ))}
              </div>
            </form>

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="space-y-12 pb-10">
                {dbCategories.map(category => (
                  <Droppable key={category.id} droppableId={category.name}>
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                          <Tag size={12} /> {category.name}
                        </h3>
                        <div className="space-y-3">
                          {items.filter(i => i.category_name === category.name).map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided) => (
                                <div 
                                  ref={provided.innerRef} 
                                  {...provided.draggableProps} 
                                  {...provided.dragHandleProps}
                                  onClick={(e) => { 
                                    e.stopPropagation();
                                    if (editingId !== item.id) { 
                                      setEditingId(item.id); 
                                      setEditText(item.item_name); 
                                    } 
                                  }}
                                  className={`bg-white p-5 rounded-3xl border border-slate-50 flex flex-col shadow-sm transition-all cursor-grab ${editingId === item.id || claimingId === item.id ? 'ring-2 ring-blue-500 shadow-xl relative z-30' : ''}`}
                                >
                                  <div className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-4 flex-grow">
                                      <button onClick={(e) => { e.stopPropagation(); supabase.from('checklist_items').update({ is_packed: !item.is_packed }).eq('id', item.id).then(() => loadInitialData()); }}>
                                        {item.is_packed ? <CheckCircle2 className="text-green-500" size={26} /> : <Circle className="text-slate-200" size={26} />}
                                      </button>
                                      <div className="flex-grow">
                                        {editingId === item.id ? (
                                          <input className="w-full p-2 bg-slate-50 rounded-lg focus:outline-none font-bold text-lg border-b-2 border-blue-500" value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateItem(item.id)} autoFocus onClick={(e) => e.stopPropagation()} />
                                        ) : (
                                          <>
                                            <p className={`text-lg font-bold ${item.is_packed ? "line-through text-slate-200" : "text-slate-800"}`}>{item.item_name}</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {item.claimed_by_name?.map((name: string) => (
                                                <span key={name} className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">{name}</span>
                                              ))}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                      <button onClick={(e) => { e.stopPropagation(); setClaimingId(claimingId === item.id ? null : item.id); }} className={`p-2 ${claimingId === item.id ? 'text-blue-600 bg-blue-50 rounded-xl' : 'text-slate-200'}`}><UserPlus size={20} /></button>
                                      <button onClick={(e) => { e.stopPropagation(); supabase.from('checklist_items').delete().eq('id', item.id).then(() => loadInitialData()); }} className="text-slate-200 hover:text-red-500 p-2"><Trash2 size={20} /></button>
                                    </div>
                                  </div>
                                  {claimingId === item.id && (
                                    <div className="mt-4 pt-4 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex flex-wrap gap-2">
                                        {families.map(f => (
                                          <button key={f.family_name} onClick={() => handleToggleClaim(item, f.family_name)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 ${item.claimed_by_name?.includes(f.family_name) ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                            {item.claimed_by_name?.includes(f.family_name) && <Check size={12} />} {f.family_name}
                                          </button>
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
          <section className="animate-in fade-in pb-10">
            <p className="text-center text-slate-400 italic py-10">Timeline synced from database.</p>
          </section>
        )}
      </div>
    </main>
  );
}