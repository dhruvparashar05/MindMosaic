'use client';

import { useMemo, useState } from 'react';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
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
import { PlusCircle, Globe, Lock, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  tags?: string[];
  imageUrl?: string;
  sentiment?: string;
  emotion?: string;
  summary?: string;
}

export default function JournalPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterTag, setSelectedFilterTag] = useState<string | null>(null);

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

  const handleDelete = (entryId: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, `users/${user.uid}/journalEntries`, entryId);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: 'Entry Deleted',
      description: 'Your journal entry has been successfully deleted.',
    });
    setEntryToDelete(null);
  };

  const isLoading = isUserLoading || isEntriesLoading;

  // Filtered entries memo
  const filteredEntries = useMemo(() => {
    if (!journalEntries) return [];
    
    return journalEntries
      .filter((entry) => {
        const matchesSearch = 
          entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (entry.summary && entry.summary.toLowerCase().includes(searchQuery.toLowerCase()));
          
        const matchesTag = 
          !selectedFilterTag || 
          (entry.tags && entry.tags.includes(selectedFilterTag));
          
        return matchesSearch && matchesTag;
      })
      .sort((a, b) => b.dateCreated.seconds - a.dateCreated.seconds);
  }, [journalEntries, searchQuery, selectedFilterTag]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="Journal" />
      <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        
        {/* Actions bar (Search, Filter, New Entry) */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-muted/20 p-4 rounded-3xl border border-white/5">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search thoughts, summaries..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="rounded-xl bg-card/45 border-white/10 sm:max-w-xs focus-visible:ring-primary"
            />
            
            {/* Tag filtering pills */}
            <div className="flex gap-2 items-center overflow-x-auto max-w-sm py-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Filter:</span>
              <Button
                variant={selectedFilterTag === null ? 'secondary' : 'outline'}
                size="sm"
                className="rounded-full text-xs h-7 px-3"
                onClick={() => setSelectedFilterTag(null)}
              >
                All
              </Button>
              {['Work', 'Study', 'Family', 'Health', 'Friends'].map(tag => (
                <Button
                  key={tag}
                  variant={selectedFilterTag === tag ? 'secondary' : 'outline'}
                  size="sm"
                  className="rounded-full text-xs h-7 px-3"
                  onClick={() => setSelectedFilterTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          <Button className="rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
            <Link href="/journal/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Entry
            </Link>
          </Button>
        </div>

        {/* Entries Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {isLoading ? (
            <>
              <Skeleton className="h-48 rounded-3xl bg-muted/40" />
              <Skeleton className="h-48 rounded-3xl bg-muted/40" />
            </>
          ) : error ? (
            <Card className="md:col-span-2 glass-card">
              <CardHeader>
                <CardTitle>Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive">
                  Failed to load journal entries. Please try again later.
                </p>
              </CardContent>
            </Card>
          ) : filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => (
              <Card key={entry.id} className="glass-card rounded-3xl border border-white/10 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden flex flex-col justify-between">
                
                {/* Optional calming cover image */}
                {entry.imageUrl && (
                  <div className="h-32 w-full overflow-hidden relative">
                    <img src={entry.imageUrl} alt="calm cover" className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-xl font-bold tracking-tight font-headline line-clamp-1">
                        {entry.title}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {formatDate(entry.dateCreated)}
                      </CardDescription>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      {entry.emotion && (
                        <Badge variant="secondary" className="rounded-full bg-accent/10 text-accent border border-accent/20 text-[10px]">
                          {entry.emotion}
                        </Badge>
                      )}
                      <Badge variant={entry.isPublished ? 'secondary' : 'outline'} className="rounded-full text-[10px]">
                        {entry.isPublished ? (
                          <Globe className="mr-0.5 h-3 w-3 inline" />
                        ) : (
                          <Lock className="mr-0.5 h-3 w-3 inline" />
                        )}
                        {entry.isPublished ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {entry.content}
                  </p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {entry.tags.map(t => (
                        <span key={t} className="text-[9px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5">{t}</span>
                      ))}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between border-t border-white/5 pt-4 bg-muted/10">
                  <Button variant="ghost" size="sm" className="rounded-xl hover:bg-muted" asChild>
                    <Link href={`/journal/${entry.id}`}>Read More</Link>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setEntryToDelete(entry)}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl glass-card border border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this journal entry from your mosaic.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl" onClick={() => setEntryToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/95" onClick={() => entryToDelete && handleDelete(entryToDelete.id)}>
                          Delete Entry
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2 glass-card rounded-3xl p-12 text-center border border-dashed border-white/10">
              <CardContent className="space-y-4">
                <p className="text-4xl">📔</p>
                <div className="text-xl font-bold">No Thoughts Logged Yet</div>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  You haven't written any journal entries that match your search filters. Start writing down your reflections!
                </p>
                <Button className="rounded-2xl mt-4 bg-primary hover:bg-primary/95 text-primary-foreground" asChild>
                  <Link href="/journal/new">Create First Entry</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
