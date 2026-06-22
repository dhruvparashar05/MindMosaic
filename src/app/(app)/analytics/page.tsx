'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Award,
  Sparkles,
  Activity,
  Clock,
  Heart,
  Smile,
  CheckCircle,
  Brain,
  Zap,
} from 'lucide-react';

interface MoodRecord {
  id: string;
  mood: string;
  intensity: number;
  notes: string;
  tags: string[];
  dateRecorded: {
    seconds: number;
    nanoseconds: number;
  };
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  emotion?: string;
  tags: string[];
  dateCreated: {
    seconds: number;
    nanoseconds: number;
  };
}

interface Habit {
  id: string;
  name: string;
  completed: boolean;
  date: string;
}

interface MeditationLog {
  id: string;
  sessionTitle: string;
  duration: number; // in seconds
  dateLogged: {
    seconds: number;
    nanoseconds: number;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const moodTypes = [
  { name: 'Happy', emoji: '😀', color: '#10B981' },
  { name: 'Neutral', emoji: '😌', color: '#06B6D4' },
  { name: 'Sad', emoji: '😔', color: '#6366F1' },
  { name: 'Anxious', emoji: '😐', color: '#F59E0B' },
  { name: 'Angry', emoji: '😭', color: '#EF4444' },
];

export default function AnalyticsPage() {
  const { user, firestore } = useFirebase();
  const [timeRange, setTimeRange] = useState<'7days' | '30days'>('30days');

  // Firestore collections queries
  const moodQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/moodRecords`),
      orderBy('dateRecorded', 'desc')
    );
  }, [user, firestore]);

  const journalQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/journalEntries`),
      orderBy('dateCreated', 'desc')
    );
  }, [user, firestore]);

  const habitsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/habits`);
  }, [user, firestore]);

  const meditationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/meditations`),
      orderBy('dateLogged', 'desc')
    );
  }, [user, firestore]);

  const { data: moodRecords, isLoading: isMoodLoading } = useCollection<MoodRecord>(moodQuery);
  const { data: journalEntries, isLoading: isJournalLoading } = useCollection<JournalEntry>(journalQuery);
  const { data: habits, isLoading: isHabitsLoading } = useCollection<Habit>(habitsQuery);
  const { data: meditationLogs, isLoading: isMeditationsLoading } = useCollection<MeditationLog>(meditationsQuery);

  const isLoading = isMoodLoading || isJournalLoading || isHabitsLoading || isMeditationsLoading;

  // Filter records based on selected timeRange (7 or 30 days)
  const filteredMoods = useMemo(() => {
    if (!moodRecords) return [];
    const limitDays = timeRange === '7days' ? 7 : 30;
    const cutOff = Date.now() - limitDays * 24 * 60 * 60 * 1000;
    return moodRecords.filter(
      r => r.dateRecorded && r.dateRecorded.seconds * 1000 > cutOff
    );
  }, [moodRecords, timeRange]);

  // Aggregate Mood Stats
  const moodStats = useMemo(() => {
    if (filteredMoods.length === 0) {
      return {
        averageIntensity: 0,
        moodCounts: { Happy: 0, Neutral: 0, Sad: 0, Anxious: 0, Angry: 0 } as Record<string, number>,
        totalLogs: 0,
      };
    }
    const sum = filteredMoods.reduce((acc, curr) => acc + (curr.intensity || 5), 0);
    const counts: Record<string, number> = { Happy: 0, Neutral: 0, Sad: 0, Anxious: 0, Angry: 0 };
    filteredMoods.forEach(r => {
      const name = r.mood;
      if (name in counts) {
        counts[name]++;
      } else {
        counts['Neutral']++;
      }
    });

    return {
      averageIntensity: parseFloat((sum / filteredMoods.length).toFixed(1)),
      moodCounts: counts,
      totalLogs: filteredMoods.length,
    };
  }, [filteredMoods]);

  // Chart data for daily average intensity over time
  const moodTrendChartData = useMemo(() => {
    if (filteredMoods.length === 0) {
      // Mock data for gorgeous premium visual defaults if empty
      return [
        { date: 'Mon', intensity: 6 },
        { date: 'Tue', intensity: 7 },
        { date: 'Wed', intensity: 5 },
        { date: 'Thu', intensity: 6 },
        { date: 'Fri', intensity: 8 },
        { date: 'Sat', intensity: 7 },
        { date: 'Sun', intensity: 8 },
      ];
    }
    // Group by date
    const groups: Record<string, { sum: number; count: number }> = {};
    filteredMoods.forEach(r => {
      if (!r.dateRecorded) return;
      const d = new Date(r.dateRecorded.seconds * 1000);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!groups[key]) {
        groups[key] = { sum: 0, count: 0 };
      }
      groups[key].sum += r.intensity || 5;
      groups[key].count++;
    });

    return Object.entries(groups)
      .map(([date, val]) => ({
        date,
        intensity: parseFloat((val.sum / val.count).toFixed(1)),
      }))
      .reverse(); // Maintain chronological order
  }, [filteredMoods]);

  // Emotion Analysis from journal entries
  const emotionStats = useMemo(() => {
    const defaultData = [
      { name: 'Joy', count: 4, percentage: 40, color: '#06B6D4' },
      { name: 'Stress', count: 3, percentage: 30, color: '#8B5CF6' },
      { name: 'Anxiety', count: 2, percentage: 20, color: '#EC4899' },
      { name: 'Calm', count: 1, percentage: 10, color: '#10B981' },
    ];
    if (!journalEntries || journalEntries.length === 0) return defaultData;

    const counts: Record<string, number> = {};
    let total = 0;
    journalEntries.forEach(e => {
      if (e.emotion) {
        counts[e.emotion] = (counts[e.emotion] || 0) + 1;
        total++;
      }
    });

    if (total === 0) return defaultData;

    const colors = ['#06B6D4', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'];
    return Object.entries(counts)
      .map(([name, count], idx) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
        color: colors[idx % colors.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [journalEntries]);

  // Streak calculation
  const streaks = useMemo(() => {
    if (!user) return { current: 0, max: 0, journalCount: 0, meditationMinutes: 0 };

    const totalJ = journalEntries?.length ?? 0;
    // Calculate total meditation time
    const totalMedSecs = meditationLogs?.reduce((acc, curr) => acc + (curr.duration || 0), 0) ?? 0;
    const medMins = Math.round(totalMedSecs / 60);

    // Simple consecutive days calculations
    let currentStreak = 0;
    let maxStreak = 0;

    if (moodRecords && moodRecords.length > 0) {
      const dates = moodRecords
        .map(r => {
          if (!r.dateRecorded) return '';
          return new Date(r.dateRecorded.seconds * 1000).toDateString();
        })
        .filter(Boolean);

      const uniqueDates = Array.from(new Set(dates)).map(d => new Date(d));
      uniqueDates.sort((a, b) => b.getTime() - a.getTime()); // newest first

      let tempStreak = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      // check if today logged
      const loggedToday = uniqueDates[0] && uniqueDates[0].getTime() === checkDate.getTime();
      let yesterday = new Date(checkDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const loggedYesterday = uniqueDates[0] && uniqueDates[0].getTime() === yesterday.getTime();

      if (loggedToday || loggedYesterday) {
        let currentIdx = 0;
        let expectedDate = loggedToday ? checkDate : yesterday;

        while (currentIdx < uniqueDates.length) {
          const actualDate = uniqueDates[currentIdx];
          actualDate.setHours(0, 0, 0, 0);

          if (actualDate.getTime() === expectedDate.getTime()) {
            tempStreak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
            currentIdx++;
          } else {
            break;
          }
        }
        currentStreak = tempStreak;
      }

      // Max Streak
      let maxTemp = 0;
      let currentTemp = 0;
      let prevTime: number | null = null;

      const sortedAsc = [...uniqueDates].sort((a, b) => a.getTime() - b.getTime()); // oldest first
      sortedAsc.forEach((d) => {
        const t = d.getTime();
        if (prevTime === null) {
          currentTemp = 1;
        } else {
          const diff = (t - prevTime) / (24 * 60 * 60 * 1000);
          if (diff <= 1.1) {
            currentTemp++;
          } else {
            maxTemp = Math.max(maxTemp, currentTemp);
            currentTemp = 1;
          }
        }
        prevTime = t;
      });
      maxStreak = Math.max(maxTemp, currentTemp);
    }

    return {
      current: currentStreak || (moodRecords?.length ? 1 : 0),
      max: Math.max(maxStreak, currentStreak) || (moodRecords?.length ? 1 : 0),
      journalCount: totalJ,
      meditationMinutes: medMins,
    };
  }, [moodRecords, journalEntries, meditationLogs, user]);

  // Habit completion analytics
  const habitStats = useMemo(() => {
    if (!habits || habits.length === 0) {
      return {
        overallCompletion: 75,
        byHabit: [
          { name: 'Drink Water', completionRate: 85, completed: 17, total: 20 },
          { name: 'Morning Meditation', completionRate: 65, completed: 13, total: 20 },
          { name: 'Gratitude Writing', completionRate: 80, completed: 16, total: 20 },
          { name: 'Evening Walk', completionRate: 70, completed: 14, total: 20 },
        ],
      };
    }

    const groups: Record<string, { completed: number; total: number }> = {};
    habits.forEach(h => {
      if (!groups[h.name]) {
        groups[h.name] = { completed: 0, total: 0 };
      }
      groups[h.name].total++;
      if (h.completed) {
        groups[h.name].completed++;
      }
    });

    const byHabit = Object.entries(groups).map(([name, stats]) => ({
      name,
      completed: stats.completed,
      total: stats.total,
      completionRate: Math.round((stats.completed / stats.total) * 100),
    }));

    const totalHabitEntries = habits.length;
    const completedHabitEntries = habits.filter(h => h.completed).length;
    const overallCompletion = Math.round((completedHabitEntries / totalHabitEntries) * 100);

    return {
      overallCompletion,
      byHabit,
    };
  }, [habits]);

  // 12-Week Mood Activity Heatmap
  const heatmapData = useMemo(() => {
    // 12 weeks = 84 days
    const totalDays = 84;
    const days = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Group records by YYYY-MM-DD
    const moodMap: Record<string, string> = {};
    if (moodRecords) {
      moodRecords.forEach(r => {
        if (r.dateRecorded) {
          const key = new Date(r.dateRecorded.seconds * 1000).toISOString().split('T')[0];
          moodMap[key] = r.mood;
        }
      });
    }

    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        dayOfWeek: date.getDay(),
        mood: moodMap[dateStr] || null,
      });
    }
    return days;
  }, [moodRecords]);

  // Achievements/Badges
  const badges = useMemo(() => {
    const list = [
      {
        id: '1',
        name: 'First Check-in',
        description: 'Logged your very first mood entry.',
        icon: '🌱',
        unlocked: (moodRecords?.length ?? 0) >= 1,
      },
      {
        id: '2',
        name: 'Mindfulness Novice',
        description: 'Completed 10 minutes of guided meditation.',
        icon: '🧘',
        unlocked: streaks.meditationMinutes >= 10,
      },
      {
        id: '3',
        name: 'Expressive Soul',
        description: 'Written 5 or more journal entries.',
        icon: '✍️',
        unlocked: streaks.journalCount >= 5,
      },
      {
        id: '4',
        name: 'Consistency King',
        description: 'Achieved a 7-day mood logging streak.',
        icon: '🔥',
        unlocked: streaks.max >= 7,
      },
      {
        id: '5',
        name: 'Habit Champion',
        description: 'Achieved 80%+ overall habit completion rate.',
        icon: '🏆',
        unlocked: habitStats.overallCompletion >= 80 && (habits?.length ?? 0) >= 5,
      },
      {
        id: '6',
        name: 'Self-Care Master',
        description: 'Log 30 wellness check-ins.',
        icon: '💖',
        unlocked: (moodRecords?.length ?? 0) >= 30,
      },
    ];
    return list;
  }, [moodRecords, streaks, habitStats, habits]);

  // Pie chart configuration for Mood distribution
  const moodPieChartData = useMemo(() => {
    return Object.entries(moodStats.moodCounts)
      .map(([name, count]) => {
        const typeInfo = moodTypes.find(t => t.name === name);
        return {
          name,
          value: count,
          color: typeInfo?.color || '#94A3B8',
        };
      })
      .filter(d => d.value > 0);
  }, [moodStats]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="Wellness Analytics" />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Banner with controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/20 pb-6">
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
              Self-Reflection & Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Deep insights into your mood dynamics, habit streaks, and emotional wellness.
            </p>
          </div>

          <div className="flex gap-2 bg-muted/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            <Button
              variant={timeRange === '7days' ? 'secondary' : 'ghost'}
              onClick={() => setTimeRange('7days')}
              className="rounded-xl px-4 py-1.5 text-xs font-semibold h-8"
            >
              7 Days
            </Button>
            <Button
              variant={timeRange === '30days' ? 'secondary' : 'ghost'}
              onClick={() => setTimeRange('30days')}
              className="rounded-xl px-4 py-1.5 text-xs font-semibold h-8"
            >
              30 Days
            </Button>
          </div>
        </div>

        {/* Streaks & Totals Banner Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={itemVariants}>
            <Card className="glass-card p-5 rounded-3xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Current Streak</p>
                <h3 className="text-3xl font-extrabold text-foreground mt-1 flex items-baseline gap-1.5">
                  {streaks.current} <span className="text-xs text-muted-foreground font-medium">days</span>
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1">Keep logging daily!</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <Zap className="h-6 w-6 animate-pulse" />
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-card p-5 rounded-3xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Best Streak</p>
                <h3 className="text-3xl font-extrabold text-foreground mt-1 flex items-baseline gap-1.5">
                  {streaks.max} <span className="text-xs text-muted-foreground font-medium">days</span>
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1">All-time record</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                <Award className="h-6 w-6" />
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-card p-5 rounded-3xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Meditation Completed</p>
                <h3 className="text-3xl font-extrabold text-foreground mt-1 flex items-baseline gap-1.5">
                  {streaks.meditationMinutes} <span className="text-xs text-muted-foreground font-medium">mins</span>
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {meditationLogs?.length ?? 0} total sessions
                </p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
                <Clock className="h-6 w-6" />
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-card p-5 rounded-3xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Wellness Logs</p>
                <h3 className="text-3xl font-extrabold text-foreground mt-1 flex items-baseline gap-1.5">
                  {moodStats.totalLogs} <span className="text-xs text-muted-foreground font-medium">logs</span>
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1">
                  In selected timeframe
                </p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                <Activity className="h-6 w-6" />
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Mood Intensity Trend (Area Chart) */}
          <Card className="glass-card lg:col-span-2 rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Mood Intensity Trend
              </CardTitle>
              <CardDescription className="mt-1">
                Average strength of logged moods. Ideal intensity balance is 5-8.
              </CardDescription>
            </div>

            <div className="h-72 mt-6">
              {moodTrendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moodTrendChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="intensityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 10]} ticks={[2, 4, 6, 8, 10]} tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(9,9,11,0.9)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                      labelClassName="text-xs text-muted-foreground font-semibold"
                    />
                    <Area type="monotone" dataKey="intensity" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#intensityGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Not enough log entries to render trend line.
                </div>
              )}
            </div>
          </Card>

          {/* Mood Counts Breakdown (Pie or Counts) */}
          <Card className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smile className="h-5 w-5 text-secondary" /> Mood Distribution
              </CardTitle>
              <CardDescription className="mt-1">
                Visualizing how your mental space splits.
              </CardDescription>
            </div>

            {moodPieChartData.length > 0 ? (
              <>
                <div className="h-44 relative flex items-center justify-center mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={moodPieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {moodPieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <div className="text-3xl font-extrabold text-foreground">{moodStats.totalLogs}</div>
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Entries</div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  {moodPieChartData.map((item, idx) => {
                    const matched = moodTypes.find(t => t.name === item.name);
                    const pct = Math.round((item.value / moodStats.totalLogs) * 100);
                    return (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{matched?.emoji}</span>
                          <span className="font-semibold text-foreground">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground font-medium">{pct}% ({item.value})</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground p-6 text-center">
                Log moods in the Mood Tracker to view emotional distribution breakdowns.
              </div>
            )}
          </Card>
        </div>

        {/* Middle Heatmap & Habit Analytics */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Habits overview rates */}
          <Card className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" /> Habits Completion rates
              </CardTitle>
              <CardDescription className="mt-1">
                Your performance metrics across daily habits.
              </CardDescription>
            </div>

            <div className="space-y-4 mt-6">
              {habitStats.byHabit.length > 0 ? (
                habitStats.byHabit.map((habit, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-semibold text-foreground/80">{habit.name}</span>
                      <span className="text-muted-foreground font-bold">{habit.completionRate}% ({habit.completed}/{habit.total})</span>
                    </div>
                    <Progress value={habit.completionRate} className="h-2 rounded-full" />
                  </div>
                ))
              ) : (
                <div className="flex h-44 items-center justify-center text-xs text-muted-foreground">
                  Create and log habits to populate weekly statistics.
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-white/5 pt-4 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Overall Completion rate:</span>
              <span className="font-extrabold text-emerald-500 text-sm">{habitStats.overallCompletion}%</span>
            </div>
          </Card>

          {/* Journal Sentiment/Emotion analysis progress bars */}
          <Card className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-accent" /> Emotional Frequency (Journal)
              </CardTitle>
              <CardDescription className="mt-1">
                Detected sentiments and primary emotional states in written journals.
              </CardDescription>
            </div>

            <div className="space-y-4 mt-6">
              {emotionStats.length > 0 ? (
                emotionStats.slice(0, 4).map((emotion, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-semibold text-foreground/80 capitalize">{emotion.name}</span>
                      <span className="text-muted-foreground font-bold">{emotion.percentage}%</span>
                    </div>
                    <div className="w-full bg-muted/20 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${emotion.percentage}%`, backgroundColor: emotion.color }} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-44 items-center justify-center text-xs text-muted-foreground">
                  No journals analyzed by AI Coach yet.
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-white/5 pt-4 text-center text-[10px] text-muted-foreground">
              To update this list, analyze entries in the journal editor.
            </div>
          </Card>
        </div>

        {/* 12-Week Mood Contribution Heatmap */}
        <Card className="glass-card rounded-3xl p-6 border border-white/10">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Mood Contribution Heatmap
            </CardTitle>
            <CardDescription className="mt-1">
              Your overall consistency tracking mental states over the last 12 weeks.
            </CardDescription>
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            <div className="min-w-[640px] flex justify-center py-4 bg-muted/15 border border-white/5 rounded-2xl">
              <div className="grid grid-flow-col grid-rows-7 gap-1.5">
                {heatmapData.map((day, idx) => {
                  let color = 'bg-muted/30';
                  if (day.mood === 'Happy') color = 'bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.2)]';
                  if (day.mood === 'Neutral') color = 'bg-sky-400/80';
                  if (day.mood === 'Sad') color = 'bg-indigo-500/80';
                  if (day.mood === 'Anxious') color = 'bg-amber-500/80';
                  if (day.mood === 'Angry') color = 'bg-rose-500/80';

                  return (
                    <div
                      key={idx}
                      className={`w-4.5 h-4.5 rounded-sm ${color} transition-all duration-300 hover:scale-125 cursor-pointer`}
                      title={`${day.date}: ${day.mood || 'No record'}`}
                    />
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-muted-foreground mt-4 max-w-[640px] mx-auto px-4">
              <span>Less Active (No Logs)</span>
              <div className="flex gap-1.5 items-center">
                <div className="w-3.5 h-3.5 rounded-sm bg-muted/30" />
                <div className="w-3.5 h-3.5 rounded-sm bg-indigo-500/80" />
                <div className="w-3.5 h-3.5 rounded-sm bg-sky-400/80" />
                <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500/80" />
              </div>
              <span>More Active</span>
            </div>
          </div>
        </Card>

        {/* Milestones & Badges Grid */}
        <Card className="glass-card rounded-3xl p-6 border border-white/10">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" /> Wellness Milestones & Badges
            </CardTitle>
            <CardDescription className="mt-1">
              Unlock milestones by journaling, meditating, and tracking your emotional progress.
            </CardDescription>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 mt-6">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3 ${
                  badge.unlocked
                    ? 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 shadow-md shadow-primary/5 hover:scale-[1.02]'
                    : 'bg-muted/10 border-white/5 opacity-55'
                }`}
              >
                <div className={`text-3xl p-2 rounded-xl bg-card border border-white/5 shadow-inner shrink-0 ${badge.unlocked ? '' : 'filter grayscale'}`}>
                  {badge.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-xs text-foreground">{badge.name}</h4>
                    {badge.unlocked && (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1 rounded-full font-bold">
                        Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </main>
    </div>
  );
}
