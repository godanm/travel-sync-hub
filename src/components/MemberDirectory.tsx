'use client';
import { Users, Crown, Mail } from 'lucide-react';

// Added '?' to invitations to make it optional and prevent the 'undefined' error
export default function MemberDirectory({ members, invitations, theme }: { members: any[], invitations?: any[], theme: any }) {
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
                  <p className="text-sm font-bold capitalize">
                    {member.family_name || member.user_email?.split('@')[0]}
                  </p>
                  {member.status === 'Owner' && (
                    <div className="group/lead relative">
                      <Crown size={14} className="text-amber-500 fill-amber-500" />
                    </div>
                  )}
                </div>
                <p className={`${theme.subtext} text-[10px] font-medium`}>{member.user_email}</p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Safe check: will not crash if invitations is undefined */}
        {invitations && invitations.length > 0 && (
          <div className={`mt-6 pt-6 border-t ${theme.border} space-y-3`}>
             <p className={`${theme.subtext} text-[9px] font-black uppercase tracking-widest`}>Pending tokens</p>
             {invitations.map((invite) => (
               <div key={invite.id} className="flex items-center gap-2 opacity-50">
                 <Mail size={12} className={theme.subtext} />
                 <p className="text-[10px] font-bold">...{invite.token.slice(-4)}</p>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}