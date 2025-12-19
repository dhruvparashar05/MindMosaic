'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { moodChartData } from '@/lib/data';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  mood: {
    label: 'Mood',
    color: 'hsl(var(--chart-1))',
  },
};

export default function MoodChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={moodChartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
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
          <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" hideLabel />} />
          <Bar dataKey="mood" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
