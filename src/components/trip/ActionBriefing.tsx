'use client';
import { X, Target, CheckCircle2, Circle } from 'lucide-react';

export default function ActionBriefing({ isOpen, onClose, items, user, theme }: any) {
  if (!isOpen) return null;

  const handle = user?.email?.split('@')[0];
  const myItems = items.filter((i: any) => i.claimed_by_name?.includes(handle));

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`${theme.card} w-full max-w-2xl rounded-[40px] border ${theme.border} shadow-2xl overflow-hidden flex flex-col`}>
        <div className="p-8 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Target className={theme.accentText} size={24}/>
            <h2 className="text-2xl font-black uppercase tracking-tight">Action Briefing</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
        </div>
        <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
          {myItems.length === 0 ? (
            <div className="text-center py-12"><p className={theme.subtext}>No items assigned yet.</p></div>
          ) : (
            myItems.map((item: any) => (
              <div key={item.id} className={`flex items-center justify-between p-6 ${theme.bg} rounded-[28px] border ${theme.border}`}>
                <div className="flex items-center gap-4">
                  {item.is_packed ? <CheckCircle2 className="text-green-500" size={18}/> : <Circle className="text-slate-400" size={18}/>}
                  <span className="font-black uppercase text-xs">{item.item_name}</span>
                </div>
                <span className="text-[8px] font-black px-3 py-1 bg-white rounded-full border border-slate-200 uppercase tracking-widest">{item.category_name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}