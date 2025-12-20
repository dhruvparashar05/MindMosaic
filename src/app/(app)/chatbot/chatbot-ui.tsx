'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chat } from '@/ai/flows/chat';
import { Skeleton } from '@/components/ui/skeleton';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export default function ChatbotUI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI assistant from Mind Mosaic. How can I support you today?",
      role: 'model',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: inputValue,
      role: 'user',
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const botResponse = await chat({
        history: newMessages.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      });      

      const botMessage: Message = {
        id: crypto.randomUUID(),
        content: botResponse,
        role: 'model',
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
       const errorMessage: Message = {
        id: crypto.randomUUID(),
        content: "Sorry, I'm having a little trouble right now. Please try again in a moment.",
        role: 'model',
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error('Error getting bot response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        // A bit of a hack to scroll to the bottom. The viewport is a child div.
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
              {message.role === 'model' && (
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
          {isLoading && (
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
      <div className="p-4 border-t bg-card">
        <div className="relative">
          <Input
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            className="pr-12"
            disabled={isLoading}
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
