'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface MoodRecord {
  id: string;
  mood: string;
  dateRecorded: {
    seconds: number;
    nanoseconds: number;
  };
}

const getMoodScore = (mood: string) => {
  switch (mood) {
    case 'Happy':
      return 5;
    case 'Neutral':
      return 3;
    case 'Sad':
      return 2;
    case 'Anxious':
      return 1;
    case 'Angry':
      return 1;
    default:
      return 0;
  }
};

const formatDate = (timestamp: { seconds: number }) => {
  if (!timestamp) return '';
  return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const chartConfig = {
  mood: {
    label: 'Mood',
    color: 'hsl(var(--chart-1))',
  },
};

export default function MoodChart() {
  const { user, firestore } = useFirebase();

  const moodRecordsQuery = useMemoFirebase(() => {
    if (!user) return null;
    const coll = collection(firestore, `users/${user.uid}/moodRecords`);
    // Query for the last 7 entries, ordered by date
    return query(coll, orderBy('dateRecorded', 'desc'), limit(7));
  }, [user, firestore]);

  const { data: moodRecords, isLoading } = useCollection<MoodRecord>(moodRecordsQuery);

  const chartData = useMemo(() => {
    if (!moodRecords) return [];
    // Reverse to show oldest first
    return moodRecords
      .map(record => ({
        date: formatDate(record.dateRecorded),
        mood: getMoodScore(record.mood),
      }))
      .reverse();
  }, [moodRecords]);

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }
  
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Log your first mood to see your history here.</p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: -10, bottom: 0 }}
        >
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              const moods = ['', 'Anxious/Angry', 'Sad', 'Neutral', '', 'Happy'];
              return moods[value] || '';
            }}
            domain={[0, 5]}
            ticks={[1, 2, 3, 5]}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => (
              <ChartTooltipContent active={active} payload={payload} indicator="dot" hideLabel />
            )}
          />
          <Bar dataKey="mood" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
