'use client';
import { History, PlusSquare, CheckCircle, UserPlus, Type, Clock } from 'lucide-react';

export default function ActivityFeed({ activities, theme }: { activities: any[], theme: any }) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'added': return <PlusSquare size={14} className="text-blue-500" />;
      case 'completed': return <CheckCircle size={14} className="text-green-500" />;
      case 'claimed': return <UserPlus size={14} className="text-purple-500" />;
      default: return <Type size={14} className={theme.accentText} />;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`${theme.card} p-6 rounded-[32px] border ${theme.border} shadow-sm`}>
      <div className="flex items-center gap-2 mb-6">
        <History size={20} className={theme.accentText} />
        <h3 className="text-sm font-black uppercase tracking-widest">Live Activity</h3>
      </div>

      <div className="space-y-6">
        {activities.length === 0 ? (
          <p className={`${theme.subtext} text-[10px] italic`}>No recent activity.</p>
        ) : (
          activities.map((log) => (
            <div key={log.id} className="flex gap-4 relative">
              <div className="flex flex-col items-center">
                <div className={`z-10 p-1 rounded-full ${theme.bg}`}>
                  {getActionIcon(log.action_type)}
                </div>
                <div className={`w-0.5 h-full absolute top-6 bg-slate-100`} />
              </div>
              <div className="pb-2">
                <p className="text-xs leading-relaxed">
                  <span className="font-black">{log.user_name || 'Someone'}</span>{' '}
                  <span className={theme.subtext}>{log.action_type}</span>{' '}
                  <span className="font-bold underline decoration-indigo-200 decoration-2">
                    {log.item_name}
                  </span>
                </p>
                <div className={`flex items-center gap-1 text-[9px] font-bold ${theme.subtext} mt-1 uppercase tracking-tighter`}>
                  <Clock size={10} /> {formatTimestamp(log.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}