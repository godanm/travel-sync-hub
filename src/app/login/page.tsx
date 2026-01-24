'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { LogIn, AlertCircle, ShieldAlert, Loader2 } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-xl border border-slate-100 text-center">
      {error === 'not_invited' && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-4">
          <ShieldAlert className="text-amber-600 shrink-0" size={20} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Access Restricted</p>
            <p className="text-xs font-bold text-amber-900 leading-relaxed">
              You've logged in successfully, but you haven't been invited to any trips yet. Please ask the group owner for a join link.
            </p>
          </div>
        </div>
      )}

      <div className="w-20 h-20 bg-indigo-900 text-white rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl">
        <LogIn size={36} />
      </div>
      
      <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter">GatherGo</h1>
      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-12">Expedition Coordination</p>
      
      <button 
        onClick={handleGoogleLogin}
        className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all active:scale-95"
      >
        Login with Google
      </button>
      
      <p className="mt-10 text-[10px] text-slate-400 font-medium px-4 leading-relaxed">
        Access is restricted to authorized family members and invited guests only.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Suspense fallback={<Loader2 className="animate-spin text-blue-600" size={48} />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}