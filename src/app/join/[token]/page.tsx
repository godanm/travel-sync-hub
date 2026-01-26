'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function JoinTripPage() {
  const { token } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'joining' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Guard 1: Use a ref to prevent double-firing in React Strict Mode
  const joinAttempted = useRef(false);

  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading || !token || !user) return;
    if (joinAttempted.current) return;

    const processJoin = async () => {
      joinAttempted.current = true;
      setStatus('joining');

      try {
        // 1. Verify the Token and get the Trip ID (Slug)
        const { data: trip, error: tripError } = await supabase
          .from('trips')
          .select('slug, name')
          .eq('share_token', token)
          .single();

        if (tripError || !trip) {
          throw new Error("This invitation link is invalid or has expired.");
        }

        // 2. Idempotent Join: Use upsert to prevent "Triple Entry"
        // This relies on the (trip_id, user_email) UNIQUE constraint we added
        const { error: joinError } = await supabase
          .from('trip_members')
          .upsert({
            trip_id: trip.slug,
            trip_slug: trip.slug, // Syncing the restored slug column
            user_email: user.email,
            status: 'Joined',
            family_name: user.user_metadata?.full_name || 'Guest'
          }, { 
            onConflict: 'trip_id, user_email' 
          });

        if (joinError) throw joinError;

        // 3. Success State
        setStatus('success');
        
        // Brief delay so the user sees the success state before redirect
        setTimeout(() => {
          router.push(`/trip/${trip.slug}`);
        }, 1500);

      } catch (err: any) {
        console.error("Join Sequence Failure:", err.message);
        setErrorMsg(err.message);
        setStatus('error');
      }
    };

    processJoin();
  }, [token, user, authLoading, router]);

  // UI States
  if (authLoading || status === 'verifying' || status === 'joining') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-800">Verifying Expedition Access...</h2>
        <p className="text-slate-500">Preparing your seat for {user?.email}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-[32px] shadow-xl border border-red-50 py-12 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={64} />
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Access Denied</h1>
          <p className="text-slate-500 mb-8">{errorMsg}</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-slate-800 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-blue-50">
      <div className="max-w-md w-full bg-white p-8 rounded-[40px] shadow-2xl text-center py-16">
        <CheckCircle2 className="mx-auto text-emerald-500 mb-6" size={80} />
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Welcome Aboard!</h1>
        <p className="text-slate-500 font-medium">You have successfully joined the trip.</p>
        <p className="text-xs text-blue-600 font-bold mt-4 uppercase tracking-widest">Redirecting to Command Center...</p>
      </div>
    </div>
  );
}