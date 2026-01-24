'use client';
import { Users, Mail, Clock, CheckCircle2 } from 'lucide-react';

export default function MemberDirectory({ members, invitations, theme }: { members: any[], invitations: any[], theme: any }) {
  return (
    <aside className={`${theme.card} p-6 rounded-[32px] border ${theme.border} shadow-sm h-fit sticky top-8`}>
      <div className="flex items-center gap-2 mb-6">
        <Users size={20} className={theme.accentText} />
        <h3 className="text-sm font-black uppercase tracking-widest">Group Directory</h3>
      </div>

      <div className="space-y-6">
        {/* Joined Members Section */}
        <div>
          <p className={`${theme.subtext} text-[10px] font-black uppercase tracking-widest mb-3`}>Joined</p>
          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-[10px] italic opacity-50">No members yet.</p>
            ) : (
              members.map((member) => (
                <div key={member.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${theme.bg} flex items-center justify-center font-black text-[10px] ${theme.accentText}`}>
                      {member.family_name?.charAt(0) || member.user_email?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold">{member.family_name || member.user_email}</span>
                  </div>
                  <CheckCircle2 size={14} className="text-green-500" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Invites Section */}
        {invitations.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <p className={`${theme.subtext} text-[10px] font-black uppercase tracking-widest mb-3`}>Pending Invites</p>
            <div className="space-y-3">
              {invitations.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <Clock size={12} className="text-slate-400" />
                    </div>
                    <span className="text-xs font-medium italic">Waiting for response...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}