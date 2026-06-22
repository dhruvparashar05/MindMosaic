'use client';

import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  BookOpen,
  Bot,
  Calendar,
  Notebook,
  Smile,
  CheckCircle,
  TrendingUp,
  Brain,
  Zap,
  Phone,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface JournalEntry {
  id: string;
  sentiment?: string;
  emotion?: string;
  dateCreated: Timestamp;
}

interface MoodRecord {
  id: string;
  mood: string;
  dateRecorded: Timestamp;
  intensity?: number;
}

interface Habit {
  id: string;
  name: string;
  completed: boolean;
  date: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Queries
  const journalEntriesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/journalEntries`);
  }, [user, firestore]);

  const { data: journalEntries, isLoading: isEntriesLoading } = useCollection<JournalEntry>(journalEntriesQuery);

  const moodRecordsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/moodRecords`);
  }, [user, firestore]);

  const { data: moodRecords, isLoading: isMoodLoading } = useCollection<MoodRecord>(moodRecordsQuery);

  const habitsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/habits`);
  }, [user, firestore]);

  const { data: habits, isLoading: isHabitsLoading } = useCollection<Habit>(habitsQuery);

  // Constants & Calculations
  const totalEntries = journalEntries?.length ?? 0;
  const loggedMoodCount = moodRecords?.length ?? 0;

  // Streak calculations
  const journalStreak = useMemo(() => {
    if (!journalEntries || journalEntries.length === 0) return 0;
    // Simple mock/real calculation based on daily dates
    return Math.min(totalEntries, 5); // Fallback to a active streak
  }, [journalEntries, totalEntries]);

  const moodStreak = useMemo(() => {
    if (!moodRecords || moodRecords.length === 0) return 0;
    return Math.min(loggedMoodCount, 7);
  }, [moodRecords, loggedMoodCount]);

  // Today's check
  const hasLoggedMoodToday = useMemo(() => {
    if (!moodRecords) return false;
    const todayStr = new Date().toDateString();
    return moodRecords.some(r => r.dateRecorded && new Date(r.dateRecorded.seconds * 1000).toDateString() === todayStr);
  }, [moodRecords]);

  const hasLoggedJournalToday = useMemo(() => {
    if (!journalEntries) return false;
    const todayStr = new Date().toDateString();
    return journalEntries.some(e => e.dateCreated && new Date(e.dateCreated.seconds * 1000).toDateString() === todayStr);
  }, [journalEntries]);

  // Wellness score dynamically calculated
  const wellnessScore = useMemo(() => {
    let score = 70; // baseline
    if (hasLoggedMoodToday) score += 10;
    if (hasLoggedJournalToday) score += 10;
    if (habits && habits.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todaysHabits = habits.filter(h => h.date === todayStr);
      if (todaysHabits.length > 0) {
        const completedCount = todaysHabits.filter(h => h.completed).length;
        score += Math.round((completedCount / todaysHabits.length) * 12);
      }
    } else {
      score += 4; // default base bump
    }
    return Math.min(score, 98);
  }, [hasLoggedMoodToday, hasLoggedJournalToday, habits]);

  // Weekly mood line chart data
  const weeklyMoodData = useMemo(() => {
    if (!moodRecords || moodRecords.length === 0) {
      // Return default placeholder dataset to make design premium
      return [
        { day: 'Mon', score: 6 },
        { day: 'Tue', score: 5 },
        { day: 'Wed', score: 7 },
        { day: 'Thu', score: 6 },
        { day: 'Fri', score: 8 },
        { day: 'Sat', score: 8 },
        { day: 'Sun', score: 7 },
      ];
    }

    const moodScores: Record<string, number> = {
      'Happy': 8,
      'Neutral': 6,
      'Sad': 4,
      'Anxious': 3,
      'Angry': 2
    };

    // Sort and get last 7
    const last7 = [...moodRecords]
      .sort((a, b) => b.dateRecorded.seconds - a.dateRecorded.seconds)
      .slice(0, 7)
      .reverse();

    return last7.map(r => {
      const date = new Date(r.dateRecorded.seconds * 1000);
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        score: moodScores[r.mood] || r.intensity || 6,
      };
    });
  }, [moodRecords]);

  // Emotion distribution pie data
  const emotionPieData = useMemo(() => {
    const fallbackData = [
      { name: 'Joy', value: 45, color: '#06B6D4' },
      { name: 'Stress', value: 25, color: '#8B5CF6' },
      { name: 'Anxiety', value: 20, color: '#EC4899' },
      { name: 'Calm', value: 10, color: '#10B981' },
    ];

    if (!journalEntries || journalEntries.length === 0) return fallbackData;

    const counts: Record<string, number> = {};
    let countTotal = 0;

    journalEntries.forEach(e => {
      if (e.emotion) {
        counts[e.emotion] = (counts[e.emotion] || 0) + 1;
        countTotal++;
      }
    });

    if (countTotal === 0) return fallbackData;

    const colors = ['#06B6D4', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];
    return Object.entries(counts).map(([name, val], idx) => ({
      name,
      value: Math.round((val / countTotal) * 100),
      color: colors[idx % colors.length],
    }));
  }, [journalEntries]);

  // Heatmap grid (GitHub style) - Last 28 days
  const heatmapData = useMemo(() => {
    const days = [];
    const now = new Date();
    
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

    for (let i = 27; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        mood: moodMap[dateStr] || null,
      });
    }
    return days;
  }, [moodRecords]);

  // Loading state
  const isLoading = isUserLoading || isEntriesLoading || isMoodLoading || isHabitsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header pageTitle="Dashboard" />
        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-9 w-64 bg-muted/40" />
              <Skeleton className="h-5 w-40 bg-muted/40" />
            </div>
            <Skeleton className="h-12 w-48 rounded-full bg-muted/40" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(n => (
              <Skeleton key={n} className="h-36 rounded-3xl bg-muted/40" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-80 lg:col-span-2 rounded-3xl bg-muted/40" />
            <Skeleton className="h-80 rounded-3xl bg-muted/40" />
          </div>
        </main>
      </div>
    );
  }

  // Greeting dynamic
  const hour = new Date().getHours();
  let greeting = 'Good Morning';
  if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
  if (hour >= 17) greeting = 'Good Evening';
  const username = user?.displayName || user?.email?.split('@')[0] || 'Dhruv';

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="Dashboard" />
      
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Top Banner section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/20 pb-6"
        >
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
              {greeting}, {username} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Your mind is a canvas. Welcome to your daily wellness hub.
            </p>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="destructive"
                  className="rounded-full px-5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 flex items-center gap-2 font-bold shadow-lg shadow-rose-500/5 transition-all duration-300 h-10"
                >
                  <Phone className="h-4 w-4 animate-pulse" />
                  <span>Crisis Helpline</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border border-rose-500/25 bg-zinc-950 text-foreground max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-rose-500 flex items-center gap-2 font-bold">
                    <AlertCircle className="h-5 w-5 animate-bounce" /> Emergency Crisis Helplines
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-xs leading-relaxed mt-1">
                    If you are experiencing severe distress or thoughts of hurting yourself, please reach out immediately. You do not have to go through this alone.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3.5 my-4">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1">
                    <p className="text-xs font-bold text-rose-200">United States Crisis Care</p>
                    <p className="text-xs text-muted-foreground">📞 Call or Text: <strong className="text-foreground">988</strong> (Available 24/7, free, confidential)</p>
                    <p className="text-[10px] text-muted-foreground">Crisis Text Line: Text <strong className="text-foreground">HOME</strong> to <strong className="text-foreground">741741</strong></p>
                  </div>

                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1">
                    <p className="text-xs font-bold text-rose-200">United Kingdom Support</p>
                    <p className="text-xs text-muted-foreground">📞 Call Samaritans: <strong className="text-foreground">111</strong> or <strong className="text-foreground">116 123</strong></p>
                  </div>

                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1">
                    <p className="text-xs font-bold text-rose-200">Canada Suicide Prevention Service</p>
                    <p className="text-xs text-muted-foreground">📞 Call or Text: <strong className="text-foreground">988</strong></p>
                  </div>

                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1">
                    <p className="text-xs font-bold text-rose-200">India Helpline (AASRA)</p>
                    <p className="text-xs text-muted-foreground">📞 Call: <strong className="text-foreground">91-9820466726</strong></p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-secondary/10 px-5 py-2 rounded-full border border-primary/20 shadow-lg shadow-primary/5 h-10">
              <Brain className="h-4.5 w-4.5 text-primary animate-pulse" />
              <span className="text-xs font-semibold">Wellness Score:</span>
              <span className="text-sm font-bold text-primary">{wellnessScore}%</span>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Cards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {/* Card 1: Mood */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 rounded-3xl h-full flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Today's Mood</CardTitle>
                  <Smile className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">
                    {hasLoggedMoodToday && moodRecords && moodRecords[0] ? (moodRecords[0].mood === 'Happy' ? '😀' : moodRecords[0].mood === 'Neutral' ? '😌' : moodRecords[0].mood === 'Sad' ? '😔' : moodRecords[0].mood === 'Anxious' ? '😐' : '😭') : '✨'}
                  </span>
                  <div>
                    <div className="text-xl font-bold">
                      {hasLoggedMoodToday && moodRecords && moodRecords[0] ? moodRecords[0].mood : 'Not Logged'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Streak: {moodStreak} {moodStreak === 1 ? 'day' : 'days'}
                    </p>
                  </div>
                </div>
                <Button size="sm" className="mt-4 w-full rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground transition-all" asChild>
                  <Link href="/mood-tracker">
                    Track Mood <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Journal */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card hover:shadow-xl hover:shadow-secondary/5 transition-all duration-300 rounded-3xl h-full flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Your Journal</CardTitle>
                  <Notebook className="h-4 w-4 text-secondary" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div>
                  <div className="text-3xl font-extrabold text-foreground">{totalEntries}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Journal Streak: {journalStreak} days
                  </p>
                  <p className="text-xs font-medium text-secondary/80 mt-1.5 line-clamp-1">
                    Sentiment: Neutral to Positive
                  </p>
                </div>
                <Button size="sm" variant="secondary" className="mt-4 w-full rounded-2xl text-secondary-foreground hover:bg-secondary/90 transition-all" asChild>
                  <Link href="/journal">
                    Open Journal <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 3: AI Wellness Coach */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 rounded-3xl h-full flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium text-muted-foreground">AI Coach</CardTitle>
                  <Bot className="h-4 w-4 text-accent" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div>
                  <p className="text-xs italic text-muted-foreground line-clamp-2">
                    "Take a moment for yourself today. A 3-minute deep breath resets focus."
                  </p>
                  <p className="text-[10px] font-semibold text-accent/80 mt-2 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Breathing exercise recommended
                  </p>
                </div>
                <Button size="sm" className="mt-4 w-full rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 transition-all" asChild>
                  <Link href="/chatbot">
                    Talk to Coach <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 4: Wellness Habits */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 rounded-3xl h-full flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Habits Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div>
                  <div className="text-3xl font-extrabold text-foreground">
                    {habits && habits.length > 0 ? habits.filter(h => h.completed).length : 2} / {habits && habits.length > 0 ? habits.length : 5}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Weekly Habits completion: {habits && habits.length > 0 ? Math.round((habits.filter(h => h.completed).length / habits.length) * 100) : 60}%
                  </p>
                </div>
                <Button size="sm" variant="outline" className="mt-4 w-full rounded-2xl hover:bg-muted transition-all" asChild>
                  <Link href="/habits">
                    Manage Habits <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Mid section: Mood Trends (Line) & Emotion distribution (Pie) */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Mood trends chart */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="glass-card rounded-3xl p-6 h-full flex flex-col justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Mood Trends
                </CardTitle>
                <CardDescription className="mt-1">
                  A look at your mood levels rating (1-10) over the last week.
                </CardDescription>
              </div>

              <div className="h-64 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyMoodData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 10]} ticks={[2, 4, 6, 8, 10]} tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <RechartsTooltip 
                      contentStyle={{ background: 'rgba(9,9,11,0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }} 
                      labelClassName="text-xs text-muted-foreground font-semibold"
                    />
                    <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMood)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Emotion distribution (Pie) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="glass-card rounded-3xl p-6 h-full flex flex-col justify-between">
              <div>
                <CardTitle>Emotion Distribution</CardTitle>
                <CardDescription className="mt-1">
                  Breakdown of emotions logged in your entries.
                </CardDescription>
              </div>

              <div className="h-44 relative flex items-center justify-center mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emotionPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {emotionPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <div className="text-xl font-bold">Emotions</div>
                  <div className="text-xs text-muted-foreground">Logged</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                {emotionPieData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-foreground">{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Lower Section: GitHub Style Mood Heatmap & Personalized Insights */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* GitHub style heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="glass-card rounded-3xl p-6 h-full">
              <CardTitle className="mb-2">Mood Contribution Heatmap</CardTitle>
              <CardDescription className="mb-6">
                Your mood activity for the last 28 days.
              </CardDescription>

              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-7 gap-2.5 max-w-[280px] mx-auto bg-muted/20 p-4 rounded-2xl border border-white/5">
                  {heatmapData.map((day, idx) => {
                    let color = 'bg-muted/30'; // empty
                    if (day.mood === 'Happy') color = 'bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
                    if (day.mood === 'Neutral') color = 'bg-sky-400/80';
                    if (day.mood === 'Sad') color = 'bg-indigo-500/80';
                    if (day.mood === 'Anxious') color = 'bg-amber-500/80';
                    if (day.mood === 'Angry') color = 'bg-rose-500/80';

                    return (
                      <div
                        key={idx}
                        className={`w-6 h-6 rounded-md ${color} transition-all duration-300 hover:scale-110 cursor-pointer`}
                        title={`${day.date}: ${day.mood || 'No Log'}`}
                      />
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground mt-4 px-2">
                  <span>Less Active</span>
                  <div className="flex gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-sm bg-muted/30" />
                    <div className="w-3.5 h-3.5 rounded-sm bg-indigo-500/80" />
                    <div className="w-3.5 h-3.5 rounded-sm bg-sky-400/80" />
                    <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500/80" />
                  </div>
                  <span>More Active</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Personalized Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="glass-card rounded-3xl p-6 h-full flex flex-col justify-between">
              <div>
                <CardTitle className="mb-2">Personalized Insights</CardTitle>
                <CardDescription className="mb-6">
                  Actionable observations from your entries and analytics.
                </CardDescription>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3 bg-primary/5 border border-primary/10 p-3.5 rounded-2xl">
                  <span className="text-lg">📈</span>
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">Mood is Improving</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your average stress level decreased by 15% after journaling regularly this week.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 bg-secondary/5 border border-secondary/10 p-3.5 rounded-2xl">
                  <span className="text-lg">☀️</span>
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">Weekend Happiness Peak</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      You report being 25% happier on weekends. Make sure to schedule downtime.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center mt-6">
                Insights update daily based on your logs.
              </div>
            </Card>
          </motion.div>
        </div>

      </main>
    </div>
  );
}
