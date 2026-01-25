'use client';
import { ArrowRightLeft, User, Trash2, Users, Calendar } from 'lucide-react';

export default function ExpenseList({ expenses, theme, onDelete }: any) {
  if (!expenses || expenses.length === 0) {
    return (
      <div className={`${theme.card} p-12 rounded-[40px] border ${theme.border} text-center mt-8 animate-in fade-in`}>
        <p className={`${theme.subtext} font-black uppercase text-[10px] tracking-widest`}>
          No transactions recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <ArrowRightLeft size={14} className={theme.accentText} /> Transaction History
        </h3>
      </div>

      <div className="space-y-3">
        {expenses.map((exp: any) => (
          <div key={exp.id} className={`${theme.card} p-6 rounded-[32px] border ${theme.border} flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all group`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${theme.bg} flex items-center justify-center text-slate-400 group-hover:${theme.accentText} transition-colors`}>
                <User size={20} />
              </div>
              <div>
                <p className="font-black text-sm capitalize">{exp.description}</p>
                <div className="flex flex-col gap-1 mt-1">
                  <span className={`${theme.subtext} text-[9px] font-black uppercase flex items-center gap-1`}>
                    <User size={10} className="text-emerald-500" /> Paid by {exp.paid_by_name}
                  </span>
                  <span className={`${theme.subtext} text-[9px] font-black uppercase flex items-center gap-1`}>
                    <Users size={10} className="text-blue-500" /> 
                    {/* Explicitly naming participants */}
                    Split with: {exp.split_with && exp.split_with.length > 0 ? exp.split_with.join(', ') : 'Everyone'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-4 md:pt-0">
              <div className="text-right">
                <p className="font-black text-lg tracking-tight text-slate-900">$ {parseFloat(exp.amount).toFixed(2)}</p>
                <div className="flex items-center justify-end gap-1 text-slate-400">
                  <Calendar size={10} />
                  <p className="text-[8px] font-bold uppercase">{new Date(exp.expense_date || exp.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => onDelete(exp.id)} className="p-3 rounded-xl hover:bg-red-50 hover:text-red-500 text-slate-200 transition-all">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}