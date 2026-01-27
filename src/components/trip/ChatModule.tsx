'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Send, X } from 'lucide-react';

export default function ChatModule({ slug, user, theme, onClose }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load and Realtime Subscription
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from('trip_messages').select('*').eq('trip_slug', slug).order('created_at', { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase.channel(`chat:${slug}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trip_messages', filter: `trip_slug=eq.${slug}` }, 
      (payload) => { setMessages((prev) => [...prev, payload.new]); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [slug]);

  // 2. Auto-scroll to bottom
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const handle = user?.email?.split('@')[0] || 'Guest';
    await supabase.from('trip_messages').insert([{ trip_slug: slug, sender_handle: handle, message_text: newMessage }]);
    setNewMessage('');
  };

  return (
    <div className={`flex flex-col h-[500px] ${theme.card} rounded-[30px] overflow-hidden border ${theme.border} shadow-2xl`}>
      <div className="p-6 border-b flex justify-between items-center">
        <h3 className="text-[10px] font-black uppercase tracking-widest">Group Chat</h3>
        <button onClick={onClose} className="text-slate-300 hover:text-red-500"><X size={18}/></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender_handle === user?.email?.split('@')[0] ? 'items-end' : 'items-start'}`}>
            <span className="text-[8px] font-black uppercase opacity-40 mb-1">{msg.sender_handle}</span>
            <div className={`px-4 py-2 rounded-[18px] text-xs max-w-[80%] ${msg.sender_handle === user?.email?.split('@')[0] ? `${theme.accent} text-white` : 'bg-slate-100 text-slate-800'}`}>
              {msg.message_text}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-slate-50 flex gap-2">
        <input className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs focus:outline-none" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <button type="submit" className={`${theme.accent} text-white p-2 rounded-full transition-transform active:scale-95`}><Send size={16}/></button>
      </form>
    </div>
  );
}