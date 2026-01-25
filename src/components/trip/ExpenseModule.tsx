'use client';
import { useState } from 'react';
import { Users, DollarSign, Calendar, Plus, Check } from 'lucide-react';

export default function ExpenseModule({ members, theme, onAdd }: any) {
  // 1. Initial State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState('');
  const [splitWith, setSplitWith] = useState<string[]>([]);

  // Unique Color Palette for the 5 Families
  const palette = [
    'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-amber-500', 
    'bg-emerald-500', 'bg-fuchsia-500', 'bg-cyan-500', 'bg-orange-500'
  ];

  const getMemberColor = (handle: string) => {
    const index = members.findIndex((m: any) => m.user_email.split('@')[0] === handle);
    return palette[index % palette.length] || 'bg-slate-500';
  };

  const handleToggleSplit = (handle: string) => {
    setSplitWith(prev => 
      prev.includes(handle) ? prev.filter(h => h !== handle) : [...prev, handle]
    );
  };

  const handleSplitAll = () => {
    const allHandles = members.map((m: any) => m.user_email.split('@')[0]);
    setSplitWith(allHandles);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!description || !amount || !paidBy) return;

    // Constructs the precise payload for the orchestrator
    onAdd({
      description,
      amount: parseFloat(amount),
      expense_date: expenseDate,
      paid_by_email: paidBy,
      split_with: splitWith.length > 0 ? splitWith : null // Null implies "Everyone"
    });

    // Reset Form
    setDescription(''); setAmount(''); setSplitWith([]);
  };

  return (
    <form onSubmit={handleSubmit} className={`${theme.card} p-8 rounded-[40px] border ${theme.border} shadow-sm space-y-8 animate-in fade-in duration-500`}>
      
      {/* PRIMARY INPUTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Description</label>
          <input 
            className={`w-full p-5 ${theme.bg} rounded-3xl focus:outline-none font-bold text-lg`} 
            placeholder="e.g., Airbnb" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Amount</label>
          <div className="relative">
            <DollarSign className="absolute left-5 top-6 text-slate-300" size={20} />
            <input 
              type="number" 
              className={`w-full p-5 pl-12 ${theme.bg} rounded-3xl focus:outline-none font-bold text-lg`} 
              placeholder="0.00" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Expense Date</label>
          <div className="relative">
            <Calendar className="absolute left-5 top-6 text-slate-300" size={20} />
            <input 
              type="date" 
              className={`w-full p-5 pl-12 ${theme.bg} rounded-3xl focus:outline-none font-bold text-lg`} 
              value={expenseDate} 
              onChange={(e) => setExpenseDate(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* SPLITTING LOGIC */}
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Splitting Logic</p>
        <div className="flex flex-wrap gap-3">
          <button 
            type="button" 
            onClick={handleSplitAll}
            className={`px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] transition-all ${
              splitWith.length === members.length ? `${theme.accent} text-white` : `${theme.bg} ${theme.subtext}`
            }`}
          >
            <Users size={14} /> Split with All
          </button>
          
          {members.map((m: any) => {
            const handle = m.user_email.split('@')[0];
            const isActive = splitWith.includes(handle);
            return (
              <button 
                key={m.id} 
                type="button" 
                onClick={() => handleToggleSplit(handle)}
                className={`px-5 py-3 rounded-2xl border ${theme.border} flex items-center gap-2 font-black uppercase text-[10px] transition-all ${
                  isActive ? `${getMemberColor(handle)} text-white` : `${theme.card} text-slate-400`
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : getMemberColor(handle)}`} />
                {handle}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBMISSION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 border-t border-slate-50">
        <select 
          className={`p-4 rounded-2xl border ${theme.border} ${theme.bg} text-[11px] font-black uppercase focus:outline-none flex-grow md:max-w-xs cursor-pointer`}
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
        >
          <option value="">Who paid?</option>
          {members.map((m: any) => (
            <option key={m.id} value={m.user_email}>{m.user_email.split('@')[0].toUpperCase()}</option>
          ))}
        </select>

        <button 
          type="submit" 
          className={`${theme.accent} text-white px-12 py-4 rounded-3xl font-black uppercase text-[12px] shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2`}
        >
          <Plus size={18} /> Add to Ledger
        </button>
      </div>
    </form>
  );
}