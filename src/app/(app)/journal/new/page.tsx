'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import {
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

export default function NewJournalEntryPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { user, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const handleSave = async (isPublished: boolean) => {
    if (!title || !content) {
      toast({
        title: 'Missing Fields',
        description: 'Please provide a title and content for your entry.',
        variant: 'destructive',
      });
      return;
    }

    if (!user || !firestore) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to create an entry.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    const newEntry = {
      userProfileId: user.uid,
      title,
      content,
      isPublished,
      dateCreated: serverTimestamp(),
    };

    try {
      const collectionRef = collection(firestore, `users/${user.uid}/journalEntries`);
      addDocumentNonBlocking(collectionRef, newEntry);

      toast({
        title: 'Entry Saved!',
        description: `Your journal entry has been ${isPublished ? 'published' : 'saved as a draft'}.`,
      });

      router.push('/journal');
    } catch (error) {
      console.error('Error saving journal entry: ', error);
      toast({
        title: 'Error',
        description: 'Could not save your journal entry. Please try again.',
        variant: 'destructive',
      });
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="New Journal Entry" />
      <main className="flex-1 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>What's on your mind?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="A beautiful day..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Your thoughts</Label>
                <Textarea
                  id="content"
                  placeholder="Today I felt..."
                  className="min-h-[200px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                  <Link href="/journal">Cancel</Link>
                </Button>
                <Button
                  onClick={() => handleSave(false)}
                  disabled={isSaving || !title || !content}
                >
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleSave(true)}
                  disabled={isSaving || !title || !content}
                >
                  {isSaving ? 'Publishing...' : 'Publish'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
