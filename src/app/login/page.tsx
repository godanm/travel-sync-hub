'use client';
import { useState } from 'react';
import { Plane, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');

  const handleSimpleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Save email to local storage to simulate a "session"
    localStorage.setItem('user_email', email);
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
            <Plane size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 leading-none">Travel Sync</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-3">Family Expedition Hub</p>
        </div>

        <form onSubmit={handleSimpleLogin} className="space-y-4">
          <input 
            type="email"
            placeholder="Enter your email"
            className="w-full p-4 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 border border-slate-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2">
            ENTER HUB <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}