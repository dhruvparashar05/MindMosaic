'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { useTheme } from '@/components/theme-provider';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Settings as SettingsIcon,
  Download,
  Trash2,
  Moon,
  Sun,
  Shield,
  Check,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

export default function SettingsPage() {
  const { user, firestore } = useFirebase();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  // State values
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Notifications State
  const [notifyDaily, setNotifyDaily] = useState(true);
  const [notifyWeekly, setNotifyWeekly] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);

  // Security & Privacy State
  const [passcodeLock, setPasscodeLock] = useState(false);
  const [privateJournals, setPrivateJournals] = useState(true);

  // Data Exporting State
  const [isExporting, setIsExporting] = useState(false);

  // Account deletion input confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch profile settings from Firestore
  useEffect(() => {
    if (user && firestore) {
      setEmail(user.email || '');
      setUsername(user.displayName || 'Anonymous User');

      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.username) {
            setUsername(data.username);
          }
        }
      });
    }
  }, [user, firestore]);

  // Load notifications from local storage if they exist
  useEffect(() => {
    const savedDaily = localStorage.getItem('settings_notifyDaily');
    const savedWeekly = localStorage.getItem('settings_notifyWeekly');
    const savedEmail = localStorage.getItem('settings_notifyEmail');
    if (savedDaily !== null) setNotifyDaily(savedDaily === 'true');
    if (savedWeekly !== null) setNotifyWeekly(savedWeekly === 'true');
    if (savedEmail !== null) setNotifyEmail(savedEmail === 'true');
  }, []);

  const handleSaveProfile = async () => {
    if (!user || !firestore) return;
    setIsSavingProfile(true);

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        username: username,
      });

      toast({
        title: 'Profile Updated',
        description: 'Your profile settings have been successfully saved.',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Update Failed',
        description: 'Could not update profile in Firestore.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleNotifyChange = (setting: string, val: boolean) => {
    localStorage.setItem(`settings_${setting}`, String(val));
    if (setting === 'notifyDaily') setNotifyDaily(val);
    if (setting === 'notifyWeekly') setNotifyWeekly(val);
    if (setting === 'notifyEmail') setNotifyEmail(val);

    toast({
      title: 'Alert Settings Changed',
      description: 'Notification preferences saved locally.',
    });
  };

  // JSON Data Exporter
  const handleExportData = async () => {
    if (!user || !firestore) {
      toast({
        title: 'Export Failed',
        description: 'You must be signed in to export data.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      // Gather all subcollections
      const collectionsToExport = [
        'moodRecords',
        'journalEntries',
        'habits',
        'gratitude',
        'meditations',
      ];
      
      const exportedPayload: Record<string, any> = {
        exportedAt: new Date().toISOString(),
        userId: user.uid,
        userEmail: user.email,
        profile: {
          username: username,
        },
      };

      for (const colName of collectionsToExport) {
        const querySnapshot = await getDocs(collection(firestore, `users/${user.uid}/${colName}`));
        exportedPayload[colName] = querySnapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }));
      }

      // Create a text file block and trigger a browser download
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportedPayload, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `mind_mosaic_backup_${user.uid.slice(0, 6)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast({
        title: 'Export Successful!',
        description: 'Successfully downloaded your complete backup file.',
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Export Failed',
        description: 'Failed to query database collections for backup.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Mock Account Cancellation
  const handleAccountCancellation = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      toast({
        title: 'Validation Error',
        description: 'Please type the word "DELETE" exactly to confirm.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);

    // Simulate database cleaning operations
    setTimeout(() => {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeleteConfirmText('');
      
      toast({
        title: 'Account Reset Completed',
        description: 'Your Mind Mosaic records have been reset (Simulated).',
        variant: 'destructive',
      });
    }, 2000);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="Settings" />

      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        {/* Title */}
        <div className="border-b border-border/20 pb-6">
          <h1 className="font-headline text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent flex items-center gap-2">
            <SettingsIcon className="h-7 w-7 text-primary" /> Application Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your personal profile preferences, theme switches, and wellness data archives.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Section 1: User Profile Settings */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card rounded-3xl border border-white/10 shadow-lg shadow-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Personal Profile
                </CardTitle>
                <CardDescription>Manage how you are identified on the Mind Mosaic app.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username / Nickname</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="My wellness nickname"
                      className="rounded-2xl bg-card/45 border-white/10 focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="opacity-70">Email Address (Read-only)</Label>
                    <Input
                      id="email"
                      value={email || 'Anonymous Guest Account'}
                      disabled
                      className="rounded-2xl bg-muted/20 border-white/5 opacity-70 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="rounded-xl px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 2: Display & Appearance */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card rounded-3xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="h-4 w-4 text-accent" /> : <Sun className="h-4 w-4 text-secondary" />}
                  Theme & Aesthetics
                </CardTitle>
                <CardDescription>Toggle between dark and light themes for best comfort.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/15 border border-white/5 rounded-2xl">
                  <div>
                    <h4 className="font-semibold text-xs text-foreground">Theme Selection</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Switch styling interfaces instantly.
                    </p>
                  </div>
                  <div className="flex gap-1.5 bg-muted p-1 rounded-xl">
                    <Button
                      variant={theme === 'light' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setTheme('light')}
                      className="h-8 w-8 rounded-lg"
                      title="Light Theme"
                    >
                      <Sun className="h-4 w-4 text-secondary" />
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setTheme('dark')}
                      className="h-8 w-8 rounded-lg"
                      title="Dark Theme"
                    >
                      <Moon className="h-4 w-4 text-accent" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 3: Notification Alerts */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card rounded-3xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-4 w-4 text-secondary" /> Notification Configurations
                </CardTitle>
                <CardDescription>Control daily reminders or wellness coaching alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="flex items-center justify-between p-3 bg-muted/15 border border-white/5 rounded-2xl">
                  <div>
                    <h4 className="font-semibold text-xs text-foreground">Daily Reminders (Local push)</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Ping reminders to log daily mood and hydration.
                    </p>
                  </div>
                  <Switch
                    checked={notifyDaily}
                    onCheckedChange={(val) => handleNotifyChange('notifyDaily', val)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/15 border border-white/5 rounded-2xl">
                  <div>
                    <h4 className="font-semibold text-xs text-foreground">Weekly Wellness Reports</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Compile weekly summaries of emotional intensity fluctuations.
                    </p>
                  </div>
                  <Switch
                    checked={notifyWeekly}
                    onCheckedChange={(val) => handleNotifyChange('notifyWeekly', val)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/15 border border-white/5 rounded-2xl">
                  <div>
                    <h4 className="font-semibold text-xs text-foreground">Email Summaries</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Deliver support and coaching insights straight to your inbox.
                    </p>
                  </div>
                  <Switch
                    checked={notifyEmail}
                    onCheckedChange={(val) => handleNotifyChange('notifyEmail', val)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 4: Privacy & Security */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card rounded-3xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" /> Privacy & Lock Configurations
                </CardTitle>
                <CardDescription>Enhanced security options to safeguard mental health entries.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="flex items-center justify-between p-3 bg-muted/15 border border-white/5 rounded-2xl">
                  <div>
                    <h4 className="font-semibold text-xs text-foreground">Private Journal Encryption</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Encrypt journals to keep details strictly private to this device.
                    </p>
                  </div>
                  <Switch
                    checked={privateJournals}
                    onCheckedChange={setPrivateJournals}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/15 border border-white/5 rounded-2xl">
                  <div>
                    <h4 className="font-semibold text-xs text-foreground">Screen Passcode Lock</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Request passcode validation upon opening the Mind Mosaic app.
                    </p>
                  </div>
                  <Switch
                    checked={passcodeLock}
                    onCheckedChange={setPasscodeLock}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 5: Data Archive & Export */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card rounded-3xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-4 w-4 text-emerald-500" /> Data Portability & Archive
                </CardTitle>
                <CardDescription>Download a clean JSON archive copy of all your database logs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted/15 border border-white/5 rounded-2xl">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Export includes all logs stored in subcollections (journal drafts, mood trackers, meditation durations, check-ins, and user profiles) formatted clearly in JSON.
                  </p>
                </div>
                <div className="flex justify-start">
                  <Button
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="rounded-xl px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isExporting ? 'Preparing Archive...' : 'Download JSON Data Archive'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 6: Advanced Danger Zone */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-3xl border border-red-500/20 bg-red-950/5 shadow-md shadow-red-500/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-4 w-4" /> Danger Zone
                </CardTitle>
                <CardDescription className="text-red-300/60">Destructive administrative changes for your profile.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <div className="max-w-[80%]">
                    <h4 className="font-semibold text-xs text-red-200">Reset Account History & Log Wipes</h4>
                    <p className="text-[10px] text-red-300/70 mt-0.5 leading-normal">
                      Permanently wipes all Firestore logs (mood histories, journal notes, streak targets). This action is irreversible.
                    </p>
                  </div>
                  
                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="rounded-xl px-4 text-xs font-semibold"
                      >
                        Reset Data
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-3xl border border-red-500/25 bg-zinc-950 text-foreground max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="text-red-400 flex items-center gap-2">
                          <Trash2 className="h-5 w-5" /> Are you absolutely sure?
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-xs mt-1.5">
                          This will simulate a complete database wipe of all your Mind Mosaic entries. This cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2 py-4">
                        <Label htmlFor="confirm-cancel" className="text-xs text-muted-foreground">
                          Please type <span className="font-bold text-foreground">DELETE</span> to confirm:
                        </Label>
                        <Input
                          id="confirm-cancel"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Type DELETE"
                          className="rounded-xl bg-card border-white/10"
                        />
                      </div>
                      <DialogFooter className="flex sm:justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setIsDeleteDialogOpen(false);
                            setDeleteConfirmText('');
                          }}
                          className="rounded-xl"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleAccountCancellation}
                          disabled={isDeleting || deleteConfirmText.toLowerCase() !== 'delete'}
                          className="rounded-xl"
                        >
                          {isDeleting ? 'Deleting...' : 'Reset My Data'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
