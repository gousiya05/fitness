import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Sparkles, Loader2, Dumbbell, Apple, Info } from 'lucide-react';
import { generateContent } from '@/services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'workout' | 'nutrition';
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hello! I'm your FlexAI assistant. Ask me anything about workouts, nutrition, or recovery. How can I help you crush your goals today?",
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const prompt = `User asks: ${input}. Provide a helpful, professional, and motivating fitness/nutrition response. Keep it concise. If you suggest exercises or food, be specific. Return your response as a JSON object with two fields: "content" (the string response) and "type" (one of "text", "workout", "nutrition").`;
      const systemInstruction = "You are FlexAI, an advanced AI Fitness Coach. You are expert in biomechanics, nutrition, and sports psychology. You are motivating, technical but accessible.";
      
      const response = await generateContent(prompt, systemInstruction);
      setMessages(prev => [...prev, { role: 'assistant', content: response.content, type: response.type }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting to my neural network. Please try again in a moment.", type: 'text' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    { label: "Ab workout?", icon: Dumbbell },
    { label: "High protein snacks", icon: Apple },
    { label: "What is BMI?", icon: Info },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
      <Card className="flex-1 flex flex-col border-white/5 bg-white/5 backdrop-blur-xl overflow-hidden rounded-[2rem]">
        <CardHeader className="border-b border-white/5 bg-white/5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(234,88,12,0.3)]">
              <Bot size={24} />
            </div>
            <div>
              <CardTitle className="text-lg">FlexAI Coach</CardTitle>
              <div className="flex items-center gap-1.5 text-[10px] text-green-500 uppercase font-black tracking-widest">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Neural Link
              </div>
            </div>
          </div>
        </CardHeader>
        
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6">
            <AnimatePresence>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex gap-4 max-w-[85%]",
                    m.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    m.role === 'assistant' ? "bg-orange-600/20 text-orange-500" : "bg-white/10 text-white/40"
                  )}>
                    {m.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed",
                    m.role === 'assistant' 
                      ? "bg-white/5 border border-white/10 text-white/90" 
                      : "bg-orange-600 text-white font-medium"
                  )}>
                    {m.content}
                    {m.type === 'workout' && <div className="mt-2 text-[10px] font-bold text-orange-500 flex items-center gap-1 uppercase tracking-widest"><Dumbbell size={10} /> Workout Suggestion</div>}
                    {m.type === 'nutrition' && <div className="mt-2 text-[10px] font-bold text-green-500 flex items-center gap-1 uppercase tracking-widest"><Apple size={10} /> Nutrition Insight</div>}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                  <div className="h-8 w-8 rounded-lg bg-orange-600/20 text-orange-500 flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 italic text-white/40 text-xs">
                    Thinking...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-white/5 space-y-4">
          <div className="flex gap-2 mb-2">
            {suggestions.map(s => (
              <button
                key={s.label}
                onClick={() => setInput(s.label)}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 hover:text-orange-500 hover:border-orange-500/50 transition-all flex items-center gap-1.5 uppercase tracking-widest"
              >
                <s.icon size={12} />
                {s.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className="h-14 pl-6 pr-16 bg-black/40 border-white/10 rounded-2xl focus-visible:ring-orange-600"
            />
            <Button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 h-10 w-10 bg-orange-600 hover:bg-orange-700 rounded-xl"
              size="icon"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
