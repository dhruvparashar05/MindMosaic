import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

export default function NewJournalEntryPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="New Journal Entry" />
      <main className="flex-1 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>What's on your mind?</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="A beautiful day..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Your thoughts</Label>
                <Textarea
                  id="content"
                  placeholder="Today I felt..."
                  className="min-h-[200px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                  <Link href="/journal">Cancel</Link>
                </Button>
                <Button>Save Draft</Button>
                <Button variant="secondary">Publish</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
