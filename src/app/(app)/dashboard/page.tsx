'use client';

import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  BookOpen,
  Bot,
  Notebook,
  Smile,
} from 'lucide-react';
import Link from 'next/link';
import MoodChart from '@/app/(app)/mood-tracker/mood-chart';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

interface JournalEntry {
  id: string;
}

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const journalEntriesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/journalEntries`);
  }, [user, firestore]);

  const { data: journalEntries, isLoading: isEntriesLoading } = useCollection<JournalEntry>(journalEntriesQuery);

  const entryCount = journalEntries?.length ?? 0;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="Dashboard" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                How are you feeling?
              </CardTitle>
              <Smile className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Today is a new day</div>
              <p className="text-xs text-muted-foreground">
                Track your mood to see your progress
              </p>
              <Button size="sm" className="mt-4" asChild>
                <Link href="/mood-tracker">
                  Track Mood <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Your Personal Journal
              </CardTitle>
              <Notebook className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isEntriesLoading ? '...' : `${entryCount} ${entryCount === 1 ? 'Entry' : 'Entries'}`}
              </div>
              <p className="text-xs text-muted-foreground">
                Reflect on your thoughts and feelings
              </p>
              <Button size="sm" className="mt-4" asChild>
                <Link href="/journal">
                  Open Journal <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Curated Resources
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Explore Library</div>
              <p className="text-xs text-muted-foreground">
                Videos and articles for your well-being
              </p>
              <Button size="sm" className="mt-4" asChild>
                <Link href="/resources">
                  View Resources <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                AI Assistant
              </CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Always Available</div>
              <p className="text-xs text-muted-foreground">
                Chat with our AI for support
              </p>
              <Button size="sm" className="mt-4" asChild>
                <Link href="/chatbot">
                  Start Chatting <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Recent Mood Trends</CardTitle>
              <CardDescription>
                A look at your mood fluctuations over the last 7 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MoodChart />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
