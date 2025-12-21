'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChatbotUI() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    initialMessages: [
      {
        id: '1',
        content: "Hello! I'm your AI assistant from Mind Mosaic. How can I support you today?",
        role: 'assistant',
      },
    ],
    api: '/api/chat',
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

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-start gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role !== 'user' && (
                <Avatar>
                  <AvatarFallback><Bot/></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-3',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                 <Avatar>
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length-1]?.role === 'user' && (
            <div className="flex items-start gap-3 justify-start">
               <Avatar>
                  <AvatarFallback><Bot/></AvatarFallback>
                </Avatar>
              <div className="bg-muted rounded-lg px-4 py-3">
                <Skeleton className="h-4 w-10 bg-muted-foreground/30" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit}>
        <div className="p-4 border-t bg-card">
          <div className="relative">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={handleInputChange}
              className="pr-12"
              disabled={isLoading}
            />
            <Button
              size="icon"
              variant="ghost"
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
