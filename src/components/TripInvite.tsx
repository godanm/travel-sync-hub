'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Send, Copy, Check, Loader2 } from 'lucide-react';

export default function TripInvite({ slug, theme }: { slug: string, theme: any }) {
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateInvite = async () => {
    setLoading(true);
    // As a group owner, you're generating a token linked to this trip slug
    const { data, error } = await supabase
      .from('invitations')
      .insert([{ trip_slug: slug }])
      .select()
      .single();

    if (data) {
      const url = `${window.location.origin}/join/${data.token}`;
      setInviteLink(url);
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`${theme.card} p-6 rounded-[32px] border ${theme.border} mb-8 shadow-sm`}>
      <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
        <Send size={16} className={theme.accentText} /> Group Invitation
      </h3>
      
      {!inviteLink ? (
        <button 
          onClick={generateInvite}
          disabled={loading}
          className={`${theme.accent} text-white w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform`}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Generate Invite Link'}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className={`${theme.bg} p-4 rounded-2xl font-mono text-xs break-all border ${theme.border} ${theme.text}`}>
            {inviteLink}
          </div>
          <button 
            onClick={copyToClipboard}
            className={`flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest py-2 ${theme.accentText}`}
          >
            {copied ? <><Check size={16} className="text-green-500" /> Copied!</> : <><Copy size={16} /> Copy to Clipboard</>}
          </button>
        </div>
      )}
    </div>
  );
}