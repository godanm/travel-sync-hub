'use client';
import { useState, useMemo } from 'react';
import { DollarSign, Users, Calendar, CheckSquare, Square } from 'lucide-react';

export default function ExpenseModule({ expenses, members, theme, onAdd }: any) {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [splitWith, setSplitWith] = useState<string[]>([]);
  const [isGlobalSplit, setIsGlobalSplit] = useState(true);

  // Settlement Calculation
  const balances = useMemo(() => {
    const totals: Record<string, number> = {};
    members.forEach((m: any) => totals[m.user_email.split('@')[0]] = 0);
    expenses.forEach((exp: any) => {
      const payer = exp.paid_by_name;
      const amountVal = parseFloat(exp.amount);
      const targets = (exp.split_with && exp.split_with.length > 0) 
        ? exp.split_with : members.map((m: any) => m.user_email.split('@')[0]);
      const share = amountVal / targets.length;
      if (totals[payer] !== undefined) totals[payer] += amountVal;
      targets.forEach((handle: string) => { if (totals[handle] !== undefined) totals[handle] -= share; });
    });
    return totals;
  }, [expenses, members]);

  const toggleMember = (handle: string) => {
    setSplitWith(prev => prev.includes(handle) ? prev.filter(h => h !== handle) : [...prev, handle]);
    setIsGlobalSplit(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <form onSubmit={(e) => {
        e.preventDefault();
        if(!desc || !amount || !paidBy) return;
        onAdd({ 
          description: desc, amount: parseFloat(amount), 
          paid_by_email: paidBy, expense_date: expenseDate, // CAPTURES DATE
          split_with: isGlobalSplit ? [] : splitWith 
        });
        setDesc(''); setAmount(''); setExpenseDate(new Date().toISOString().split('T')[0]);
      }} className={`${theme.card} p-8 rounded-[40px] border ${theme.border} shadow-sm space-y-6`}>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className={`p-4 ${theme.bg} rounded-2xl focus:outline-none font-bold`} placeholder="Description..." value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="relative">
            <DollarSign className="absolute left-4 top-4 text-slate-400" size={20} />
            <input type="number" step="0.01" className={`w-full p-4 pl-12 ${theme.bg} rounded-2xl focus:outline-none font-bold`} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          {/* DATE PICKER FIELD */}
          <div className="relative">
            <Calendar className="absolute left-4 top-4 text-slate-400" size={20} />
            <input type="date" className={`w-full p-4 pl-12 ${theme.bg} rounded-2xl focus:outline-none font-bold text-[10px] uppercase`} value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest px-2">Splitting Logic</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => { setIsGlobalSplit(true); setSplitWith([]); }} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all flex items-center gap-2 ${isGlobalSplit ? theme.accent + ' text-white' : `${theme.bg} ${theme.subtext}`}`}>
              <Users size={14}/> Split with All
            </button>
            {members.map((m: any) => {
              const handle = m.user_email.split('@')[0];
              const isSelected = splitWith.includes(handle);
              return (
                <button key={m.id} type="button" onClick={() => toggleMember(handle)} className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all flex items-center gap-2 ${isSelected && !isGlobalSplit ? theme.accent + ' text-white' : `${theme.bg} ${theme.subtext}`}`}>
                  {isSelected && !isGlobalSplit ? <CheckSquare size={14}/> : <Square size={14}/>} {handle}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-4">
          <select className={`flex-grow p-4 ${theme.bg} rounded-2xl font-black text-[10px] uppercase`} value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            <option value="">Who Paid?</option>
            {members.map((m: any) => <option key={m.id} value={m.user_email}>{m.user_email.split('@')[0]}</option>)}
          </select>
          <button className={`${theme.accent} text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px]`}>Add to Ledger</button>
        </div>
      </form>

      {/* Real-time Balances Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(balances).map(([name, bal]: [string, any]) => (
          <div key={name} className={`${theme.card} p-6 rounded-[28px] border ${theme.border} flex justify-between items-center shadow-sm`}>
            <p className="font-black uppercase text-xs">{name}</p>
            <p className={`font-black text-sm ${bal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {bal >= 0 ? `+ $${bal.toFixed(2)}` : `- $${Math.abs(bal).toFixed(2)}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}