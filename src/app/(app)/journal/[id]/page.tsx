'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Globe, Lock, ArrowLeft } from 'lucide-react';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  dateCreated: {
    seconds: number;
    nanoseconds: number;
  };
  isPublished: boolean;
}

export default function JournalEntryPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, firestore } = useFirebase();

  const entryRef = useMemoFirebase(() => {
    if (!user || !id) return null;
    return doc(firestore, `users/${user.uid}/journalEntries`, id);
  }, [user, firestore, id]);

  const { data: entry, isLoading, error } = useDoc<JournalEntry>(entryRef);

  const formatDate = (timestamp: { seconds: number }) => {
    if (!timestamp) return 'No date';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle={isLoading ? 'Loading Entry...' : entry?.title || 'Journal Entry'} />
      <main className="flex-1 p-4 md:p-8">
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/4 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">
                Could not load this journal entry. It might have been deleted or you may not have permission to view it.
              </p>
            </CardContent>
          </Card>
        ) : entry ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-headline">{entry.title}</CardTitle>
                  <CardDescription>{formatDate(entry.dateCreated)}</CardDescription>
                </div>
                <Badge variant={entry.isPublished ? 'secondary' : 'outline'}>
                  {entry.isPublished ? (
                    <>
                      <Globe className="mr-1 h-3 w-3" />
                      Published
                    </>
                  ) : (
                    <>
                      <Lock className="mr-1 h-3 w-3" />
                      Private
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{entry.content}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/journal">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Journal
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Entry Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This journal entry could not be found.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
