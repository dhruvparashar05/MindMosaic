'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { collection, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bold, Italic, List, Image as ImageIcon, Save, ArrowLeft, Brain, Check } from 'lucide-react';

const journalTags = ['Work', 'Study', 'Family', 'Health', 'Friends', 'Gratitude', 'Self-Care'];

// Calming nature nature placeholders
const placeholderImages = [
  'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=400&q=80', // Zen stones
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80', // Sunset meditation
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=400&q=80', // Forest path
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80', // Misty mountains
];

export default function NewJournalEntryPage() {
  const { user, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Auto-save & Status
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const docIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // AI Analysis Results
  const [aiAnalysis, setAiAnalysis] = useState<{
    sentiment: string;
    emotion: string;
    summary: string;
    recommendation: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Markdown Formatting Toolbar Helpers
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormat = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = prefix + selectedText + suffix;

    setContent(
      text.substring(0, start) + replacement + text.substring(end)
    );

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Debounced auto-save effect
  useEffect(() => {
    if (!title && !content) return;
    if (!user || !firestore) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSaveStatus('saving');

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        
        // If document doesn't exist yet, we generate a doc ref
        if (!docIdRef.current) {
          const newDocRef = doc(collection(firestore, `users/${user.uid}/journalEntries`));
          docIdRef.current = newDocRef.id;
        }

        const entryRef = doc(firestore, `users/${user.uid}/journalEntries`, docIdRef.current);
        const data = {
          id: docIdRef.current,
          userProfileId: user.uid,
          title: title || 'Untitled Entry',
          content: content || '',
          isPublished: false, // draft
          tags: selectedTags,
          imageUrl: selectedImage,
          dateCreated: serverTimestamp(),
          sentiment: aiAnalysis?.sentiment || 'neutral',
          emotion: aiAnalysis?.emotion || 'Calm',
          summary: aiAnalysis?.summary || '',
          recommendation: aiAnalysis?.recommendation || '',
        };

        await setDoc(entryRef, data);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('idle');
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [title, content, selectedTags, selectedImage, user, firestore]);

  // AI Sentiment analysis call
  const triggerAiAnalysis = async () => {
    if (!content.trim()) {
      toast({
        title: 'Empty Thoughts',
        description: 'Please write some thoughts before triggers AI analysis.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/journal/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error('Analysis request failed');
      const data = await res.json();
      setAiAnalysis(data);
      
      toast({
        title: 'AI Analysis Complete!',
        description: `Primary Emotion: ${data.emotion}`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'AI Coach Busy',
        description: 'Failed to run analysis. Standard wellness recommendations applied.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Final manual save (Draft / Publish)
  const handleSave = async (isPublished: boolean) => {
    if (!title || !content) {
      toast({
        title: 'Missing Fields',
        description: 'Please provide a title and content for your entry.',
        variant: 'destructive',
      });
      return;
    }

    if (!user || !firestore) return;

    try {
      setIsSaving(true);
      const activeId = docIdRef.current || doc(collection(firestore, `users/${user.uid}/journalEntries`)).id;
      const entryRef = doc(firestore, `users/${user.uid}/journalEntries`, activeId);
      
      const payload = {
        id: activeId,
        userProfileId: user.uid,
        title,
        content,
        isPublished,
        tags: selectedTags,
        imageUrl: selectedImage,
        dateCreated: serverTimestamp(),
        sentiment: aiAnalysis?.sentiment || 'neutral',
        emotion: aiAnalysis?.emotion || 'Calm',
        summary: aiAnalysis?.summary || '',
        recommendation: aiAnalysis?.recommendation || '',
      };

      await setDoc(entryRef, payload);
      
      toast({
        title: isPublished ? 'Entry Published!' : 'Draft Saved!',
        description: `Your journal entry was successfully saved.`,
      });

      router.push('/journal');
    } catch (err) {
      console.error(err);
      toast({
        title: 'Save Failed',
        description: 'Error saving entry. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasDistress = content.toLowerCase().includes('suicide') || 
                      content.toLowerCase().includes('self-harm') || 
                      content.toLowerCase().includes('kill myself') || 
                      content.toLowerCase().includes('end my life') ||
                      content.toLowerCase().includes('harm myself');

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="New Journal Entry" />
      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Navigation link back */}
        <div className="flex justify-between items-center">
          <Button variant="ghost" className="rounded-2xl" asChild>
            <Link href="/journal">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Journal
            </Link>
          </Button>

          <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/40 px-3 py-1 rounded-full border border-white/5">
            <span className={`w-2 h-2 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-500' : saveStatus === 'saving' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-500'}`} />
            {saveStatus === 'saved' ? 'Saved to cloud' : saveStatus === 'saving' ? 'Saving changes...' : 'Draft unsaved'}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Main write card */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="glass-card rounded-3xl border border-white/10 shadow-xl shadow-primary/5 overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle>What's on your mind today?</CardTitle>
                <CardDescription>Express yourself freely. Auto-save is active.</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                
                {/* Emergency distress banner */}
                <AnimatePresence>
                  {hasDistress && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-rose-500/20 border border-rose-500/35 rounded-2xl text-rose-200"
                    >
                      <p className="font-bold text-sm">You seem to be going through a difficult time.</p>
                      <p className="text-xs mt-1.5 leading-relaxed">
                        Please remember that you don't have to carry this alone. Help is available:
                        <br />
                        📞 **National Suicide Prevention Lifeline**: Call or text 988 (Available 24/7)
                        <br />
                        💬 **Crisis Text Line**: Text HOME to 741741 to connect with a crisis counselor
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-semibold text-foreground/80">Title</Label>
                  <Input
                    id="title"
                    placeholder="Reflecting on a calm afternoon..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSaving}
                    className="rounded-2xl bg-card/45 border-white/10 text-base py-5 focus:border-primary/50"
                  />
                </div>

                {/* Content with markdown formatting toolbar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="content" className="font-semibold text-foreground/80">Your Thoughts</Label>
                    
                    {/* Rich text formatting bar */}
                    <div className="flex gap-1 bg-muted/30 border border-white/5 p-1 rounded-xl">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertFormat('**', '**')} title="Bold">
                        <Bold className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertFormat('*', '*')} title="Italic">
                        <Italic className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertFormat('\n- ')} title="Bullet List">
                        <List className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    id="content"
                    ref={textareaRef}
                    placeholder="Start typing your entry here... use toolbar to format bold or bullet lists."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isSaving}
                    className="min-h-[250px] rounded-2xl bg-card/45 border-white/10 text-base focus:border-primary/50 p-4"
                  />
                </div>

                {/* Tag selector */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground/80">Context Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {journalTags.map(tag => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <Badge
                          key={tag}
                          variant="outline"
                          onClick={() => toggleTag(tag)}
                          className={`cursor-pointer rounded-full px-3 py-1 transition-all duration-200 ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card/45 border-white/10 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {tag}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Calming Nature Image Carousel Selector */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-primary" /> Attach Calming Cover
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {placeholderImages.map((img, idx) => {
                      const isSelected = selectedImage === img;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImage(isSelected ? null : img)}
                          className={`relative aspect-video rounded-xl overflow-hidden border transition-all duration-300 ${
                            isSelected ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-white/5 hover:opacity-80'
                          }`}
                        >
                          <img src={img} alt="Nature space" className="object-cover w-full h-full" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Check className="h-5 w-5 text-white bg-primary rounded-full p-1" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 border-t border-border/20 pt-4">
                  <Button
                    onClick={triggerAiAnalysis}
                    disabled={isAnalyzing || !content.trim()}
                    className="rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-primary hover:from-primary/20 hover:to-accent/20 transition-all gap-1.5"
                  >
                    <Brain className="h-4 w-4 animate-pulse text-accent" />
                    {isAnalyzing ? 'Analyzing...' : 'Analyze with AI Coach'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleSave(false)}
                    disabled={isSaving || !title || !content}
                    className="rounded-2xl border-white/10 hover:bg-muted/40"
                  >
                    <Save className="mr-2 h-4 w-4 text-muted-foreground" />
                    Save Draft
                  </Button>
                  
                  <Button
                    onClick={() => handleSave(true)}
                    disabled={isSaving || !title || !content}
                    className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/95"
                  >
                    Publish Entry
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Right panel: AI coach responses */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="glass-card rounded-3xl border border-white/10 shadow-xl shadow-accent/5 p-6 h-full flex flex-col justify-between">
              <div>
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent animate-spin-slow" /> AI Coach Companion
                  </CardTitle>
                  <CardDescription>
                    Real-time emotional evaluation of your writing.
                  </CardDescription>
                </CardHeader>
                
                <AnimatePresence mode="wait">
                  {aiAnalysis ? (
                    <motion.div
                      key="analysis-results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl text-center">
                          <p className="text-[10px] text-muted-foreground font-semibold">Sentiment</p>
                          <p className="text-sm font-bold text-primary mt-0.5 capitalize">{aiAnalysis.sentiment}</p>
                        </div>
                        <div className="p-3 bg-accent/10 border border-accent/20 rounded-2xl text-center">
                          <p className="text-[10px] text-muted-foreground font-semibold">Primary Emotion</p>
                          <p className="text-sm font-bold text-accent mt-0.5 capitalize">{aiAnalysis.emotion}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-muted/15 border border-white/5 rounded-2xl">
                        <p className="text-[10px] text-muted-foreground font-semibold">AI Summary</p>
                        <p className="text-xs text-foreground mt-1 leading-relaxed">"{aiAnalysis.summary}"</p>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl">
                        <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">Coach Suggestion</p>
                        <p className="text-xs font-medium text-emerald-100/90 mt-1 leading-relaxed">{aiAnalysis.recommendation}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 space-y-3"
                    >
                      <p className="text-4xl text-muted-foreground/30">📔</p>
                      <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                        Write down your thoughts and click "Analyze with AI Coach" to retrieve custom recommendations.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-[10px] text-muted-foreground text-center mt-6">
                All evaluations are private and secure.
              </div>
            </Card>
          </div>
        </div>

      </main>
    </div>
  );
}
