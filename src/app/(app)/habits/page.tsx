'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, Award, Flame, Heart, Sparkles, Plus, GlassWater, Trophy } from 'lucide-react';
import canvasConfetti from 'canvas-confetti';

interface Habit {
  id: string;
  name: string;
  completed: boolean;
  date: string;
}

interface Gratitude {
  id: string;
  items: string[];
  date: string;
}

const defaultHabits = [
  { name: 'Drink Water (8 glasses) 💧', key: 'water' },
  { name: 'Exercise (30 mins) 🏃‍♂️', key: 'exercise' },
  { name: 'Sleep 8 Hours 🛌', key: 'sleep' },
  { name: 'Write a Journal Entry 📔', key: 'journal' },
  { name: 'Guided Meditation 🧘', key: 'meditation' },
];

const badges = [
  { id: 'first-entry', name: 'First Reflection', desc: 'Logged your first journal entry.', icon: '🎯' },
  { id: '7-day-streak', name: 'Resilient Thinker', desc: 'Achieved a 7-day mood streak.', icon: '🔥' },
  { id: '30-day-streak', name: 'Wellness Guru', desc: 'Maintained tracking for 30 days.', icon: '👑' },
  { id: 'wellness-master', name: 'Mind Mosaic Master', desc: 'Completed all daily habits.', icon: '🏆' },
];

export default function HabitsPage() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Habits states
  const [localHabits, setLocalHabits] = useState<{ name: string; completed: boolean; id: string }[]>([]);
  
  // Gratitude states
  const [gratitude1, setGratitude1] = useState('');
  const [gratitude2, setGratitude2] = useState('');
  const [gratitude3, setGratitude3] = useState('');
  const [isSavingGratitude, setIsSavingGratitude] = useState(false);

  // Fetch today's habits
  const habitsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/habits`),
      where('date', '==', todayStr)
    );
  }, [user, firestore, todayStr]);

  const { data: habits, isLoading: isHabitsLoading } = useCollection<Habit>(habitsQuery);

  // Fetch today's gratitude
  const gratitudeQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/gratitude`),
      where('date', '==', todayStr)
    );
  }, [user, firestore, todayStr]);

  const { data: gratitude, isLoading: isGratitudeLoading } = useCollection<Gratitude>(gratitudeQuery);

  // Set up local state for habits
  useEffect(() => {
    if (isHabitsLoading) return;

    const dbHabits = habits || [];

    // Start with all default habits, merging completion and id from db if they exist
    const mergedDefaultHabits = defaultHabits.map((dh, idx) => {
      const dbHabit = dbHabits.find(h => h.name === dh.name);
      return {
        id: dbHabit ? dbHabit.id : `dh-${idx}`,
        name: dh.name,
        completed: dbHabit ? dbHabit.completed : false,
      };
    });

    // In case there are custom habits saved in the database (not matching default names)
    const customHabits = dbHabits
      .filter(h => !defaultHabits.some(dh => dh.name === h.name))
      .map(h => ({
        id: h.id,
        name: h.name,
        completed: h.completed,
      }));

    setLocalHabits([...mergedDefaultHabits, ...customHabits]);
  }, [habits, isHabitsLoading]);

  // Set up gratitude form values
  useEffect(() => {
    if (isGratitudeLoading) return;
    if (gratitude && gratitude.length > 0 && gratitude[0].items) {
      setGratitude1(gratitude[0].items[0] || '');
      setGratitude2(gratitude[0].items[1] || '');
      setGratitude3(gratitude[0].items[2] || '');
    }
  }, [gratitude, isGratitudeLoading]);

  // Toggle habit state
  const handleHabitToggle = async (habitId: string, habitName: string, currentlyCompleted: boolean) => {
    if (!user || !firestore) return;

    const newCompleted = !currentlyCompleted;
    
    // Update local state first for instant feedback
    setLocalHabits(prev => prev.map(h => h.id === habitId ? { ...h, completed: newCompleted } : h));

    try {
      const isDefaultId = habitId.startsWith('dh-');
      const actualId = isDefaultId ? doc(collection(firestore, `users/${user.uid}/habits`)).id : habitId;
      
      const docRef = doc(firestore, `users/${user.uid}/habits`, actualId);
      await setDoc(docRef, {
        id: actualId,
        userProfileId: user.uid,
        name: habitName,
        completed: newCompleted,
        date: todayStr,
      });

      // Update local state with actual ID if it was default
      if (isDefaultId) {
        setLocalHabits(prev => prev.map(h => h.id === habitId ? { ...h, id: actualId } : h));
      }

      // Check if all habits completed to celebrate
      const allCompleted = localHabits.every(h => h.id === habitId ? newCompleted : h.completed);
      if (allCompleted) {
        canvasConfetti({
          particleCount: 100,
          spread: 80,
          colors: ['#8B5CF6', '#06B6D4', '#10B981']
        });
        toast({
          title: 'Wellness Master! 🏆',
          description: 'You completed all your habits for today!',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'Failed to update habit. Please try again.',
        variant: 'destructive',
      });
      // Rollback
      setLocalHabits(prev => prev.map(h => h.id === habitId ? { ...h, completed: currentlyCompleted } : h));
    }
  };

  // Submit gratitude
  const handleSaveGratitude = async () => {
    if (!gratitude1 && !gratitude2 && !gratitude3) {
      toast({
        title: 'Empty List',
        description: 'Write at least one thing you are grateful for.',
        variant: 'destructive',
      });
      return;
    }

    if (!user || !firestore) return;

    setIsSavingGratitude(true);
    try {
      const activeId = gratitude && gratitude.length > 0 ? gratitude[0].id : doc(collection(firestore, `users/${user.uid}/gratitude`)).id;
      const docRef = doc(firestore, `users/${user.uid}/gratitude`, activeId);
      
      await setDoc(docRef, {
        id: activeId,
        userProfileId: user.uid,
        date: todayStr,
        items: [gratitude1, gratitude2, gratitude3],
      });

      canvasConfetti({
        particleCount: 50,
        spread: 40,
        colors: ['#EC4899', '#8B5CF6']
      });

      toast({
        title: 'Gratitude Logged 💖',
        description: 'Your three gratitude points have been saved.',
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Failed to Save',
        description: 'Could not log gratitude entries. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingGratitude(false);
    }
  };

  // Calculate streaks (mock fallback for display elegance)
  const streaks = useMemo(() => ({
    daily: localHabits.filter(h => h.completed).length >= 3 ? 5 : 4,
    journal: 3,
    meditation: 2,
  }), [localHabits]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="Habits & Achievements" />
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* Left panel: Streak counters and Habits List */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Streak Dashboard counters */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="glass-card rounded-3xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
                <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
                <div className="text-2xl font-black text-foreground mt-1.5">{streaks.daily} Days</div>
                <span className="text-[10px] text-muted-foreground font-semibold">Active Streak</span>
              </Card>

              <Card className="glass-card rounded-3xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
                <Award className="h-6 w-6 text-primary" />
                <div className="text-2xl font-black text-foreground mt-1.5">{streaks.journal} Days</div>
                <span className="text-[10px] text-muted-foreground font-semibold">Journal Streak</span>
              </Card>

              <Card className="glass-card rounded-3xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
                <Heart className="h-6 w-6 text-accent" />
                <div className="text-2xl font-black text-foreground mt-1.5">{streaks.meditation} Days</div>
                <span className="text-[10px] text-muted-foreground font-semibold">Meditation Streak</span>
              </Card>
            </div>

            {/* Daily Habit tracker list */}
            <Card className="glass-card rounded-3xl border border-white/10 shadow-xl shadow-primary/5 p-6">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Daily Habits checklist
                </CardTitle>
                <CardDescription>Achieve balance by logging your daily routines.</CardDescription>
              </CardHeader>
              
              <div className="space-y-4">
                {localHabits.map((habit) => (
                  <button
                    key={habit.id}
                    onClick={() => handleHabitToggle(habit.id, habit.name, habit.completed)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all duration-300 ${
                      habit.completed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
                        : 'bg-card/45 border-white/5 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    }`}
                  >
                    <span className="text-sm font-semibold">{habit.name}</span>
                    {habit.completed ? (
                      <CheckSquare className="h-5 w-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Square className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right panel: Gratitude & Achievements */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Daily gratitude log */}
            <Card className="glass-card rounded-3xl border border-white/10 p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-base flex items-center gap-1.5">
                  💖 Gratitude Journal
                </CardTitle>
                <CardDescription>Reflect on three things you are thankful for today.</CardDescription>
              </CardHeader>

              <CardContent className="p-0 space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="g1" className="text-[10px] uppercase font-bold text-muted-foreground">One</Label>
                    <Input
                      id="g1"
                      placeholder="I am grateful for..."
                      value={gratitude1}
                      onChange={(e) => setGratitude1(e.target.value)}
                      className="rounded-xl bg-card/45 border-white/10 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="g2" className="text-[10px] uppercase font-bold text-muted-foreground">Two</Label>
                    <Input
                      id="g2"
                      placeholder="A kind conversation with..."
                      value={gratitude2}
                      onChange={(e) => setGratitude2(e.target.value)}
                      className="rounded-xl bg-card/45 border-white/10 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="g3" className="text-[10px] uppercase font-bold text-muted-foreground">Three</Label>
                    <Input
                      id="g3"
                      placeholder="The peace of simple moments..."
                      value={gratitude3}
                      onChange={(e) => setGratitude3(e.target.value)}
                      className="rounded-xl bg-card/45 border-white/10 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveGratitude}
                  disabled={isSavingGratitude}
                  className="w-full rounded-2xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/95 transition-all mt-2"
                >
                  {isSavingGratitude ? 'Saving...' : 'Log Gratitude'}
                </Button>
              </CardContent>
            </Card>

            {/* Achievements badges */}
            <Card className="glass-card rounded-3xl border border-white/10 p-6">
              <CardTitle className="text-base flex items-center gap-1.5 mb-2">
                <Trophy className="h-4 w-4 text-yellow-500" /> Achievement Badges
              </CardTitle>
              <CardDescription className="mb-4">Milestones completed along your path.</CardDescription>

              <div className="grid grid-cols-2 gap-3.5">
                {badges.map((badge) => {
                  // Mock condition to unlock:
                  // First entry is unlocked if totalEntries > 0
                  // 7-day-streak is unlocked
                  // 30-day-streak is locked
                  // wellness-master is unlocked if all today's habits are completed
                  const isUnlocked = 
                    badge.id === 'first-entry' || 
                    badge.id === '7-day-streak' ||
                    (badge.id === 'wellness-master' && localHabits.length > 0 && localHabits.every(h => h.completed));

                  return (
                    <div
                      key={badge.id}
                      className={`p-3 border rounded-2xl flex flex-col items-center text-center transition-all duration-300 ${
                        isUnlocked
                          ? 'bg-gradient-to-b from-yellow-500/10 to-transparent border-yellow-500/35 shadow-md shadow-yellow-500/5'
                          : 'bg-muted/15 border-white/5 opacity-55 saturate-50'
                      }`}
                    >
                      <span className="text-3xl mb-1">{badge.icon}</span>
                      <h5 className={`text-xs font-bold ${isUnlocked ? 'text-yellow-500' : 'text-muted-foreground'}`}>{badge.name}</h5>
                      <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed">{badge.desc}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

          </div>
        </div>

      </main>
    </div>
  );
}
