'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, Volume2, Wind, Music, Sparkles, Timer } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebase } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import canvasConfetti from 'canvas-confetti';

// Royalty-free loop URLs
const ambientSounds = [
  { id: 'rain', name: 'Rainfall 🌧️', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, // Placeholder streams
  { id: 'waves', name: 'Ocean Waves 🌊', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'forest', name: 'Forest Birds 🌲', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

const sessions = [
  { id: 'morning', title: 'Mindful Morning 🌅', duration: 300, description: 'Awaken your focus and set positive daily intentions.' },
  { id: 'stress', title: 'Stress Release 🍃', duration: 600, description: 'Calm the nervous system and clear mental clutter.' },
  { id: 'sleep', title: 'Deep Sleep Wind-down 🌙', duration: 900, description: 'Relax fully and transition into deep restful sleep.' },
];

export default function MeditationPage() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  // Focus Timer States
  const [timerDuration, setTimerDuration] = useState(300); // 5 mins
  const [timeLeft, setTimeLeft] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Session title state & refs
  const [activeSessionTitle, setActiveSessionTitle] = useState('Custom Meditation 🧘');
  const sessionTitleRef = useRef('Custom Meditation 🧘');
  const sessionDurationRef = useRef(300);

  // Breathing Visualizer States
  const [breathState, setBreathState] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [breathSeconds, setBreathSeconds] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Playback States
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState<number[]>([60]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const logMeditationSession = async (title: string, durationSecs: number) => {
    if (!user || !firestore) return;
    try {
      const collectionRef = collection(firestore, `users/${user.uid}/meditations`);
      await addDocumentNonBlocking(collectionRef, {
        userProfileId: user.uid,
        sessionTitle: title,
        duration: durationSecs,
        dateLogged: serverTimestamp(),
      });

      canvasConfetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#06B6D4', '#8B5CF6', '#EC4899'],
      });

      toast({
        title: 'Meditation Complete & Logged!',
        description: `Successfully recorded "${title}" for ${Math.round(durationSecs / 60)} minutes.`,
      });
    } catch (e) {
      console.error('Error logging meditation session:', e);
    }
  };

  // Timer Tick
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            // Play completion chime
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
              audio.volume = 0.5;
              audio.play();
            } catch (e) {}

            logMeditationSession(sessionTitleRef.current, sessionDurationRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  // Breathing Cycle
  useEffect(() => {
    if (isBreathingActive) {
      breathingIntervalRef.current = setInterval(() => {
        setBreathSeconds((prev) => {
          if (prev <= 1) {
            // Swap state
            setBreathState((curr) => {
              if (curr === 'Inhale') return 'Hold';
              if (curr === 'Hold') return 'Exhale';
              if (curr === 'Exhale') return 'Rest';
              return 'Inhale';
            });
            return 4; // 4s cycles
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
      setBreathState('Inhale');
      setBreathSeconds(4);
    }

    return () => {
      if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
    };
  }, [isBreathingActive]);

  // Ambient Audio volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  // Audio Playback trigger
  const handleSoundToggle = (soundId: string, url: string) => {
    if (activeSound === soundId) {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setActiveSound(null);
    } else {
      // Play new
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setActiveSound(soundId);
      audioRef.current = new Audio(url);
      audioRef.current.loop = true;
      audioRef.current.volume = volume[0] / 100;
      audioRef.current.play().catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  };

  // Stop sound on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const startSession = (duration: number, title: string = 'Custom Meditation 🧘') => {
    setActiveSessionTitle(title);
    sessionTitleRef.current = title;
    setTimerDuration(duration);
    sessionDurationRef.current = duration;
    setTimeLeft(duration);
    setIsTimerRunning(true);
    setIsBreathingActive(true);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(timerDuration);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="Meditation" />
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* Left Side: Focus Timer & Breathing visualizer */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Focus timer card */}
            <Card className="glass-card rounded-3xl border border-white/10 shadow-xl shadow-primary/5 p-6 flex flex-col items-center text-center">
              <CardTitle className="text-xl flex items-center gap-2 mb-6">
                <Timer className="h-5 w-5 text-primary" /> Meditation Focus Timer
              </CardTitle>

              <div className="relative flex items-center justify-center w-52 h-52 rounded-full border border-white/10 bg-muted/10 shadow-inner">
                {/* Radial progress ring */}
                <div className="absolute text-5xl font-extrabold tracking-widest text-foreground font-code">
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Time selection buttons */}
              <div className="flex gap-2.5 mt-6">
                {[60, 300, 600, 900].map((duration) => (
                  <Button
                    key={duration}
                    variant={timerDuration === duration ? 'secondary' : 'outline'}
                    size="sm"
                    className="rounded-full px-4 text-xs font-semibold"
                    onClick={() => {
                      setTimerDuration(duration);
                      setTimeLeft(duration);
                      setIsTimerRunning(false);
                    }}
                  >
                    {duration === 60 ? '1 min' : `${duration / 60} mins`}
                  </Button>
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 mt-6">
                <Button
                  onClick={resetTimer}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-white/10"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  size="lg"
                  className="rounded-full px-8 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold"
                >
                  {isTimerRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                  {isTimerRunning ? 'Pause' : 'Start Focus'}
                </Button>
              </div>
            </Card>

            {/* Breathing Visualizer */}
            <Card className="glass-card rounded-3xl border border-white/10 p-6 flex flex-col items-center">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg flex items-center gap-2 justify-center">
                  <Wind className="h-5 w-5 text-secondary" /> Breathing Visualizer
                </CardTitle>
                <CardDescription>Follow the circle to sync your breathing cycles.</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col items-center gap-6 w-full">
                
                {/* Animated Circle */}
                <div className="h-48 flex items-center justify-center relative w-full">
                  <motion.div
                    animate={{
                      scale: isBreathingActive
                        ? (breathState === 'Inhale'
                          ? 1.6
                          : breathState === 'Hold'
                            ? 1.6
                            : breathState === 'Exhale'
                              ? 1.0
                              : 1.0)
                        : 1.0
                    }}
                    transition={{
                      duration: 4,
                      ease: 'easeInOut'
                    }}
                    className={`w-28 h-28 rounded-full flex flex-col items-center justify-center text-center shadow-lg transition-colors duration-500 ${
                      breathState === 'Inhale'
                        ? 'bg-primary/20 border-2 border-primary shadow-primary/20'
                        : breathState === 'Hold'
                          ? 'bg-accent/20 border-2 border-accent shadow-accent/20'
                          : breathState === 'Exhale'
                            ? 'bg-secondary/20 border-2 border-secondary shadow-secondary/20'
                            : 'bg-muted/30 border-2 border-white/10'
                    }`}
                  >
                    <span className="text-xs text-muted-foreground font-bold tracking-widest uppercase">
                      {isBreathingActive ? breathState : 'Breath'}
                    </span>
                    <span className="text-2xl font-bold text-foreground mt-1">
                      {isBreathingActive ? breathSeconds : '🧘'}
                    </span>
                  </motion.div>
                </div>

                <Button
                  onClick={() => setIsBreathingActive(!isBreathingActive)}
                  variant="outline"
                  className="rounded-full px-6 border-white/10 hover:bg-muted/40"
                >
                  {isBreathingActive ? 'Stop Breathing Assist' : 'Start Breathing Assist'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Sound triggers and Sessions */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Guided Meditation list */}
            <Card className="glass-card rounded-3xl border border-white/10 p-6">
              <CardTitle className="text-base flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-accent" /> Guided Sessions
              </CardTitle>
              <div className="space-y-4">
                {sessions.map((sess) => (
                  <div key={sess.id} className="p-4 bg-muted/15 border border-white/5 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm text-foreground">{sess.title}</h4>
                      <span className="text-[10px] text-muted-foreground font-bold">{sess.duration / 60} mins</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{sess.description}</p>
                    <Button
                      size="sm"
                      onClick={() => startSession(sess.duration, sess.title)}
                      className="w-full rounded-xl bg-muted border border-white/5 hover:bg-primary/20 hover:text-primary transition-all text-xs font-semibold"
                    >
                      Start Session
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Ambient Sound controllers */}
            <Card className="glass-card rounded-3xl border border-white/10 p-6">
              <CardTitle className="text-base flex items-center gap-2 mb-2">
                <Music className="h-4 w-4 text-secondary" /> Ambient Sounds
              </CardTitle>
              <CardDescription className="mb-4">Mix background sounds for focus or sleep.</CardDescription>
              
              <div className="space-y-4">
                {ambientSounds.map((sound) => {
                  const isPlaying = activeSound === sound.id;
                  return (
                    <div key={sound.id} className="flex justify-between items-center gap-3 p-3 bg-muted/15 border border-white/5 rounded-2xl">
                      <span className="text-xs font-semibold text-foreground/80">{sound.name}</span>
                      <Button
                        size="icon"
                        variant={isPlaying ? 'secondary' : 'outline'}
                        className="h-8 w-8 rounded-full border-white/10 shrink-0"
                        onClick={() => handleSoundToggle(sound.id, sound.url)}
                      >
                        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  );
                })}

                {/* Shared volume control */}
                {activeSound && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Volume2 className="h-3 w-3" /> Volume</span>
                      <span>{volume[0]}%</span>
                    </div>
                    <Slider
                      value={volume}
                      onValueChange={setVolume}
                      max={100}
                      min={0}
                      step={5}
                    />
                  </div>
                )}
              </div>
            </Card>

          </div>
        </div>

      </main>
    </div>
  );
}
