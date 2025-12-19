import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smile, Meh, Frown, Angry, HeartPulse } from 'lucide-react';
import MoodChart from './mood-chart';

const moods = [
  { name: 'Happy', icon: Smile, color: 'text-chart-2' },
  { name: 'Neutral', icon: Meh, color: 'text-muted-foreground' },
  { name: 'Sad', icon: Frown, color: 'text-chart-3' },
  { name: 'Angry', icon: Angry, color: 'text-destructive' },
  { name: 'Anxious', icon: HeartPulse, color: 'text-chart-5' },
];

export default function MoodTrackerPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="Mood Tracker" />
      <main className="flex-1 p-4 md:p-8 grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>How are you feeling right now?</CardTitle>
            <CardDescription>Select a mood to log it for today.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around items-center flex-wrap gap-4">
              {moods.map((mood) => (
                <Button key={mood.name} variant="ghost" className="h-24 w-24 flex-col gap-2 rounded-lg border-2 border-transparent hover:border-primary hover:bg-primary/10 transition-all">
                  <mood.icon className={`h-12 w-12 ${mood.color}`} />
                  <span className="text-sm font-medium">{mood.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Mood History</CardTitle>
            <CardDescription>Visualize your emotional journey over the past week.</CardDescription>
          </CardHeader>
          <CardContent>
            <MoodChart />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
