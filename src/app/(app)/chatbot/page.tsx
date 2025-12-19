import { Header } from '@/components/header';
import ChatbotUI from './chatbot-ui';

export default function ChatbotPage() {
  return (
    <div className="flex h-screen w-full flex-col">
      <Header pageTitle="AI Chatbot" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatbotUI />
      </main>
    </div>
  );
}
