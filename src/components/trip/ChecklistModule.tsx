'use client';
import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Trash2, ChevronDown, X, GripVertical } from 'lucide-react';

// --- Draggable Item Component ---
function DraggableItem({ item, getMemberColor, onUpdate, members, theme, onDragStart, onDragOver, onDrop, isDraggedOver }: any) {
  const [isDragging, setIsDragging] = useState(false);
  
  const assignedHandles = item.claimed_by_name || [];
  const availableMembers = members.filter((m: any) => 
    !assignedHandles.includes(m.user_email.split('@')[0])
  );

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', item.id);
    onDragStart(item.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    
    // Unlock scroll on drag end (in case drop wasn't triggered)
    if ((window as any).__scrollLock) {
      window.removeEventListener('scroll', (window as any).__scrollLock);
      delete (window as any).__scrollLock;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(item.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(item.id);
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`${theme.card} p-5 rounded-[28px] border ${isDraggedOver ? 'border-blue-400 border-2' : theme.border} flex items-center justify-between group hover:shadow-md transition-all mb-3 ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
          <GripVertical size={18} />
        </div>
        
        <button onClick={() => onUpdate('togglePacked', item)} className="transition-transform active:scale-90">
          {item.is_packed ? <CheckCircle2 size={24} className={theme.accentText} /> : <Circle size={24} className="text-slate-200" />}
        </button>
        <span className={`font-bold text-sm ${item.is_packed ? 'line-through opacity-30' : ''}`}>{item.item_name}</span>
      </div>

      <div className="flex items-center gap-3">
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

// --- Category Drop Zone ---
function CategoryDropZone({ category, theme, onDrop, onDragOver, isOver }: any) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(category.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(category.name);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`${theme.card} p-4 rounded-[20px] border-2 ${isOver ? 'border-blue-500 bg-blue-50' : 'border-dashed ' + theme.border} transition-all min-h-[60px] flex items-center justify-center`}
    >
      <p className={`text-[10px] font-black uppercase tracking-wider ${isOver ? 'text-blue-600' : theme.subtext}`}>
        Drop here
      </p>
    </div>
  );
}

// --- Main Module ---
export default function ChecklistModule({ items, categories, members, theme, onUpdate }: any) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overCategory, setOverCategory] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [localItems, setLocalItems] = useState(items);

  // Update local items when props change
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const palette = ['bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-amber-500', 'bg-emerald-500', 'bg-fuchsia-500'];

  const getMemberColor = (handle: string) => {
    const index = members.findIndex((m: any) => m.user_email.split('@')[0] === handle);
    return palette[index % palette.length] || 'bg-slate-500';
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
    setScrollPosition(window.pageYOffset);
    
    // Lock scroll position
    const lockScroll = () => {
      window.scrollTo(0, scrollPosition);
    };
    window.addEventListener('scroll', lockScroll);
    
    // Store cleanup function
    (window as any).__scrollLock = lockScroll;
  };

  const handleDragOver = (id: string) => {
    if (draggedId && draggedId !== id) {
      setOverId(id);
      setOverCategory(null);
    }
  };

  const handleCategoryDragOver = (categoryName: string) => {
    setOverCategory(categoryName);
    setOverId(null);
  };

  const handleDropOnItem = async (targetId: string) => {
    // Unlock scroll FIRST
    if ((window as any).__scrollLock) {
      window.removeEventListener('scroll', (window as any).__scrollLock);
      delete (window as any).__scrollLock;
    }
    
    if (draggedId && draggedId !== targetId) {
      const draggedItem = localItems.find((i: any) => i.id === draggedId);
      const targetItem = localItems.find((i: any) => i.id === targetId);
      
      if (draggedItem && targetItem && draggedItem.category_name !== targetItem.category_name) {
        // Update local state immediately for instant feedback
        const updatedItems = localItems.map((item: any) => 
          item.id === draggedId 
            ? { ...item, category_name: targetItem.category_name }
            : item
        );
        setLocalItems(updatedItems);
        
        // Update database
        await onUpdate('reorderItems', { activeId: draggedId, overId: targetId });
      }
    }
    
    setDraggedId(null);
    setOverId(null);
  };

  const handleDropOnCategory = async (categoryName: string) => {
    // Unlock scroll FIRST
    if ((window as any).__scrollLock) {
      window.removeEventListener('scroll', (window as any).__scrollLock);
      delete (window as any).__scrollLock;
    }
    
    if (draggedId) {
      const draggedItem = localItems.find((i: any) => i.id === draggedId);
      
      if (draggedItem && draggedItem.category_name !== categoryName) {
        // Update local state immediately
        const updatedItems = localItems.map((item: any) => 
          item.id === draggedId 
            ? { ...item, category_name: categoryName }
            : item
        );
        setLocalItems(updatedItems);
        
        // Update database
        await onUpdate('reorderItems', { activeId: draggedId, categoryName });
      }
    }
    
    setDraggedId(null);
    setOverCategory(null);
  };

  return (
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
                  <DraggableItem 
                    key={item.id} 
                    item={item} 
                    members={members} 
                    getMemberColor={getMemberColor} 
                    theme={theme} 
                    onUpdate={onUpdate}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDropOnItem}
                    isDraggedOver={overId === item.id}
                  />
                ))}
              </div>
            ) : (
              <CategoryDropZone 
                category={cat}
                theme={theme}
                onDrop={handleDropOnCategory}
                onDragOver={handleCategoryDragOver}
                isOver={overCategory === cat.name}
              />
            )}
            
            {/* Always show drop zone when dragging */}
            {draggedId && catItems.length > 0 && (
              <div>
                <CategoryDropZone 
                  category={cat}
                  theme={theme}
                  onDrop={handleDropOnCategory}
                  onDragOver={handleCategoryDragOver}
                  isOver={overCategory === cat.name}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}