'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader, Sparkles, MessageSquare, Heart, Compass, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const quickPrompts = [
  { text: 'Give me a daily affirmation 🌟', type: 'affirmation' },
  { text: 'Breathing exercise steps 🧘', type: 'breathing' },
  { text: 'Tips to manage work stress 📉', type: 'stress' },
  { text: 'Improve my sleep quality 🌙', type: 'sleep' },
];

export default function ChatbotUI() {
  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading } = useChat({
    initialMessages: [
      {
        id: '1',
        content: "Hello! I'm your AI Wellness Coach from Mind Mosaic. How can I support your mental well-being or productivity today?",
        role: 'assistant',
      },
    ],
    api: '/api/chat',
    streamProtocol: 'text',
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const sendQuickPrompt = (text: string) => {
    setInput(text);
    // Submit using a synthetic event after state updates
    setTimeout(() => {
      const form = document.getElementById('chat-form') as HTMLFormElement;
      if (form) form.requestSubmit();
    }, 50);
  };

  return (
    <div className="flex flex-col h-full bg-background/20 rounded-3xl border border-white/10 overflow-hidden glass-card shadow-2xl shadow-primary/5">
      
      {/* Coach Header banner */}
      <div className="p-4 border-b border-white/10 bg-card/30 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-primary to-accent text-white shadow-md shadow-primary/10">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              AI Wellness Coach <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground font-medium">Always active • Secure & Private</span>
            </div>
          </div>
        </div>

        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted" title="Crisis help info">
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Main Chat space */}
      <ScrollArea className="flex-1 p-5" ref={scrollAreaRef}>
        <div className="space-y-6 max-w-3xl mx-auto">
          
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={message.id}
                className={cn(
                  'flex items-start gap-3.5',
                  isUser ? 'justify-end' : 'justify-start'
                )}
              >
                {!isUser && (
                  <Avatar className="h-9 w-9 border border-white/10">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 leading-relaxed shadow-sm text-sm border',
                    isUser
                      ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground border-primary/20 rounded-tr-none'
                      : 'bg-card/45 border-white/5 text-foreground rounded-tl-none'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {isUser && (
                  <Avatar className="h-9 w-9 border border-white/10">
                    <AvatarFallback className="bg-muted text-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            );
          })}

          {/* Skeletons/Loading bubble */}
          {isLoading && messages[messages.length-1]?.role === 'user' && (
            <div className="flex items-start gap-3.5 justify-start animate-pulse">
              <Avatar className="h-9 w-9 border border-white/10">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-card/45 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3">
                <Skeleton className="h-4 w-12 bg-muted-foreground/20 rounded-full" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Suggested Quick Prompts Grid */}
      {messages.length <= 1 && (
        <div className="p-4 border-t border-white/5 bg-muted/10">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2 px-1">Suggested Topics</p>
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendQuickPrompt(p.text)}
                className="text-left text-xs bg-card/45 hover:bg-primary/10 border border-white/5 hover:border-primary/20 rounded-xl p-2.5 transition-all text-muted-foreground hover:text-foreground"
              >
                {p.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Submission box */}
      <form onSubmit={handleSubmit} id="chat-form">
        <div className="p-4 border-t border-white/10 bg-card/30">
          <div className="relative flex items-center max-w-3xl mx-auto">
            <Input
              placeholder="Ask anything about stress, habits, affirmations, breathing..."
              value={input}
              onChange={handleInputChange}
              className="pr-12 py-6 rounded-2xl bg-card/45 border-white/10 focus-visible:ring-primary focus-visible:ring-offset-0"
              disabled={isLoading}
            />
            <Button
              size="icon"
              type="submit"
              className="absolute right-2 h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/10"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
