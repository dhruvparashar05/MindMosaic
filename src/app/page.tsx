'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Smile,
  Bot,
  Notebook,
  CheckSquare,
  BarChart3,
  ArrowRight,
  Sun,
  Moon,
  Shield,
  Sparkles,
  Play,
  Pause,
  RefreshCw,
  User,
  Compass,
  Check,
  ChevronRight,
  Phone,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { useTheme } from '@/components/theme-provider';

export default function LandingPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { theme, toggleTheme } = useTheme();

  // Box-Breathing Widget States
  const [breathingActive, setBreathingActive] = useState(false);
  const [seconds, setSeconds] = useState(4);
  const [phase, setPhase] = useState<'inhale' | 'hold-in' | 'exhale' | 'hold-out'>('inhale');

  // Breathing timer logic
  useEffect(() => {
    if (!breathingActive) {
      setSeconds(4);
      setPhase('inhale');
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          // Switch phase
          setPhase((currPhase) => {
            switch (currPhase) {
              case 'inhale':
                return 'hold-in';
              case 'hold-in':
                return 'exhale';
              case 'exhale':
                return 'hold-out';
              case 'hold-out':
                return 'inhale';
            }
          });
          return 4; // Reset to 4 seconds for next phase
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breathingActive]);

  // Breathing visual configuration
  const getScale = () => {
    if (!breathingActive) return 1.0;
    if (phase === 'inhale') return 1.1 + (4 - seconds) * 0.1; // Smoothly scale up
    if (phase === 'hold-in') return 1.5;
    if (phase === 'exhale') return 1.5 - (4 - seconds) * 0.12; // Smoothly scale down
    return 1.0; // hold-out
  };

  const getPhaseColor = () => {
    if (!breathingActive) return 'border-primary bg-primary/10';
    switch (phase) {
      case 'inhale':
        return 'border-primary bg-primary/20 shadow-primary/30';
      case 'hold-in':
        return 'border-secondary bg-secondary/20 shadow-secondary/30';
      case 'exhale':
        return 'border-accent bg-accent/20 shadow-accent/30';
      case 'hold-out':
        return 'border-muted-foreground/30 bg-muted/20 shadow-muted/10';
    }
  };

  const getPhaseText = () => {
    if (!breathingActive) return 'Ready?';
    switch (phase) {
      case 'inhale':
        return 'Inhale';
      case 'hold-in':
        return 'Hold';
      case 'exhale':
        return 'Exhale';
      case 'hold-out':
        return 'Rest';
    }
  };

  const getPhaseDescription = () => {
    if (!breathingActive) return 'Click Start to begin a quick box-breathing session';
    switch (phase) {
      case 'inhale':
        return 'Fill your lungs slowly and steadily';
      case 'hold-in':
        return 'Keep your chest steady and calm';
      case 'exhale':
        return 'Release your breath gently and fully';
      case 'hold-out':
        return 'Await the next cycle peacefully';
    }
  };

  // Mock dashboard interactivity
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Drink 8 glasses of water', checked: true },
    { id: 2, text: '10 min morning stretch', checked: false },
    { id: 3, text: 'Write down three gratitudes', checked: false },
  ]);

  const toggleCheck = (id: number) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const moods = [
    { name: 'Radiant', emoji: '😊', color: 'from-amber-400 to-orange-400' },
    { name: 'Calm', emoji: '😌', color: 'from-teal-400 to-emerald-400' },
    { name: 'Tired', emoji: '🥱', color: 'from-blue-400 to-indigo-400' },
    { name: 'Anxious', emoji: '🥺', color: 'from-purple-400 to-pink-400' },
  ];

  return (
    <div className="min-h-screen flex flex-col selection:bg-primary selection:text-primary-foreground">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-md shadow-primary/20">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="font-headline font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary dark:from-white dark:to-zinc-300">
              Mind Mosaic
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#mindfulness" className="hover:text-foreground transition-colors">Mindfulness</a>
            <a href="#security" className="hover:text-foreground transition-colors">Privacy</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full hover:bg-muted/60 transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-zinc-700" />
              )}
            </Button>

            {!isUserLoading && user && !user.isAnonymous ? (
              <Link href="/dashboard">
                <Button className="rounded-full px-5 shadow-lg shadow-primary/20 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-block">
                  <Button variant="ghost" className="rounded-full px-5">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="rounded-full px-5 bg-gradient-to-r from-primary to-secondary hover:opacity-95 shadow-md shadow-primary/10 hover:shadow-primary/25 border-0">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 pb-16 md:pb-24 overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 flex flex-col text-left space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold text-primary w-fit shadow-inner"
              >
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>Piece Together Your Mental Well-being</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-headline text-foreground leading-[1.1]"
              >
                Create Your Own{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                  Mind Mosaic
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-muted-foreground font-body leading-relaxed max-w-xl"
              >
                Nurture your mental space step-by-step. Reflect on your daily experiences, log emotions, establish routines, listen to guided breaths, and seek insights from an intelligent personal guide.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap gap-4 pt-2"
              >
                <Link href="/signup">
                  <Button size="lg" className="rounded-2xl px-8 py-6 font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-95 shadow-xl shadow-primary/25 border-0 text-base group">
                    Start Your Mosaic Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="rounded-2xl px-8 py-6 border-border hover:bg-muted/40 text-base">
                    Access Account
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="flex items-center gap-6 pt-4 text-xs text-muted-foreground"
              >
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span>Privacy-First Storage</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary" />
                  <span>No Credit Card Required</span>
                </div>
              </motion.div>
            </div>

            {/* Right Interactive Mockup Dashboard */}
            <div className="lg:col-span-6 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative z-10 glass-card p-6 md:p-8 rounded-[2.5rem] border border-border/40 shadow-2xl flex flex-col gap-6"
              >
                {/* Simulated Header */}
                <div className="flex justify-between items-center pb-4 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs bg-muted/60 px-3 py-1 rounded-full text-muted-foreground font-medium font-code">
                    MindMosaic v1.0
                  </span>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mood Logger Card */}
                  <div className="bg-card/50 border border-border/30 p-4 rounded-3xl flex flex-col gap-3 shadow-sm hover:border-primary/30 transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Mood Tracker</span>
                      <Smile className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">How is your energy right now?</p>
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {moods.map((mood) => (
                        <button
                          key={mood.name}
                          onClick={() => setSelectedMood(mood.name)}
                          className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                            selectedMood === mood.name
                              ? 'bg-primary/10 border border-primary scale-105 shadow-inner'
                              : 'bg-muted/40 hover:bg-muted border border-transparent'
                          }`}
                        >
                          <span className="text-xl mb-1">{mood.emoji}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold">{mood.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Habits Checklist Card */}
                  <div className="bg-card/50 border border-border/30 p-4 rounded-3xl flex flex-col gap-3 shadow-sm hover:border-secondary/30 transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Habits</span>
                      <CheckSquare className="h-4 w-4 text-secondary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Today's Rituals</p>
                    <div className="flex flex-col gap-2">
                      {checklist.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => toggleCheck(item.id)}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            item.checked
                              ? 'bg-secondary border-secondary text-white'
                              : 'border-muted-foreground/30 group-hover:border-secondary'
                          }`}>
                            {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className={`text-[11px] font-medium transition-all ${
                            item.checked ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Coach Preview */}
                  <div className="bg-card/50 border border-border/30 p-4 rounded-3xl flex flex-col gap-2 shadow-sm hover:border-accent/30 transition-all duration-300 md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1">
                        <Bot className="h-3.5 w-3.5 text-accent" />
                        <span>AI Coach</span>
                      </span>
                      <span className="text-[10px] text-accent font-semibold animate-pulse">Online</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-xl bg-accent flex items-center justify-center text-white text-xs flex-shrink-0">
                        🤖
                      </div>
                      <div className="bg-accent/5 border border-accent/10 p-2.5 rounded-2xl rounded-tl-none">
                        <p className="text-[11px] text-foreground leading-normal font-medium">
                          "I notice you completed stretch habits 3 days in a row! Let's pause and appreciate that streak. How did it feel?"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Decorative backgrounds behind mockup */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-10 right-10 w-44 h-44 rounded-full bg-accent/20 blur-3xl animate-pulse" />
                <div className="absolute bottom-10 left-10 w-52 h-52 rounded-full bg-secondary/20 blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid ("The Mosaic of Tools") */}
      <section id="features" className="py-20 bg-muted/20 border-y border-border/30 relative">
        <div className="container mx-auto px-4 max-w-7xl text-center flex flex-col items-center gap-12">
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-primary">A Mosaic of Tools</h2>
            <h3 className="text-3xl sm:text-4xl font-headline font-bold text-foreground">
              Every element of mental fitness, unified.
            </h3>
            <p className="text-muted-foreground text-sm font-body leading-relaxed">
              We design specific spaces to address different states of your mind, coming together to build a gorgeous, complete mosaic of yourself.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {/* Feature 1: Mood Tracker */}
            <div className="glass-card hover:bg-card border border-border/40 p-6 rounded-3xl text-left flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 group">
              <div className="p-3 w-fit rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 shadow-inner">
                <Smile className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-lg text-foreground pt-1">Mood Track</h4>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                Log emotional notes and energy status in seconds. Identify subconscious patterns, cycles, and positive triggers over time.
              </p>
            </div>

            {/* Feature 2: AI Coach */}
            <div className="glass-card hover:bg-card border border-border/40 p-6 rounded-3xl text-left flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-secondary/5 hover:border-secondary/20 group">
              <div className="p-3 w-fit rounded-2xl bg-secondary/10 text-secondary transition-all duration-300 group-hover:scale-110 shadow-inner">
                <Bot className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-lg text-foreground pt-1">AI Coach & Mentor</h4>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                Engage in conversational wellness checks. Receive custom suggestions, cognitive logs, and gentle reminders to preserve your peace.
              </p>
            </div>

            {/* Feature 3: Digital Journal */}
            <div className="glass-card hover:bg-card border border-border/40 p-6 rounded-3xl text-left flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/5 hover:border-accent/20 group">
              <div className="p-3 w-fit rounded-2xl bg-accent/10 text-accent transition-all duration-300 group-hover:scale-110 shadow-inner">
                <Notebook className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-lg text-foreground pt-1">Gratitude Journal</h4>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                Reflect on daily logs with formatting aids. Store memorable insights, record details of accomplishments, and keep positive letters.
              </p>
            </div>

            {/* Feature 4: Meditation Center */}
            <div className="glass-card hover:bg-card border border-border/40 p-6 rounded-3xl text-left flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 group">
              <div className="p-3 w-fit rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 shadow-inner">
                <Heart className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-lg text-foreground pt-1">Meditation Audio</h4>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                Immerse yourself in calming nature tracks, sound baths, and timers structured to quiet down noisy states of distress.
              </p>
            </div>

            {/* Feature 5: Habits Tracker */}
            <div className="glass-card hover:bg-card border border-border/40 p-6 rounded-3xl text-left flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-secondary/5 hover:border-secondary/20 group">
              <div className="p-3 w-fit rounded-2xl bg-secondary/10 text-secondary transition-all duration-300 group-hover:scale-110 shadow-inner">
                <CheckSquare className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-lg text-foreground pt-1">Habit Routines</h4>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                Design custom habit schedules (hydration, physical activity, rest checks). Monitor consistent streaks to build sustainable health.
              </p>
            </div>

            {/* Feature 6: Advanced Analytics */}
            <div className="glass-card hover:bg-card border border-border/40 p-6 rounded-3xl text-left flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/5 hover:border-accent/20 group">
              <div className="p-3 w-fit rounded-2xl bg-accent/10 text-accent transition-all duration-300 group-hover:scale-110 shadow-inner">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-lg text-foreground pt-1">Insights Analytics</h4>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                Review interactive charts highlighting correlations. Check if specific meditation patterns or habits improve your weekly mood score.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mindfulness Widget Section */}
      <section id="mindfulness" className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Box-Breathing Widget */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
              <div className="relative w-80 h-80 flex items-center justify-center">
                {/* Animated Pulsing Circles */}
                <AnimatePresence>
                  <motion.div
                    style={{ transformOrigin: 'center' }}
                    animate={{
                      scale: getScale(),
                    }}
                    transition={{
                      duration: breathingActive ? 4 : 2,
                      ease: 'easeInOut',
                    }}
                    className={`absolute w-44 h-44 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-500 shadow-xl ${getPhaseColor()}`}
                  >
                    <span className="text-xl font-bold font-headline transition-colors">
                      {getPhaseText()}
                    </span>
                    {breathingActive && (
                      <span className="text-xs font-code font-bold mt-1 text-muted-foreground opacity-80">
                        {seconds}s
                      </span>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Decorative outer rings */}
                <div className="absolute inset-0 rounded-full border border-dashed border-border/30 animate-[spin_60s_linear_infinite]" />
                <div className="absolute inset-6 rounded-full border border-dashed border-border/20 animate-[spin_40s_linear_infinite_reverse]" />
              </div>

              {/* Breathing controls */}
              <div className="flex gap-3 mt-4 relative z-20">
                <Button
                  onClick={() => setBreathingActive(!breathingActive)}
                  className={`rounded-full px-6 font-semibold flex items-center gap-2 border-0 ${
                    breathingActive
                      ? 'bg-rose-500 hover:bg-rose-600 text-white'
                      : 'bg-primary hover:bg-primary-foreground text-primary-foreground'
                  }`}
                >
                  {breathingActive ? (
                    <>
                      <Pause className="h-4 w-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-white" /> Start Breathing
                    </>
                  )}
                </Button>
                {breathingActive && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBreathingActive(false);
                      setTimeout(() => setBreathingActive(true), 100);
                    }}
                    className="rounded-full hover:bg-muted"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Right Information */}
            <div className="lg:col-span-6 text-left space-y-6">
              <h2 className="text-xs uppercase font-extrabold tracking-widest text-secondary">Interactive Pause</h2>
              <h3 className="text-3xl sm:text-4xl font-headline font-bold text-foreground">
                Take a 1-minute mindfulness break right here.
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed font-body">
                Try <strong>Box Breathing</strong>—a practice used by athletes and professionals to clear stress and regain attention. Click start, relax your shoulders, and sync your breathing with the expanding circle:
              </p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary/15 flex items-center justify-center text-xs font-bold text-secondary flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    <strong>Inhale (4s):</strong> Fill your lungs as the circle expands.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary/15 flex items-center justify-center text-xs font-bold text-secondary flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    <strong>Hold (4s):</strong> Suspend your breath calmly as the circle sits in stasis.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary/15 flex items-center justify-center text-xs font-bold text-secondary flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    <strong>Exhale (4s):</strong> Release your breath completely as the circle contracts.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/40 rounded-2xl border border-border/30 text-xs font-medium text-muted-foreground flex gap-2.5 items-center">
                <Compass className="h-5 w-5 text-secondary flex-shrink-0" />
                <span>{getPhaseDescription()}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy and Trust Section */}
      <section id="security" className="py-20 bg-muted/10 border-t border-border/30">
        <div className="container mx-auto px-4 max-w-7xl text-center flex flex-col items-center gap-12">
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-accent">Safe & Secure</h2>
            <h3 className="text-3xl font-headline font-bold text-foreground">
              Your mental logs are private. Period.
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed font-body">
              Mind Mosaic values data safety above all else. We design structures to guarantee your journals, moods, and coach dialogues are private to you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <div className="flex flex-col items-center text-center gap-3 p-4">
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Shield className="h-8 w-8" />
              </div>
              <h4 className="font-bold text-lg text-foreground">Encrypted Accounts</h4>
              <p className="text-sm text-muted-foreground leading-relaxed font-body">
                We store your journals and credentials with secure database protections, preventing unauthorized access.
              </p>
            </div>

            <div className="flex flex-col items-center text-center gap-3 p-4">
              <div className="p-4 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <HelpCircle className="h-8 w-8" />
              </div>
              <h4 className="font-bold text-lg text-foreground">Anonymous Mode</h4>
              <p className="text-sm text-muted-foreground leading-relaxed font-body">
                Use the app instantly without sharing an email. Transition into registered users anytime to back up logs.
              </p>
            </div>

            <div className="flex flex-col items-center text-center gap-3 p-4">
              <div className="p-4 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h4 className="font-bold text-lg text-foreground">Safe AI Coaching</h4>
              <p className="text-sm text-muted-foreground leading-relaxed font-body">
                Talk to your wellness coach in private sessions. We never sell your chat logs or use them for external advertisement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Banner */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-tr from-primary/5 via-transparent to-secondary/5 border-t border-border/30">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card border border-border/40 p-8 md:p-12 rounded-[2rem] flex flex-col gap-6 items-center shadow-lg"
          >
            <span className="text-4xl">🧘‍♀️</span>
            <blockquote className="text-xl md:text-2xl font-headline font-medium italic text-foreground leading-relaxed">
              "The present moment is filled with joy and happiness. If you are attentive, you will see it."
            </blockquote>
            <cite className="text-sm not-italic font-bold text-primary tracking-wider uppercase">
              — Thich Nhat Hanh
            </cite>
          </motion.div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-16 md:py-24 relative overflow-hidden border-t border-border/30 bg-card">
        <div className="container mx-auto px-4 max-w-5xl text-center relative z-10 flex flex-col items-center gap-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline text-foreground tracking-tight">
            Ready to cultivate your mind?
          </h2>
          <p className="text-muted-foreground text-base max-w-xl font-body leading-relaxed">
            Join thousands of users tracking their habits, documenting gratitude daily, and finding peace. Start building your personal Mind Mosaic today.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link href="/signup">
              <Button size="lg" className="rounded-2xl px-8 py-6 font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-95 shadow-xl shadow-primary/25 border-0 text-base">
                Join Mind Mosaic Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="rounded-2xl px-8 py-6 border-border hover:bg-muted/40 text-base">
                Sign In to Account
              </Button>
            </Link>
          </div>
        </div>

        {/* Floating Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/10 blur-[100px] pointer-events-none -z-10" />
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border/30 py-12">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Heart className="h-4 w-4" />
            </div>
            <span className="font-headline font-bold text-foreground">
              Mind Mosaic
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#mindfulness" className="hover:text-foreground transition-colors">Breathing widget</a>
            <a href="#security" className="hover:text-foreground transition-colors">Privacy practices</a>
          </div>

          <div className="text-xs text-center md:text-right">
            <span>Made with care to cultivate mindfulness. © {new Date().getFullYear()} Mind Mosaic. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
