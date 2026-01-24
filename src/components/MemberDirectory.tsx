'use client';
import { Users, Crown, UserMinus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function MemberDirectory({ 
  members, 
  theme, 
  isOwner, 
  tripSlug, 
  onMemberRemoved,
  logAction // Added prop to trigger the feed update
}: { 
  members: any[], 
  theme: any, 
  isOwner: boolean, 
  tripSlug: string,
  onMemberRemoved: () => void,
  logAction: (action: string, itemName: string, target?: string) => void
}) {

  const handleRemoveMember = async (email: string) => {
    const targetName = email.split('@')[0];
    if (!window.confirm(`Remove ${targetName} from this expedition?`)) return;

    const { error } = await supabase
      .from('trip_members')
      .delete()
      .eq('trip_slug', tripSlug)
      .eq('user_email', email);

    if (!error) {
      // 1. Record the action in the Live Activity Feed
      logAction('removed', 'from the group', targetName);
      
      // 2. Refresh the local directory list
      onMemberRemoved();
    }
  };

  return (
    <div className={`${theme.card} p-6 rounded-[32px] border ${theme.border} shadow-sm`}>
      <div className="flex items-center gap-2 mb-6">
        <Users size={20} className={theme.accentText} />
        <h3 className="text-sm font-black uppercase tracking-widest">Group Directory</h3>
      </div>
      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${theme.bg} flex items-center justify-center border ${theme.border}`}>
                <span className="text-xs font-black uppercase">{member.user_email?.[0]}</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold capitalize">{member.family_name || member.user_email?.split('@')[0]}</p>
                  {member.status === 'Owner' && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                </div>
                <p className={`${theme.subtext} text-[10px] font-medium`}>{member.user_email}</p>
              </div>
            </div>
            {isOwner && member.status !== 'Owner' && (
              <button onClick={() => handleRemoveMember(member.user_email)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all">
                <UserMinus size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}