'use client';

import { useMemo } from 'react';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
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
import Link from 'next/link';
import { PlusCircle, Globe, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Define the type for a journal entry based on the Firestore structure
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

export default function JournalPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const journalEntriesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/journalEntries`);
  }, [user, firestore]);

  const {
    data: journalEntries,
    isLoading: isEntriesLoading,
    error,
  } = useCollection<JournalEntry>(journalEntriesQuery);

  const formatDate = (timestamp: { seconds: number }) => {
    if (!timestamp) return 'No date';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isLoading = isUserLoading || isEntriesLoading;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="Journal" />
      <main className="flex-1 p-4 md:p-8">
        <div className="flex justify-end mb-6">
          <Button asChild>
            <Link href="/journal/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Entry
            </Link>
          </Button>
        </div>
        <div className="grid gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </>
          ) : error ? (
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive">
                  Failed to load journal entries. Please try again later.
                </p>
              </CardContent>
            </Card>
          ) : journalEntries && journalEntries.length > 0 ? (
            journalEntries
              .sort((a, b) => b.dateCreated.seconds - a.dateCreated.seconds)
              .map((entry) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-headline">
                          {entry.title}
                        </CardTitle>
                        <CardDescription>
                          {formatDate(entry.dateCreated)}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={entry.isPublished ? 'secondary' : 'outline'}
                      >
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
                    <p className="text-muted-foreground line-clamp-2">
                      {entry.content}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm">
                      Read More
                    </Button>
                  </CardFooter>
                </Card>
              ))
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Entries Yet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You haven&apos;t written any journal entries. Start by
                  creating one!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
