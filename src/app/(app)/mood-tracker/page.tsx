'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Smile, Meh, Frown, HeartPulse, Angry, Check, Calendar, Activity, Sparkles } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

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

const moodTypes = [
  { name: 'Happy', emoji: '😀', label: 'Happy', color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' },
  { name: 'Neutral', emoji: '😌', label: 'Calm', color: 'bg-sky-500/20 text-sky-500 border-sky-500/30' },
  { name: 'Sad', emoji: '😔', label: 'Sad', color: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30' },
  { name: 'Anxious', emoji: '😐', label: 'Anxious', color: 'bg-amber-500/20 text-amber-500 border-amber-500/30' },
  { name: 'Angry', emoji: '😭', label: 'Angry', color: 'bg-rose-500/20 text-rose-500 border-rose-500/30' },
];

const availableTags = ['Work', 'Study', 'Family', 'Health', 'Friends', 'Hobbies', 'Sleep'];

export default function MoodTrackerPage() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number[]>([5]);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query mood records from firestore
  const moodRecordsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/moodRecords`),
      orderBy('dateRecorded', 'desc'),
      limit(30)
    );
  }, [user, firestore]);

  const { data: moodRecords, isLoading } = useCollection<MoodRecord>(moodRecordsQuery);

  // Statistics
  const stats = useMemo(() => {
    if (!moodRecords || moodRecords.length === 0) {
      return { averageIntensity: 5, moodDistribution: {}, loggedCount: 0 };
    }
    const totalInt = moodRecords.reduce((acc, curr) => acc + (curr.intensity || 5), 0);
    const dist: Record<string, number> = {};
    moodRecords.forEach(r => {
      dist[r.mood] = (dist[r.mood] || 0) + 1;
    });
    return {
      averageIntensity: Math.round((totalInt / moodRecords.length) * 10) / 10,
      moodDistribution: dist,
      loggedCount: moodRecords.length,
    };
  }, [moodRecords]);

  // Chart data last 7 entries
  const chartData = useMemo(() => {
    if (!moodRecords || moodRecords.length === 0) return [];
    return [...moodRecords]
      .slice(0, 7)
      .map(r => {
        const secs = r.dateRecorded?.seconds ?? (Date.now() / 1000);
        return {
          date: new Date(secs * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          intensity: r.intensity || 5,
          mood: r.mood,
        };
      })
      .reverse();
  }, [moodRecords]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleMoodLog = async () => {
    if (!selectedMood) return;
    if (!user || !firestore) {
      toast({
        title: 'Auth Error',
        description: 'Please sign in to track your mood.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const record = {
      userProfileId: user.uid,
      mood: selectedMood,
      intensity: intensity[0],
      notes,
      tags: selectedTags,
      dateRecorded: serverTimestamp(),
    };

    try {
      const collectionRef = collection(firestore, `users/${user.uid}/moodRecords`);
      await addDocumentNonBlocking(collectionRef, record);
      
      // Celebratory animation
      canvasConfetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#8B5CF6', '#06B6D4', '#EC4899']
      });

      toast({
        title: 'Mood Logged!',
        description: `Successfully logged your mood as "${selectedMood}".`,
      });

      // Reset
      setSelectedMood(null);
      setIntensity([5]);
      setNotes('');
      setSelectedTags([]);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Logging Failed',
        description: 'Could not submit your mood log. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="Mood Tracker" />
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Layout Grid: Left Log, Right Analytics */}
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* Left panel: Log entry Form */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="glass-card rounded-3xl border border-white/10 shadow-xl shadow-primary/5">
              <CardHeader>
                <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Log Your Mood
                </CardTitle>
                <CardDescription>How is your mental state in this very moment?</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                
                {/* Mood emoji row */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground/80">Select Mood</label>
                  <div className="flex justify-between items-center gap-2">
                    {moodTypes.map((mood) => {
                      const isSelected = selectedMood === mood.name;
                      return (
                        <button
                          key={mood.name}
                          type="button"
                          onClick={() => setSelectedMood(mood.name)}
                          className={`flex-1 flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 ${
                            isSelected
                              ? 'bg-primary/20 border-primary text-primary scale-105 shadow-md shadow-primary/10'
                              : 'bg-card/45 border-white/5 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                          }`}
                        >
                          <span className="text-3xl md:text-4xl mb-1">{mood.emoji}</span>
                          <span className="text-xs font-semibold">{mood.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subform: Slide down when mood selected */}
                <AnimatePresence>
                  {selectedMood && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6 overflow-hidden pt-2"
                    >
                      {/* Intensity slider */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <label className="font-semibold text-foreground/80">Intensity</label>
                          <span className="font-bold text-primary">{intensity[0]} / 10</span>
                        </div>
                        <Slider
                          value={intensity}
                          onValueChange={setIntensity}
                          max={10}
                          min={1}
                          step={1}
                          className="py-2"
                        />
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>Mild</span>
                          <span>Moderate</span>
                          <span>Intense</span>
                        </div>
                      </div>

                      {/* Tag selection */}
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-foreground/80">Tags (Context)</label>
                        <div className="flex flex-wrap gap-2">
                          {availableTags.map((tag) => {
                            const isSelected = selectedTags.includes(tag);
                            return (
                              <Badge
                                key={tag}
                                variant="outline"
                                onClick={() => toggleTag(tag)}
                                className={`cursor-pointer rounded-full px-3 py-1 text-xs transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                                    : 'bg-card/45 border-white/10 text-muted-foreground hover:bg-muted'
                                }`}
                              >
                                {tag} {isSelected && <Check className="ml-1 h-3 w-3 inline" />}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notes area */}
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-foreground/80">Personal Notes</label>
                        <Textarea
                          placeholder="What factors are influencing your mood? Write a brief reflection..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="min-h-[100px] rounded-2xl bg-card/45 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                        />
                      </div>

                      {/* Submit */}
                      <Button
                        onClick={handleMoodLog}
                        disabled={isSubmitting}
                        className="w-full rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold py-3 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all duration-300"
                      >
                        {isSubmitting ? 'Saving...' : 'Log Mood Entry'}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

              </CardContent>
            </Card>
          </div>

          {/* Right panel: Analytics */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Quick stats cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="glass-card rounded-3xl p-5 border border-white/10">
                <CardTitle className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-primary" /> Avg Intensity
                </CardTitle>
                <div className="text-3xl font-extrabold text-foreground mt-2">{stats.averageIntensity}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Based on recent logs</p>
              </Card>

              <Card className="glass-card rounded-3xl p-5 border border-white/10">
                <CardTitle className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-secondary" /> Total Logs
                </CardTitle>
                <div className="text-3xl font-extrabold text-foreground mt-2">{stats.loggedCount}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Last 30 days</p>
              </Card>
            </div>

            {/* Line chart of intensity trend */}
            <Card className="glass-card rounded-3xl p-6 border border-white/10">
              <CardTitle className="text-base flex items-center gap-2">
                Weekly Intensity Trend
              </CardTitle>
              <CardDescription className="mt-1">
                Visualizing fluctuations in your mood strength.
              </CardDescription>

              <div className="h-48 mt-6">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                      <defs>
                        <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 10]} ticks={[2, 4, 6, 8, 10]} fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ background: 'rgba(9,9,11,0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }} 
                        labelClassName="text-[10px] text-muted-foreground"
                      />
                      <Area type="monotone" dataKey="intensity" stroke="hsl(var(--secondary))" strokeWidth={2} fillOpacity={1} fill="url(#moodGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Log moods to see details.
                  </div>
                )}
              </div>
            </Card>

            {/* History Logs list */}
            <Card className="glass-card rounded-3xl p-6 border border-white/10">
              <CardTitle className="text-base">Recent Mood Logs</CardTitle>
              <CardDescription className="mt-1">Your detailed logs from the last few days.</CardDescription>
              
              <div className="space-y-3.5 mt-4 max-h-[220px] overflow-y-auto pr-1">
                {moodRecords && moodRecords.length > 0 ? (
                  moodRecords.map((item) => {
                    const matchedType = moodTypes.find(m => m.name === item.mood);
                    const secs = item.dateRecorded?.seconds ?? (Date.now() / 1000);
                    const formattedDate = new Date(secs * 1000).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    });
                    
                    return (
                      <div key={item.id} className="p-3 bg-muted/15 border border-white/5 rounded-2xl flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{matchedType?.emoji || '✨'}</span>
                            <span className="font-semibold text-xs text-foreground">{item.mood} (Int: {item.intensity || 5})</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{formattedDate}</span>
                        </div>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {item.tags.map(t => (
                              <span key={t} className="text-[9px] bg-primary/10 text-primary border border-primary/20 rounded-full px-1.5 py-0.2">{t}</span>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-[11px] text-muted-foreground italic mt-1 bg-card/25 p-2 rounded-lg border border-white/5 line-clamp-2">
                            "{item.notes}"
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">No mood logs saved yet.</p>
                )}
              </div>
            </Card>

          </div>
        </div>

      </main>
    </div>
  );
}
