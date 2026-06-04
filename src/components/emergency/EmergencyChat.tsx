import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  user_id: string;
  sender_name: string;
  sender_role: string | null;
  sender_avatar: string | null;
  message: string;
  created_at: string;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface EmergencyChatProps {
  emergencyId: string;
}

export default function EmergencyChat({ emergencyId }: EmergencyChatProps) {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, user_id, sender_name, sender_role, sender_avatar, message, created_at')
        .eq('emergency_id', emergencyId)
        .order('created_at', { ascending: true });
      if (!active) return;
      if (!error && data) setMessages(data as ChatMessage[]);
    })();

    const channel = supabase
      .channel(`chat-${emergencyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `emergency_id=eq.${emergencyId}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [emergencyId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !user || sending) return;
    setSending(true);
    setInput('');
    const { error } = await supabase.from('chat_messages').insert({
      emergency_id: emergencyId,
      user_id: user.id,
      sender_name: user.name,
      sender_role: user.role,
      sender_avatar: user.avatar ?? null,
      message: text,
    });
    if (error) {
      toast.error('Failed to send message');
      setInput(text);
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            No messages yet. Be the first to write.
          </p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = user?.id === msg.user_id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${isMe ? 'bg-primary/10' : 'bg-accent'}`}>
                  {msg.sender_avatar ? (
                    <img src={msg.sender_avatar} alt={msg.sender_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className={`w-4 h-4 ${isMe ? 'text-primary' : 'text-muted-foreground'}`} />
                  )}
                </div>
                <div className={`max-w-[75%] ${isMe ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground">{isMe ? 'You' : msg.sender_name}</span>
                    {msg.sender_role && (
                      <span className="text-[10px] text-muted-foreground capitalize">{msg.sender_role}</span>
                    )}
                  </div>
                  <div className={`px-3.5 py-2 rounded-xl text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                    {msg.message}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">{formatTime(msg.created_at)}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={user ? 'Type a message...' : 'Sign in to chat'}
          disabled={!user || sending}
          className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!user || sending || !input.trim()}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
