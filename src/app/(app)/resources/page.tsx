import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { resources } from '@/lib/data';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';

export default function ResourcesPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="Resources" />
      <main className="flex-1 p-4 md:p-8">
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="flex flex-col">
              <CardHeader>
                {resource.image && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <Image
                      src={resource.image.imageUrl}
                      alt={resource.image.description}
                      fill
                      className="object-cover"
                      data-ai-hint={resource.image.imageHint}
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <CardTitle className="text-xl font-headline mb-2">
                  {resource.title}
                </CardTitle>
                <p className="text-muted-foreground">{resource.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  {resource.duration}
                </span>
                <Button>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Watch Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
