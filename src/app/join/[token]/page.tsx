'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function JoinTrip() {
  const { token } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState('Verifying invitation...');

  useEffect(() => {
    const processJoin = async () => {
      // 1. Validate Token
      const { data: invite, error: inviteErr } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('is_used', false)
        .single();

      if (inviteErr || !invite) {
        setStatus('Invalid or expired invitation.');
        return;
      }

      // 2. Add member to the closed group
      // In a real app, you'd get the current user's email here
      const userEmail = "friend@example.com"; 
      
      const { error: joinErr } = await supabase
        .from('trip_members')
        .insert([{ trip_slug: invite.trip_slug, user_email: userEmail }]);

      if (!joinErr) {
        router.push(`/trip/${invite.trip_slug}`);
      } else {
        setStatus('You are already a member of this trip.');
        setTimeout(() => router.push(`/trip/${invite.trip_slug}`), 2000);
      }
    };

    processJoin();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-black uppercase tracking-widest text-xs">
      {status}
    </div>
  );
}