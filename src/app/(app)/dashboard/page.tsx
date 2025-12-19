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
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import MoodChart from '@/app/(app)/mood-tracker/mood-chart';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useState } from 'react';

interface JournalEntry {
  id: string;
}

interface Appointment {
    id: string;
    professionalName: string;
    dateTime: Timestamp;
}

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  const journalEntriesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/journalEntries`);
  }, [user, firestore]);

  const { data: journalEntries, isLoading: isEntriesLoading } = useCollection<JournalEntry>(journalEntriesQuery);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, `users/${user.uid}/appointments`),
        where('dateTime', '>=', Timestamp.now())
    );
  }, [user, firestore]);

  const { data: appointments, isLoading: isAppointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

  const entryCount = journalEntries?.length ?? 0;

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'No date';
    return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleDelete = (appointmentId: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, `users/${user.uid}/appointments`, appointmentId);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: 'Appointment Canceled',
      description: 'The appointment has been successfully removed.',
    });
    setAppointmentToDelete(null);
  };


  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="Dashboard" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                How are you feeling?
              </CardTitle>
              <Smile className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Today is a new day</div>
              <p className="text-xs text-muted-foreground">
                Track your mood to see your progress
              </p>
              <Button size="sm" className="mt-4" asChild>
                <Link href="/mood-tracker">
                  Track Mood <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Your Personal Journal
              </CardTitle>
              <Notebook className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isEntriesLoading ? '...' : `${entryCount} ${entryCount === 1 ? 'Entry' : 'Entries'}`}
              </div>
              <p className="text-xs text-muted-foreground">
                Reflect on your thoughts and feelings
              </p>
              <Button size="sm" className="mt-4" asChild>
                <Link href="/journal">
                  Open Journal <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Curated Resources
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Explore Library</div>
              <p className="text-xs text-muted-foreground">
                Videos and articles for your well-being
              </p>
              <Button size="sm" className="mt-4" asChild>
                <Link href="/resources">
                  View Resources <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                AI Assistant
              </CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Always Available</div>
              <p className="text-xs text-muted-foreground">
                Chat with our AI for support
              </p>
              <Button size="sm" className="mt-4" asChild>
                <Link href="/chatbot">
                  Start Chatting <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Recent Mood Trends</CardTitle>
              <CardDescription>
                A look at your mood fluctuations over the last 7 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MoodChart />
            </CardContent>
          </Card>
           <Card>
                <CardHeader>
                    <CardTitle>Upcoming Appointments</CardTitle>
                    <CardDescription>
                        Your scheduled sessions with our professionals.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {isAppointmentsLoading ? (
                        <>
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </>
                    ) : appointments && appointments.length > 0 ? (
                        appointments
                            .sort((a, b) => a.dateTime.seconds - b.dateTime.seconds)
                            .map(apt => (
                                <div key={apt.id} className="flex items-center gap-4">
                                    <div className="bg-primary rounded-full p-2">
                                        <Calendar className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{apt.professionalName}</p>
                                        <p className="text-sm text-muted-foreground">{formatDate(apt.dateTime)}</p>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setAppointmentToDelete(apt)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                <span className="sr-only">Cancel appointment</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently cancel your appointment. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel onClick={() => setAppointmentToDelete(null)}>Back</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive hover:bg-destructive/90"
                                                    onClick={() => appointmentToDelete && handleDelete(appointmentToDelete.id)}
                                                >
                                                    Cancel Appointment
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ))
                    ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            You have no upcoming appointments.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
