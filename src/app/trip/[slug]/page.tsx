'use client';

// GLOBAL TYPE DEFINITION: Resolves Vercel build errors for AdSense
declare global { interface Window { adsbygoogle: any[]; } }

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  Target, Sun, Moon, Waves, TreePine, Loader2, 
  Link as LinkIcon, FileDown, ArrowLeft, LogOut, 
  User as UserIcon, X, Users, MessageSquare
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
import ChatModule from '@/components/trip/ChatModule'; //

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

  // NEW: Overlay Control States
  const [showInvite, setShowInvite] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
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
      // Replace brackets with clear, word-based statuses
      const status = item.is_packed ? 'Completed' : 'Pending'; 
      const assignedTo = item.claimed_by_name && item.claimed_by_name.length > 0 
        ? item.claimed_by_name.join(', ') 
        : '-';
      
      return [item.item_name, assignedTo, status];
    });

    autoTable(doc, {
      startY: yPos,
      // Added "Status" as the first column header
      head: [['Item', 'Assigned To','Status']], 
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
        0: { cellWidth: 75, halign: 'left' },
        1: { cellWidth: 75 },
        2: { cellWidth: 30 }
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
      instructions.push([debtors[i][0], '--->', creditors[j][0], `$${amount.toFixed(2)}`]);
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
    <main className={`min-h-screen ${t.bg} ${t.text} transition-colors duration-500 pb-24 md:pb-0`}>
{/* UTILITY HEADER: Breadcrumb, Themes, & Profile */}
<div className={`${t.bg} border-b ${t.border} px-4 md:px-16 py-3 flex items-center justify-between`}>
  <Link href="/" className={`${t.subtext} flex items-center gap-2 font-black text-[9px] uppercase hover:${t.accentText} transition-colors`}>
    <ArrowLeft size={16} /> Dashboard
  </Link>
  <div></div>
  <div></div>
  <div></div>
  <div></div>
  <div></div>


   {/* 5. MOBILE UTILITY BAR: Floating at bottom */}
   <div className="flex flex-row items-center justify-center gap-1 mb-8 p-2 bg-white/60 backdrop-blur-xl border border-white/40 rounded-[40px] shadow-sm max-w-fit mx-auto">
      <NavButton 
    icon={<LinkIcon size={18}/>} 
    label="Invite" 
    onClick={() => setShowInvite(true)} 
    iconColor="text-blue-500" 
    bgColor="bg-blue-50/80" 
  />
  
  <NavButton 
    icon={<Users size={18}/>} 
    label="Team" 
    onClick={() => setShowDirectory(true)} 
    iconColor="text-red-600" 
    bgColor="bg-red-100/60" 
  />
  
  <NavButton 
    icon={<Target size={18}/>} 
    label="Logs" 
    onClick={() => setShowActivity(true)} 
    iconColor="text-green-700" 
    bgColor="bg-green-200/40" 
  />
  <NavButton 
    icon={<MessageSquare size={18}/>} 
    label="Chat" 
    onClick={() => setShowChat(!showChat)} 
    iconColor="text-orange-500" 
    bgColor="bg-orange-50/80" 
  />
      </div>
  <div className="flex items-center gap-6">
    {/* Theme Toggle Section */}
    <div className={`${t.card} px-3 py-1.5 rounded-xl flex items-center gap-3 border ${t.border}`}>
      <button onClick={() => handleThemeChange('classic')} className={`p-1.5 rounded-lg transition-all ${currentTheme === 'classic' ? t.accent + ' text-white' : t.subtext}`}><Sun size={14}/></button>
      <button onClick={() => handleThemeChange('midnight')} className={`p-1.5 rounded-lg transition-all ${currentTheme === 'midnight' ? t.accent + ' text-white' : t.subtext}`}><Moon size={14}/></button>
      <button onClick={() => handleThemeChange('ocean')} className={`p-1.5 rounded-lg transition-all ${currentTheme === 'ocean' ? t.accent + ' text-white' : t.subtext}`}><Waves size={14}/></button>
      <button onClick={() => handleThemeChange('forest')} className={`p-1.5 rounded-lg transition-all ${currentTheme === 'forest' ? t.accent + ' text-white' : t.subtext}`}><TreePine size={14}/></button>
    </div>

    {/* RESTORED: Profile Display */}
    <div className="flex items-center gap-2 px-4 border-l border-slate-100">
      <UserIcon size={14} className={t.accentText} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">
        {user?.email?.split('@')[0]}
      </p>
    </div>

    {/* RESTORED: Logout Button */}
    <button 
      onClick={() => supabase.auth.signOut()} 
      className={`${t.subtext} flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors`}
    >
      Logout <LogOut size={14} />
    </button>
  </div>
</div>
      {/* 2. STICKY DASHBOARD NAV */}
      <nav className={`sticky top-0 z-40 ${t.card} border-b ${t.border} pt-8 pb-0 px-4 md:px-12 shadow-sm`}>
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-8">
            {(['checklist', 'itinerary', 'expenses'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 px-2 font-black text-[11px] uppercase tracking-[0.15em] relative transition-all ${activeTab === tab ? `${t.accentText}` : 'text-slate-400 hover:text-slate-600'}`}>
                {tab}
                {activeTab === tab && <div className={`absolute bottom-0 left-0 right-0 h-1 ${t.accent} rounded-t-full`} />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 pb-4">
            <button onClick={downloadTripSummary} className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-black uppercase text-[8px] shadow-lg"><FileDown size={12}/> SUMMARY</button>
            <button onClick={() => setIsBriefingOpen(true)} className={`${t.accent} text-white px-4 py-2 rounded-xl flex items-center gap-2 font-black uppercase text-[8px] shadow-xl`}><Target size={12}/> BRIEFING</button>
          </div>
        </div>
      </nav>

      {/* 3. FULL-WIDTH CONTENT AREA */}
      <div className="max-w-[1440px] mx-auto p-4 md:p-12">
        <ActionBriefing isOpen={isBriefingOpen} onClose={() => setIsBriefingOpen(false)} items={items} user={user} theme={t} />

        <div className="w-full space-y-10">
          {/* Add Item Form (Now spans full width) */}
          {activeTab === 'checklist' && (
  <div className="flex justify-center w-full px-2">
    <form onSubmit={async (e) => {
      e.preventDefault(); if(!newItem) return;
      const { data } = await supabase.from('checklist_items').insert([{ item_name: newItem, trip_slug: slug, category_name: selectedCategory }]).select().single();
      if(data) { logAction('added', newItem); setNewItem(''); }
    }} className={`${t.card} p-2 md:p-3 rounded-[40px] border ${t.border} mb-8 shadow-sm flex items-center gap-2 md:gap-3 w-full max-w-4xl relative overflow-hidden`}>
      
      {/* 1. ADAPTIVE SELECTOR: Hidden on very small screens or shrunk */}
      <select 
        value={selectedCategory} 
        onChange={(e) => setSelectedCategory(e.target.value)}
        className={`${t.bg} px-3 md:px-6 py-2 md:py-3 rounded-[20px] md:rounded-[30px] text-[8px] md:text-[10px] font-black uppercase tracking-widest ${t.subtext} outline-none cursor-pointer border-none max-w-[70px] md:max-w-none`}
      >
          {dbCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
      </select>

      {/* 2. FLEXIBLE INPUT: min-w-0 is the critical fix for boundaries */}
      <input 
        className="flex-1 min-w-0 p-3 bg-transparent focus:outline-none font-bold text-sm md:text-base placeholder:text-slate-200" 
        placeholder="Add expedition item..." 
        value={newItem} 
        onChange={(e) => setNewItem(e.target.value)} 
      />
      
      {/* 3. PINNED BUTTON: whitespace-nowrap prevents text wrapping */}
      <button 
        type="submit"
        className={`${t.accent} text-white px-6 md:px-10 py-3 md:py-4 rounded-[30px] font-black uppercase text-[9px] md:text-[10px] whitespace-nowrap transition-transform active:scale-95`}
      >
        ADD
      </button>
    </form>
  </div>
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

          
          <div className="w-full overflow-hidden">
            {activeTab === 'checklist' && <ChecklistModule items={items} categories={dbCategories} members={tripMembers} theme={t} onUpdate={handleUpdate} />}
            {activeTab === 'itinerary' && <ItineraryModule events={events} theme={t} onUpdate={handleUpdate} />}
            {activeTab === 'expenses' && <ExpenseList expenses={expenses} theme={t} onDelete={(id: string) => handleUpdate('deleteExpense', id)} />}
          </div>
        </div>
      </div>
{/* CHAT OVERLAY: Ensure this is NOT inside another {activeTab === ...} block */}
{showChat && (
  <div className="fixed inset-0 m-auto z-[70] w-[450px] h-fit animate-in fade-in zoom-in-95 duration-300">
    <ChatModule 
      slug={slug} 
      user={user} 
      theme={t} 
      onClose={() => setShowChat(false)} 
    />
  </div>
)}
      {/* 4. MODAL OVERLAYS (Invite, Directory, Activity) */}
      <Overlay isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Link" theme={t}>
        <div className="flex flex-col gap-4">
          <p className="text-[10px] text-slate-400 uppercase font-black">Share with your group</p>
          <div className="flex items-center justify-between gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <span className="truncate text-xs font-mono">{window.location.origin}/join/{tripData?.share_token}</span>
             <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join/${tripData.share_token}`); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className={`${t.accent} text-white px-4 py-2 rounded-xl text-[9px] font-black`}>{copied ? 'COPIED' : 'COPY'}</button>
          </div>
        </div>
      </Overlay>

      <Overlay isOpen={showDirectory} onClose={() => setShowDirectory(false)} title="Group Directory" theme={t}>
        <MemberDirectory members={tripMembers} theme={t} isOwner={isOwner} tripSlug={slug as string} onMemberRemoved={loadInitialData} logAction={() => {}} />
      </Overlay>

      <Overlay isOpen={showActivity} onClose={() => setShowActivity(false)} title="Live Activity" theme={t}>
        <ActivityFeed activities={activities} theme={t} />
      </Overlay>

     
    </main>
  );
}

// Sub-components for UI Cleanliness
function Overlay({ isOpen, onClose, title, children, theme }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`${theme.card} w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border ${theme.border} animate-in zoom-in-95 duration-300`}>
        <div className="flex items-center justify-between p-8 border-b border-slate-50">
          <h2 className="text-[12px] font-black uppercase tracking-widest">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-300"><X size={20}/></button>
        </div>
        <div className="p-8 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function NavButton({ icon, label, onClick, iconColor, bgColor }: any) {
  return (
    <button 
      onClick={onClick} 
      className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-[24px] hover:bg-slate-50 transition-all group"
    >
      {/* Fancy Icon Container: Added background glaze and scale effect */}
      <div className={`p-3 rounded-2xl ${bgColor} ${iconColor} transition-all group-hover:scale-110 group-active:scale-95 shadow-sm`}>
        {icon}
      </div>
      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest group-hover:text-slate-600 transition-colors">
        {label}
      </span>
    </button>
  );
}