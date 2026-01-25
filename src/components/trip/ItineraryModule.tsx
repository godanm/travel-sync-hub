'use client';
import { Clock, Trash2 } from 'lucide-react';

export default function ItineraryModule({ events, theme, onUpdate }: any) {
  return (
    <div className={`relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-0.5 before:${theme.border.replace('border', 'bg')}`}>
      {events.map((event: any) => (
        <div key={event.id} className="relative">
          <div className={`absolute -left-[32px] top-1.5 w-6 h-6 ${theme.card} border-4 ${theme.accentText.replace('text', 'border')} rounded-full shadow-sm`} />
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme.accentText}`}>
                {new Date(event.event_date + 'T00:00:00').toLocaleDateString()}
              </p>
              <h4 className="text-xl font-black mt-1 flex items-center gap-2">
                <Clock size={18} className={theme.subtext} /> {event.title}
              </h4>
            </div>
            <button onClick={() => onUpdate('deleteEvent', event.id)} className={`${theme.subtext} hover:text-red-500`}>
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}