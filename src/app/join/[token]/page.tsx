'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function JoinTrip() {
  const { token } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying expedition access...');

  useEffect(() => {
    const processJoin = async () => {
      if (authLoading) return;
      if (!user) {
        setStatus('error');
        setMessage('Please login with Google to join this trip.');
        return;
      }

      // 1. Look for the trip using the permanent share_token
      const { data: trip, error: tripErr } = await supabase
        .from('trips')
        .select('*')
        .eq('share_token', token)
        .single();

      if (tripErr || !trip) {
        setStatus('error');
        setMessage('This invitation link is invalid.');
        return;
      }

      // 2. Add the authenticated user to the trip members
      const { error: joinErr } = await supabase
        .from('trip_members')
        .insert([{ 
          trip_slug: trip.slug, 
          user_email: user.email,
          status: 'Joined' 
        }]);

      if (joinErr && joinErr.code !== '23505') { // Ignore duplicate membership
        setStatus('error');
        setMessage('Failed to join the group.');
        return;
      }

      setStatus('success');
      setMessage(`Success! Entering ${trip.name} hub...`);
      setTimeout(() => router.push(`/trip/${trip.slug}`), 2000);
    };

    processJoin();
  }, [token, user, authLoading, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white p-10 rounded-[40px] shadow-xl text-center">
        {status === 'verifying' && <div className="flex flex-col items-center"><Loader2 className="animate-spin text-blue-600 mb-4" size={40} /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{message}</p></div>}
        {status === 'success' && <div className="flex flex-col items-center animate-in zoom-in"><div className="w-16 h-16 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mb-6"><CheckCircle2 size={32} /></div><h2 className="text-xl font-black mb-2 uppercase">Welcome Aboard!</h2><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{message}</p></div>}
        {status === 'error' && <div className="flex flex-col items-center animate-in shake"><div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6"><AlertCircle size={32} /></div><h2 className="text-xl font-black mb-2 uppercase">Access Error</h2><p className="text-slate-500 font-bold text-xs mb-8">{message}</p><button onClick={() => router.push('/login')} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Go to Login</button></div>}
      </div>
    </div>
  );
}