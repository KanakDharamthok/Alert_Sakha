import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  senderRole: string;
  message: string;
  timestamp: string;
  isCurrentUser: boolean;
}

const mockMessages: ChatMessage[] = [
  { id: '1', sender: 'Maria Santos', senderRole: 'Security', message: 'I\'m on my way to the location now.', timestamp: '08:33 AM', isCurrentUser: false },
  { id: '2', sender: 'You', senderRole: 'Manager', message: 'Copy that. Fire team has been notified.', timestamp: '08:35 AM', isCurrentUser: true },
  { id: '3', sender: 'Ahmed Khan', senderRole: 'Fire Team', message: 'We are 2 minutes out. Is the area evacuated?', timestamp: '08:37 AM', isCurrentUser: false },
  { id: '4', sender: 'Maria Santos', senderRole: 'Security', message: 'Evacuation is 80% complete. East stairway clear.', timestamp: '08:38 AM', isCurrentUser: false },
];

interface EmergencyChatProps {
  emergencyId: string;
}

export default function EmergencyChat({ emergencyId: _emergencyId }: EmergencyChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'You', senderRole: 'Manager',
      message: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCurrentUser: true,
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
  };

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-1">
        {messages.map((msg, i) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`flex gap-3 ${msg.isCurrentUser ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.isCurrentUser ? 'bg-primary/10' : 'bg-accent'}`}>
              <User className={`w-4 h-4 ${msg.isCurrentUser ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div className={`max-w-[75%] ${msg.isCurrentUser ? 'text-right' : ''}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-foreground">{msg.sender}</span>
                <span className="text-[10px] text-muted-foreground">{msg.senderRole}</span>
              </div>
              <div className={`px-3.5 py-2 rounded-xl text-sm ${msg.isCurrentUser ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                {msg.message}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">{msg.timestamp}</span>
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button onClick={handleSend} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
