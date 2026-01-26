'use client';

// GLOBAL TYPE DEFINITION: Resolves Vercel build errors for AdSense
declare global { interface Window { adsbygoogle: any[]; } }

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  Target, Sun, Moon, Waves, TreePine, Loader2, 
  Link as LinkIcon, FileDown, ArrowLeft, LogOut, User as UserIcon
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Modular Component Imports
import TravelAd from '@/components/trip/TravelAd';
import ActionBriefing from '@/components/trip/ActionBriefing';
import ChecklistModule from '@/components/trip/ChecklistModule';
import ItineraryModule from '@/components/trip/ItineraryModule';
import ExpenseModule from '@/components/trip/ExpenseModule';
import ExpenseList from '@/components/trip/ExpenseList';
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
  
  // 1. THEME PERSISTENCE
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('classic');

  useEffect(() => {
    const savedTheme = localStorage.getItem('gathergo_theme') as keyof typeof themes;
    if (savedTheme && themes[savedTheme]) setCurrentTheme(savedTheme);
  }, []);

  const handleThemeChange = (newTheme: keyof typeof themes) => {
    setCurrentTheme(newTheme);
    localStorage.setItem('gathergo_theme', newTheme);
  };

  // 2. UI STATE
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checklist' | 'itinerary' | 'expenses'>('checklist');
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // 3. DATA STATE: Initialized to empty to prevent .forEach() crashes
  const [tripData, setTripData] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [tripMembers, setTripMembers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  // 4. FORM STATE
  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');

  const t = themes[currentTheme] || themes.classic;

  // Add this function to your TripPage component in page.tsx

const downloadTripSummary = () => {
  const doc = new jsPDF();
  const tripTitle = String(slug).replace(/-/g, ' ').toUpperCase();
  let yPos = 20;

  // HEADER
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`TRIP SUMMARY: ${tripTitle}`, 14, yPos);
  yPos += 5;
  doc.setLineWidth(0.5);
  doc.line(14, yPos, 196, yPos);
  yPos += 15;

  // ========== SECTION 1: CHECKLIST ==========
  doc.setFontSize(16);
  doc.setTextColor(79, 70, 229);
  doc.text('CHECKLIST', 14, yPos);
  yPos += 10;

  const checklistByCategory: Record<string, any[]> = {};
  dbCategories.forEach(cat => {
    checklistByCategory[cat.name] = items.filter(i => i.category_name === cat.name);
  });

  Object.entries(checklistByCategory).forEach(([categoryName, categoryItems]) => {
    if (categoryItems.length === 0) return;

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(categoryName.toUpperCase(), 14, yPos);
    yPos += 7;

    const checklistData = categoryItems.map(item => {
      const status = item.is_packed ? '✓' : '○';
      const assignedTo = item.claimed_by_name && item.claimed_by_name.length > 0 
        ? item.claimed_by_name.join(', ') 
        : '-';
      return [status, item.item_name, assignedTo];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['', 'Item', 'Assigned To']],
      body: checklistData,
      theme: 'plain',
      headStyles: { 
        fillColor: [240, 240, 240], 
        textColor: [50, 50, 50],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 100 },
        2: { cellWidth: 70 }
      },
      margin: { left: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  });

  // Check if we need a new page
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // ========== SECTION 2: ITINERARY ==========
  yPos += 5;
  doc.setFontSize(16);
  doc.setTextColor(79, 70, 229);
  doc.text('ITINERARY', 14, yPos);
  yPos += 10;

  if (events.length > 0) {
    const itineraryData = events.map(event => [
      new Date(event.event_date).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      event.title
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Event']],
      body: itineraryData,
      theme: 'striped',
      headStyles: { 
        fillColor: [79, 70, 229],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 130 }
      },
      margin: { left: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('No events scheduled', 14, yPos);
    yPos += 15;
  }

  // Check if we need a new page
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  // ========== SECTION 3: EXPENSES ==========
  doc.setFontSize(16);
  doc.setTextColor(79, 70, 229);
  doc.text('EXPENSES', 14, yPos);
  yPos += 10;

  if (expenses.length > 0) {
    const expenseData = expenses.map(exp => [
      new Date(exp.expense_date || exp.created_at).toLocaleDateString(),
      exp.description,
      exp.paid_by_name,
      exp.split_with && exp.split_with.length > 0 ? exp.split_with.join(', ') : 'Everyone',
      `$${parseFloat(exp.amount).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Description', 'Paid By', 'Split With', 'Amount']],
      body: expenseData,
      theme: 'grid',
      headStyles: { 
        fillColor: [79, 70, 229],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 50 },
        4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 14, yPos);
    yPos += 15;

    // Settlement Instructions
    const balances = { ...settlementBalances };
    const debtors = Object.entries(balances).filter(([_, b]) => b < 0).sort((a,b) => a[1] - b[1]);
    const creditors = Object.entries(balances).filter(([_, b]) => b > 0).sort((a,b) => b[1] - a[1]);
    const instructions: string[][] = [];
    let i = 0, j = 0;
    while(i < debtors.length && j < creditors.length) {
      const amount = Math.min(Math.abs(debtors[i][1]), creditors[j][1]);
      instructions.push([debtors[i][0], '→', creditors[j][0], `$${amount.toFixed(2)}`]);
      debtors[i][1] += amount; creditors[j][1] -= amount;
      if (Math.abs(debtors[i][1]) < 0.01) i++;
      if (creditors[j][1] < 0.01) j++;
    }

    if (instructions.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.text('Settlement Instructions', 14, yPos);
      yPos += 7;

      autoTable(doc, {
        startY: yPos,
        head: [['From', '', 'To', 'Amount']],
        body: instructions,
        theme: 'striped',
        headStyles: { 
          fillColor: [16, 185, 129],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 15, halign: 'center' },
          2: { cellWidth: 40 },
          3: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }
        },
        margin: { left: 14 }
      });
    }
  } else {
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('No expenses recorded', 14, yPos);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
      105,
      285,
      { align: 'center' }
    );
  }

  doc.save(`${slug}-complete-summary.pdf`);
};
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    const [itemRes, eventRes, expRes, memberRes, allMembers, logs, cats, tripInfo] = await Promise.all([
      supabase.from('checklist_items').select('*').eq('trip_slug', slug).order('created_at', { ascending: false }),
      supabase.from('itinerary_events').select('*').eq('trip_slug', slug).order('event_date', { ascending: true }),
      supabase.from('trip_expenses').select('*').eq('trip_slug', slug).order('expense_date', { ascending: false }),
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
      setExpenses(expRes.data || []);
      setTripMembers(allMembers.data || []);
      setActivities(logs.data || []);
      setDbCategories(cats.data || []);
      if (cats.data?.length && !selectedCategory) setSelectedCategory(cats.data[0].name);
    }
    setLoading(false);
  }, [slug, user]);

  const logAction = useCallback(async (action: string, name: string) => {
    if (!user?.email) return;
    const actor = user.email.split('@')[0];
    await supabase.from('activity_log').insert([{ 
      trip_slug: slug, user_name: actor, action_type: `${action} ${name}`, item_name: name 
    }]);
    loadInitialData();
  }, [slug, user, loadInitialData]);

  // 5. SETTLEMENT ENGINE: Who Pays Whom
  const settlementBalances = useMemo(() => {
    const totals: Record<string, number> = {};
    if (!tripMembers || tripMembers.length === 0) return totals;
    tripMembers.forEach((m: any) => totals[m.user_email.split('@')[0]] = 0);
    expenses.forEach((exp: any) => {
      const payer = exp.paid_by_name;
      const amountVal = parseFloat(exp.amount);
      const targets = (exp.split_with && exp.split_with.length > 0) 
        ? exp.split_with : tripMembers.map((m: any) => m.user_email.split('@')[0]);
      
      const share = amountVal / (targets.length || 1);
      if (totals[payer] !== undefined) totals[payer] += amountVal;
      targets.forEach((handle: string) => { if (totals[handle] !== undefined) totals[handle] -= share; });
    });
    return totals;
  }, [expenses, tripMembers]);

  // 6. PDF EXPORT: Explicit Member Naming
  const downloadExpensePDF = () => {
    const doc = new jsPDF();
    const tripTitle = String(slug).replace(/-/g, ' ').toUpperCase();
    doc.setFontSize(22); doc.text(`FINANCIAL LEDGER: ${tripTitle}`, 14, 22);
    
    const tableData = expenses.map(exp => [
      new Date(exp.expense_date || exp.created_at).toLocaleDateString(), 
      exp.description, exp.paid_by_name, 
      exp.split_with && exp.split_with.length > 0 ? exp.split_with.join(', ') : 'Everyone',
      `$${parseFloat(exp.amount).toFixed(2)}`
    ]);

    autoTable(doc, { 
      startY: 40, head: [['Date', 'Description', 'Paid By', 'Split With', 'Amount']], 
      body: tableData, theme: 'grid', headStyles: { fillColor: [79, 70, 229] }
    });
    
    const balances = { ...settlementBalances };
    const debtors = Object.entries(balances).filter(([_, b]) => b < 0).sort((a,b) => a[1] - b[1]);
    const creditors = Object.entries(balances).filter(([_, b]) => b > 0).sort((a,b) => b[1] - a[1]);
    const instructions: string[][] = [];
    let i = 0, j = 0;
    while(i < debtors.length && j < creditors.length) {
      const amount = Math.min(Math.abs(debtors[i][1]), creditors[j][1]);
      instructions.push([debtors[i][0], creditors[j][0], `$${amount.toFixed(2)}`]);
      debtors[i][1] += amount; creditors[j][1] -= amount;
      if (Math.abs(debtors[i][1]) < 0.01) i++;
      if (creditors[j][1] < 0.01) j++;
    }
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14); doc.text("Settlement Instructions", 14, finalY);
    autoTable(doc, { startY: finalY + 5, head: [['From', 'To', 'Amount']], body: instructions, theme: 'striped', headStyles: { fillColor: [16, 185, 129] } });
    doc.save(`${slug}-full-report.pdf`);
  };

  // 7. MASTER HANDLER
  const handleUpdate = async (type: string, payload: any) => {
    const currentScrollY = window.scrollY; // Save scroll position
    
    if (type === 'assignItem') {
      const { item, handle } = payload;
      const current = item.claimed_by_name || [];
      const updated = current.includes(handle) ? current.filter((h:string) => h !== handle) : [...current, handle];
      await supabase.from('checklist_items').update({ claimed_by_name: updated }).eq('id', item.id);
      logAction(current.includes(handle) ? 'unassigned' : 'assigned', `${item.item_name} to ${handle}`);
    } else if (type === 'deleteItem') {
      await supabase.from('checklist_items').delete().eq('id', payload);
    } else if (type === 'togglePacked') {
      const newState = !payload.is_packed;
      await supabase.from('checklist_items').update({ is_packed: newState }).eq('id', payload.id);
      logAction(newState ? 'completed' : 'updated', payload.item_name);
    } else if (type === 'addExpense') {
      const handle = payload.paid_by_email.split('@')[0];
      await supabase.from('trip_expenses').insert([{ ...payload, trip_slug: slug, paid_by_name: handle }]);
      logAction('added expense', `$${payload.amount} for ${payload.description}`);
    } else if (type === 'deleteExpense') {
      await supabase.from('trip_expenses').delete().eq('id', payload);
    } else if (type === 'deleteEvent') {
      await supabase.from('itinerary_events').delete().eq('id', payload);
    } else if (type === 'reorderItems') {
      const currentScrollY = window.scrollY;
      const { activeId, overId, categoryName } = payload;
      
      if (categoryName) {
        // Dropped on category zone
        await supabase.from('checklist_items').update({ 
          category_name: categoryName 
        }).eq('id', activeId);
      } else if (overId) {
        // Dropped on item
        const draggedItem = items.find(i => i.id === activeId);
        const targetItem = items.find(i => i.id === overId);
        
        if (draggedItem && targetItem) {
          await supabase.from('checklist_items').update({ 
            category_name: targetItem.category_name 
          }).eq('id', activeId);
        }
      }
    }
    
    await loadInitialData();
    
    // Restore scroll position after data loads
    setTimeout(() => {
      window.scrollTo(0, currentScrollY);
    }, 0);
  };
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (!authLoading && user && slug) loadInitialData();
  }, [user, authLoading, slug, router, loadInitialData]);

  if (loading || authLoading) return <div className={`min-h-screen flex items-center justify-center ${t.bg}`}><Loader2 className="animate-spin" size={48} /></div>;

  return (
    <main className={`min-h-screen ${t.bg} ${t.text} transition-colors duration-500`}>
      {/* UTILITY HEADER: Breadcrumb, Themes, & Profile */}
      <div className={`${t.bg} border-b ${t.border} px-4 md:px-12 py-3 flex items-center justify-between`}>
        <Link href="/" className={`${t.subtext} flex items-center gap-2 font-black text-[9px] uppercase hover:${t.accentText} transition-colors`}>
          <ArrowLeft size={12} /> Dashboard
        </Link>
        <div className="flex items-center gap-6">
          <div className={`${t.card} px-3 py-1.5 rounded-xl flex items-center gap-3 border ${t.border}`}>
            <button onClick={() => handleThemeChange('classic')} className={`p-1.5 rounded-lg transition-all ${currentTheme === 'classic' ? t.accent + ' text-white' : t.subtext}`}><Sun size={14}/></button>
            <button onClick={() => handleThemeChange('midnight')} className={`p-1.5 rounded-lg transition-all ${currentTheme === 'midnight' ? t.accent + ' text-white' : t.subtext}`}><Moon size={14}/></button>
            <button onClick={() => handleThemeChange('ocean')} className={`p-1.5 rounded-lg transition-all ${currentTheme === 'ocean' ? t.accent + ' text-white' : t.subtext}`}><Waves size={14}/></button>
            <button onClick={() => handleThemeChange('forest')} className={`p-1.5 rounded-lg transition-all ${currentTheme === 'forest' ? t.accent + ' text-white' : t.subtext}`}><TreePine size={14}/></button>
          </div>
          <div className="flex items-center gap-2">
            <UserIcon size={12} className={t.accentText} />
            <p className="text-[9px] font-black uppercase">{user?.email?.split('@')[0]}</p>
          </div>
          <button onClick={() => supabase.auth.signOut()} className={`${t.subtext} flex items-center gap-2 font-black text-[9px] uppercase hover:text-red-500 transition-colors`}>
            Logout <LogOut size={12} />
          </button>
        </div>
      </div>

      {/* STICKY NAV: Centered improperly spacer */}
      <nav className={`sticky top-0 z-50 ${t.card} border-b ${t.border} pt-8 pb-0 px-4 md:px-12 shadow-sm`}>
  <div className="max-w-[1440px] mx-auto grid grid-cols-12 items-end">
    <div className="col-span-4" /> 
    <div className="col-span-8 flex justify-between items-end">
      <div className="flex gap-10">
        {(['checklist', 'itinerary', 'expenses'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 px-2 font-black text-[11px] uppercase tracking-[0.15em] relative transition-all ${activeTab === tab ? `${t.accentText}` : 'text-slate-400 hover:text-slate-600'}`}>
            {tab}
            {activeTab === tab && <div className={`absolute bottom-0 left-0 right-0 h-1 ${t.accent} rounded-t-full animate-in slide-in-from-bottom-1`} />}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4 pb-4">
        {/* Full Trip Summary Export */}
        <button 
          onClick={downloadTripSummary} 
          className="bg-purple-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-black uppercase text-[9px] shadow-lg hover:bg-purple-700 transition-colors"
        >
          <FileDown size={14}/> FULL SUMMARY
        </button>
        
        {activeTab === 'expenses' && expenses.length > 0 && (
          <button onClick={downloadExpensePDF} className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-black uppercase text-[9px] shadow-lg"><FileDown size={14}/> EXPENSES PDF</button>
        )}
        <button onClick={() => setIsBriefingOpen(true)} className={`${t.accent} text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-black uppercase text-[9px] shadow-xl`}><Target size={14}/> BRIEFING</button>
      </div>
    </div>
  </div>
</nav>
      <div className="max-w-[1440px] mx-auto p-4 md:p-12">
        <ActionBriefing isOpen={isBriefingOpen} onClose={() => setIsBriefingOpen(false)} items={items} user={user} theme={t} />
        <div className="grid grid-cols-12 gap-10">
          
          {/* SIDEBAR: LEFT */}
          <div className="col-span-4 space-y-8 animate-in slide-in-from-left-4 duration-700">
            {isOwner && (
               <div className={`${t.card} p-6 rounded-[32px] border ${t.border} flex items-center justify-between shadow-sm`}>
                 <div className="flex items-center gap-3"><LinkIcon size={18} className={t.accentText}/><p className="text-[10px] font-black uppercase tracking-widest">Invite Link</p></div>
                 <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join/${tripData.share_token}`); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className={`${t.accent} text-white px-5 py-2 rounded-xl font-black uppercase text-[9px]`}>{copied ? 'COPIED' : 'COPY'}</button>
               </div>
            )}
            <MemberDirectory members={tripMembers} theme={t} isOwner={isOwner} tripSlug={slug as string} onMemberRemoved={loadInitialData} logAction={() => {}} />
            <ActivityFeed activities={activities} theme={t} />
            <TravelAd theme={t} />
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="col-span-8 space-y-10 animate-in slide-in-from-right-4 duration-700">
            {activeTab === 'checklist' && (
              <form onSubmit={async (e) => {
                e.preventDefault(); if(!newItem) return;
                const { data } = await supabase.from('checklist_items').insert([{ item_name: newItem, trip_slug: slug, category_name: selectedCategory }]).select().single();
                if(data) { logAction('added', newItem); setNewItem(''); }
              }} className={`${t.card} p-6 rounded-[32px] border ${t.border} mb-8 space-y-4 shadow-sm`}>
                <div className="flex gap-2">
                  <input className={`flex-grow p-4 ${t.bg} rounded-2xl focus:outline-none font-bold`} placeholder="Add expedition item..." value={newItem} onChange={(e) => setNewItem(e.target.value)} />
                  <button className={`${t.accent} text-white px-8 py-2 rounded-2xl font-black uppercase text-[10px]`}>ADD</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dbCategories.map(cat => (
                    <button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.name)} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${selectedCategory === cat.name ? `${t.accent} text-white shadow-md` : `${t.bg} ${t.subtext}`}`}>{cat.name}</button>
                  ))}
                </div>
              </form>
            )}
            {activeTab === 'itinerary' && (
              <form onSubmit={async (e) => {
                e.preventDefault(); if(!eventTitle || !eventDate) return;
                await supabase.from('itinerary_events').insert([{ title: eventTitle, event_date: eventDate, trip_slug: slug }]);
                loadInitialData(); setEventTitle('');
              }} className={`${t.card} p-8 rounded-[40px] border ${t.border} shadow-sm space-y-4`}>
                <input className={`w-full p-5 ${t.bg} rounded-3xl focus:outline-none font-bold text-lg`} placeholder="Event..." value={eventTitle} onChange={(e)=>setEventTitle(e.target.value)} />
                <div className="flex gap-4">
                  <input type="date" className={`flex-grow p-5 ${t.bg} rounded-3xl focus:outline-none font-bold`} value={eventDate} onChange={(e)=>setEventDate(e.target.value)} />
                  <button className={`${t.accent} text-white px-10 rounded-3xl font-black uppercase text-[12px] shadow-lg`}>SCHEDULE</button>
                </div>
              </form>
            )}
            {activeTab === 'expenses' && <ExpenseModule expenses={expenses} members={tripMembers} theme={t} onAdd={(exp: any) => handleUpdate('addExpense', exp)} />}
            
            <div className="mt-6">
              {activeTab === 'checklist' && <ChecklistModule items={items} categories={dbCategories} members={tripMembers} theme={t} onUpdate={handleUpdate} />}
              {activeTab === 'itinerary' && <ItineraryModule events={events} theme={t} onUpdate={handleUpdate} />}
              {activeTab === 'expenses' && <ExpenseList expenses={expenses} theme={t} onDelete={(id: string) => handleUpdate('deleteExpense', id)} />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}