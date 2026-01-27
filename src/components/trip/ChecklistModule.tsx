'use client';
import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Trash2, ChevronDown, X, MousePointer2 } from 'lucide-react';

// --- Context Menu Component ---
function ContextMenu({ item, categories, x, y, onClose, onMoveToCategory, theme }: any) {
  useEffect(() => {
    const handleClick = () => onClose();
    const handleScroll = () => onClose();
    
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [onClose]);

  return (
    <div 
      className={`fixed ${theme.card} border ${theme.border} rounded-2xl shadow-2xl py-2 z-50 min-w-[200px]`}
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-2 border-b border-slate-200">
        <p className="text-[9px] font-black uppercase tracking-wider opacity-50">Move to Category</p>
      </div>
      <div className="py-1 max-h-[300px] overflow-y-auto">
        {categories.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => onMoveToCategory(item.id, cat.name)}
            disabled={item.category_name === cat.name}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
              item.category_name === cat.name 
                ? 'opacity-40 cursor-not-allowed' 
                : `hover:${theme.categoryBg} cursor-pointer`
            }`}
          >
            <span className={item.category_name === cat.name ? 'font-bold' : ''}>
              {cat.name}
            </span>
            {item.category_name === cat.name && (
              <span className="ml-2 text-xs opacity-50">✓ current</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Checklist Item Component ---
function ChecklistItem({ item, getMemberColor, onUpdate, members, theme, onContextMenu, onMoveClick }: any) {
  const assignedHandles = item.claimed_by_name || [];
  const availableMembers = members.filter((m: any) => 
    !assignedHandles.includes(m.user_email.split('@')[0])
  );

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(item, e.clientX, e.clientY);
  };

  const handleMoveClick = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    onMoveClick(item, rect.right + 10, rect.top);
  };

  return (
    <div 
      onContextMenu={handleContextMenu}
      className={`${theme.card} p-5 rounded-[28px] border ${theme.border} flex items-center justify-between group hover:shadow-md transition-all mb-3`}
    >
      <div className="flex items-center gap-4">
        <button onClick={() => onUpdate('togglePacked', item)} className="transition-transform active:scale-90">
          {item.is_packed ? <CheckCircle2 size={24} className={theme.accentText} /> : <Circle size={24} className="text-slate-200" />}
        </button>
        <span className={`font-bold text-sm ${item.is_packed ? 'line-through opacity-30' : ''}`}>{item.item_name}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Move Button - Always Visible on Mobile, Hidden on Desktop */}
        <button 
          onClick={handleMoveClick}
          className={`md:opacity-0 md:group-hover:opacity-100 p-2 ${theme.accent} text-white rounded-xl text-[9px] font-black uppercase transition-all hover:scale-105`}
          title="Move to category"
        >
          Move
        </button>

        <div className="flex -space-x-2">
          {assignedHandles.map((handle: string) => (
            <button 
              key={handle} title={handle}
              onClick={() => onUpdate('assignItem', { item, handle })}
              className={`w-8 h-8 rounded-full border-2 border-white ${getMemberColor(handle)} flex items-center justify-center text-[8px] font-black text-white uppercase transition-all hover:bg-red-500 hover:scale-110 relative group/badge shadow-sm`}
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
}

// --- Empty Category Placeholder ---
function EmptyCategory({ categoryName, theme }: any) {
  return (
    <div className={`${theme.card} p-6 rounded-[20px] border-2 border-dashed ${theme.border} transition-all min-h-[80px] flex items-center justify-center opacity-50`}>
      <p className={`text-[10px] font-black uppercase tracking-wider ${theme.subtext}`}>
        No items yet
      </p>
    </div>
  );
}

// --- Main Module ---
export default function ChecklistModule({ items, categories, members, theme, onUpdate }: any) {
  const [localItems, setLocalItems] = useState(items);
  const [contextMenu, setContextMenu] = useState<{ item: any; x: number; y: number } | null>(null);

  // Update local items when props change
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const palette = ['bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-amber-500', 'bg-emerald-500', 'bg-fuchsia-500'];

  const getMemberColor = (handle: string) => {
    const index = members.findIndex((m: any) => m.user_email.split('@')[0] === handle);
    return palette[index % palette.length] || 'bg-slate-500';
  };

  const handleContextMenu = (item: any, x: number, y: number) => {
    setContextMenu({ item, x, y });
  };

  const handleMoveToCategory = async (itemId: string, categoryName: string) => {
    const item = localItems.find((i: any) => i.id === itemId);
    
    if (item && item.category_name !== categoryName) {
      // Update local state immediately
      const updatedItems = localItems.map((i: any) => 
        i.id === itemId 
          ? { ...i, category_name: categoryName }
          : i
      );
      setLocalItems(updatedItems);
      
      // Update database
      await onUpdate('reorderItems', { activeId: itemId, categoryName });
    }
    
    setContextMenu(null);
  };

  return (
    <>
      {/* Instruction Banner */}
      <div className={`${theme.card} p-4 rounded-[24px] border ${theme.border} mb-6 flex items-center gap-3 shadow-sm`}>
        <div className={`p-2 rounded-full ${theme.accent}`}>
          <MousePointer2 size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold">Move items between categories</p>
          <p className="text-xs opacity-60 hidden md:block">Right-click any item or click the Move button</p>
          <p className="text-xs opacity-60 md:hidden">Click the Move button on any item</p>
        </div>
      </div>

      <div className="space-y-12 animate-in fade-in duration-700">
        {categories.map((cat: any) => {
          const catItems = localItems.filter((i: any) => i.category_name === cat.name);

          return (
            <div key={cat.id} className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] px-2 opacity-50 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${theme.accent}`} /> {cat.name}
              </h3>
              
              {catItems.length > 0 ? (
                <div className="grid grid-cols-1">
                  {catItems.map((item: any) => (
                    <ChecklistItem 
                      key={item.id} 
                      item={item} 
                      members={members} 
                      getMemberColor={getMemberColor} 
                      theme={theme} 
                      onUpdate={onUpdate}
                      onContextMenu={handleContextMenu}
                      onMoveClick={handleContextMenu}
                    />
                  ))}
                </div>
              ) : (
                <EmptyCategory 
                  categoryName={cat.name}
                  theme={theme}
                />
              )}
            </div>
          );
        })}
      </div>

      {contextMenu && (
        <ContextMenu
          item={contextMenu.item}
          categories={categories}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onMoveToCategory={handleMoveToCategory}
          theme={theme}
        />
      )}
    </>
  );
}