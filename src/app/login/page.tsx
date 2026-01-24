'use client';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { LogIn, AlertCircle, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-xl border border-slate-100 text-center">
        
        {/* Dynamic Error Messaging */}
        {error === 'not_invited' && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-4">
            <ShieldAlert className="text-amber-600 shrink-0" size={20} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Access Restricted</p>
              <p className="text-xs font-bold text-amber-900 leading-relaxed">
                You've logged in successfully, but you haven't been invited to any trips yet. Please ask the group owner for an invitation link.
              </p>
            </div>
          </div>
        )}

        {error === 'auth_failed' && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-left">
            <AlertCircle className="text-red-600 shrink-0" size={20} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-700 mb-1">Auth Error</p>
              <p className="text-xs font-bold text-red-900 leading-relaxed">
                We couldn't verify your Google account. Please try again.
              </p>
            </div>
          </div>
        )}

        <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <LogIn size={32} />
        </div>
        
        <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter">Family Hub</h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-10">Expedition Coordination</p>
        
        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
        >
          Login with Google
        </button>
        
        <p className="mt-8 text-[10px] text-slate-400 font-medium px-4 leading-relaxed">
          This is a closed group for family and invited friends. <br/>
          Uninvited users will not be able to view trip details.
        </p>
      </div>
    </div>
  );
}