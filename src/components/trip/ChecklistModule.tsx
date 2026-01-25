'use client';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  CheckCircle2, Circle, GripVertical, DollarSign, 
  UserPlus, Trash2, Tag 
} from 'lucide-react';

export default function ChecklistModule({ items, categories, members, theme, onUpdate, logAction }: any) {
  const [claimingId, setClaimingId] = useState<string | null>(null);

  return (
    <DragDropContext onDragEnd={(result) => onUpdate('move', result)}>
      <div className="space-y-12">
        {categories.map((category: any) => (
          <Droppable key={category.id} droppableId={category.name}>
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${theme.categoryBg} mb-4`}>
                  <Tag size={12} className={theme.accentText} />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">{category.name}</h3>
                </div>
                <div className="space-y-3">
                  {items.filter((i: any) => i.category_name === category.name).map((item: any, index: number) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} 
                             className={`${theme.card} p-5 rounded-3xl border ${theme.border} shadow-sm flex flex-col hover:shadow-md transition-shadow`}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className={theme.subtext}><GripVertical size={20} /></div>
                              <button onClick={() => onUpdate('togglePacked', item)}>
                                {item.is_packed ? <CheckCircle2 className="text-green-500" size={24} /> : <Circle className={theme.subtext} size={24} />}
                              </button>
                              <p className={`font-bold ${item.is_packed ? `line-through ${theme.subtext}` : ''}`}>{item.item_name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className={theme.subtext}><DollarSign size={18} /></button>
                              
                              {/* RESTORED: Assign Functionality */}
                              <button 
                                onClick={() => setClaimingId(claimingId === item.id ? null : item.id)} 
                                className={`${claimingId === item.id ? theme.accentText : theme.subtext}`}
                              >
                                <UserPlus size={18} />
                              </button>

                              {/* RESTORED: Delete Functionality */}
                              <button 
                                onClick={() => onUpdate('deleteItem', item.id)} 
                                className={`${theme.subtext} hover:text-red-500 transition-colors`}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          {/* RESTORED: Assignment Tray */}
                          {claimingId === item.id && (
                            <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 animate-in slide-in-from-top-2">
                              {members.map((member: any) => {
                                const handle = member.user_email?.split('@')[0];
                                const isClaimed = item.claimed_by_name?.includes(handle);
                                return (
                                  <button 
                                    key={member.id} 
                                    onClick={() => onUpdate('claimItem', { item, handle })}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${isClaimed ? `${theme.accent} text-white` : `${theme.bg} ${theme.subtext}`}`}
                                  >
                                    {handle}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}