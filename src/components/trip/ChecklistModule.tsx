'use client';
import { CheckCircle2, Circle, Trash2, ChevronDown, X } from 'lucide-react';

export default function ChecklistModule({ items, categories, members, theme, onUpdate }: any) {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {categories.map((cat: any) => {
        const catItems = items.filter((i: any) => i.category_name === cat.name);
        if (catItems.length === 0) return null;

        return (
          <div key={cat.id} className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] px-2 opacity-50 flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${theme.accent}`} /> {cat.name}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {catItems.map((item: any) => {
                const assignedHandles = item.claimed_by_name || [];
                const availableMembers = members.filter((m: any) => 
                  !assignedHandles.includes(m.user_email.split('@')[0])
                );

                return (
                  <div key={item.id} className={`${theme.card} p-5 rounded-[28px] border ${theme.border} flex items-center justify-between group hover:shadow-md transition-all`}>
                    <div className="flex items-center gap-4">
                      <button onClick={() => onUpdate('togglePacked', item)} className="transition-transform active:scale-90">
                        {item.is_packed ? <CheckCircle2 size={24} className={theme.accentText} /> : <Circle size={24} className="text-slate-200" />}
                      </button>
                      <span className={`font-bold text-sm ${item.is_packed ? 'line-through opacity-30' : ''}`}>{item.item_name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {assignedHandles.map((handle: string) => (
                          <button 
                            key={handle} 
                            onClick={() => onUpdate('assignItem', { item, handle })}
                            className={`w-8 h-8 rounded-full border-2 border-white ${theme.accent} flex items-center justify-center text-[8px] font-black text-white uppercase transition-all hover:bg-red-500 hover:scale-110 relative group/badge`}
                          >
                            <span className="group-hover/badge:hidden">{handle.substring(0, 2)}</span>
                            <X size={12} className="hidden group-hover/badge:block" />
                          </button>
                        ))}
                      </div>
                      
                      {availableMembers.length > 0 && (
                        <div className="relative">
                          <select 
                            className={`appearance-none p-2 pr-8 rounded-xl border ${theme.border} ${theme.bg} text-[10px] font-black uppercase focus:outline-none cursor-pointer hover:${theme.accentText}`}
                            value="" 
                            onChange={(e) => e.target.value && onUpdate('assignItem', { item, handle: e.target.value })}
                          >
                            <option value="" disabled>Assign...</option>
                            {availableMembers.map((m: any) => (
                              <option key={m.id} value={m.user_email.split('@')[0]}>{m.user_email.split('@')[0]}</option>
                            ))}
                          </select>
                          <ChevronDown size={10} className="absolute right-3 top-3 pointer-events-none opacity-30" />
                        </div>
                      )}
                      
                      <button onClick={() => onUpdate('deleteItem', item.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-200 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}