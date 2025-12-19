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
import { journalEntries } from '@/lib/data';
import Link from 'next/link';
import { PlusCircle, Globe, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function JournalPage() {
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
          {journalEntries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-headline">
                      {entry.title}
                    </CardTitle>
                    <CardDescription>{entry.date}</CardDescription>
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
          ))}
        </div>
      </main>
    </div>
  );
}
