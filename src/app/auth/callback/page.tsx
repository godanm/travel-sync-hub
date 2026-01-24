'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.push('/login?error=auth_failed');
        return;
      }

      // Check if this user is a member of ANY trip yet
      const { data: membership } = await supabase
        .from('trip_members')
        .select('id')
        .eq('user_email', session.user.email)
        .limit(1);

      if (membership && membership.length > 0) {
        // User is a member, send them to the dashboard
        router.push('/');
      } else {
        // User is logged in but NOT invited to any trips
        router.push('/login?error=not_invited');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        Verifying Group Access...
      </p>
    </div>
  );
}