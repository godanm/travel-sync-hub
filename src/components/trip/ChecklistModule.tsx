'use client';
import { useState } from 'react';
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, 
  useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects 
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle2, Circle, Trash2, ChevronDown, X, GripVertical } from 'lucide-react';

// --- Sortable Item Wrapper ---
function SortableItem({ item, getMemberColor, onUpdate, members, theme }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignedHandles = item.claimed_by_name || [];
  const availableMembers = members.filter((m: any) => 
    !assignedHandles.includes(m.user_email.split('@')[0])
  );

  return (
    <div 
      ref={setNodeRef} style={style}
      className={`${theme.card} p-5 rounded-[28px] border ${theme.border} flex items-center justify-between group hover:shadow-md transition-all mb-3`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
          <GripVertical size={18} />
        </button>
        
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

// --- Main Module ---
export default function ChecklistModule({ items, categories, members, theme, onUpdate }: any) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const palette = ['bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-amber-500', 'bg-emerald-500', 'bg-fuchsia-500'];

  const getMemberColor = (handle: string) => {
    const index = members.findIndex((m: any) => m.user_email.split('@')[0] === handle);
    return palette[index % palette.length] || 'bg-slate-500';
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      onUpdate('reorderItems', { activeId: active.id, overId: over.id });
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-12 animate-in fade-in duration-700">
        {categories.map((cat: any) => {
          const catItems = items.filter((i: any) => i.category_name === cat.name);
          if (catItems.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] px-2 opacity-50 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${theme.accent}`} /> {cat.name}
              </h3>
              <SortableContext items={catItems.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1">
                  {catItems.map((item: any) => (
                    <SortableItem 
                      key={item.id} 
                      item={item} 
                      members={members} 
                      getMemberColor={getMemberColor} 
                      theme={theme} 
                      onUpdate={onUpdate} 
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
}