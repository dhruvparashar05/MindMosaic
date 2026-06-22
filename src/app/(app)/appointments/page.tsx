'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { professionals } from '@/lib/data';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import BookingModal from './booking-modal';
import { User, Star, Calendar, Clock, Trash2, ArrowLeft, Activity, History, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

type Professional = (typeof professionals)[0];

interface Appointment {
  id: string;
  professionalId: string;
  professionalName: string;
  dateTime: Timestamp;
  status: string;
}

const therapistDetails: Record<string, { rating: string; bio: string; slots: string[] }> = {
  '1': {
    rating: '4.9',
    bio: 'Specializing in helping clients reframe negative cognitive pathways and build resilience.',
    slots: ['9:00 AM', '11:00 AM', '3:00 PM'],
  },
  '2': {
    rating: '4.8',
    bio: 'Focusing on mindfulness integration to lower daily stress levels and prevent burnout.',
    slots: ['10:00 AM', '1:00 PM', '4:00 PM'],
  },
  '3': {
    rating: '4.9',
    bio: 'Supporting couples and individuals in building healthy, nurturing interpersonal connections.',
    slots: ['12:00 PM', '2:00 PM', '5:00 PM'],
  },
};

export default function AppointmentsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'book' | 'schedule'>('book');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  // Fetch appointments
  const appointmentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/appointments`);
  }, [user, firestore]);

  const { data: appointments, isLoading } = useCollection<Appointment>(appointmentsQuery);

  const handleOpenModal = (professional: Professional) => {
    setSelectedProfessional(professional);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProfessional(null);
  };

  const handleCancelBooking = (apptId: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, `users/${user.uid}/appointments`, apptId);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: 'Appointment Canceled',
      description: 'Your session has been successfully removed.',
    });
  };

  // Filter appointments
  const upcomingAppointments = useMemo(() => {
    if (!appointments) return [];
    const nowSecs = Date.now() / 1000;
    return appointments
      .filter((appt) => appt.dateTime.seconds >= nowSecs)
      .sort((a, b) => a.dateTime.seconds - b.dateTime.seconds);
  }, [appointments]);

  const pastAppointments = useMemo(() => {
    if (!appointments) return [];
    const nowSecs = Date.now() / 1000;
    return appointments
      .filter((appt) => appt.dateTime.seconds < nowSecs)
      .sort((a, b) => b.dateTime.seconds - a.dateTime.seconds);
  }, [appointments]);

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

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="Therapy Appointments" />
      <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Animated Custom Tabs */}
        <div className="flex justify-center">
          <div className="flex bg-muted/20 border border-white/5 p-1 rounded-2xl relative">
            <button
              onClick={() => setActiveTab('book')}
              className={`px-6 py-2 text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'book'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Book a Session
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-6 py-2 text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'schedule'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Schedule ({upcomingAppointments.length})
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'book' ? (
            <motion.div
              key="book-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {professionals.map((prof) => {
                const details = therapistDetails[prof.id] || { rating: '4.8', bio: 'Experienced professional therapist.', slots: [] };
                return (
                  <Card key={prof.id} className="glass-card flex flex-col text-center rounded-3xl border border-white/10 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                    <CardHeader className="items-center pb-2 pt-6">
                      <div className="relative">
                        <Avatar className="h-24 w-24 border-2 border-primary/20">
                          {prof.avatar?.imageUrl ? (
                            <div className="relative w-full h-full">
                              <Image
                                src={prof.avatar.imageUrl}
                                alt={prof.name}
                                fill
                                className="object-cover"
                                data-ai-hint={prof.avatar.imageHint}
                              />
                            </div>
                          ) : (
                            <AvatarFallback>
                              <User />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="absolute bottom-0 right-0 bg-yellow-500/90 text-yellow-950 font-black text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                          <Star className="h-3 w-3 fill-yellow-950" /> {details.rating}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 px-5 pt-2 pb-4 space-y-2">
                      <div>
                        <CardTitle className="text-xl font-bold tracking-tight font-headline">{prof.name}</CardTitle>
                        <CardDescription className="text-xs mt-0.5 font-medium text-primary">{prof.specialty}</CardDescription>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                        "{details.bio}"
                      </p>
                      
                      {/* Available slots indicator */}
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Today's Slots</span>
                        <div className="flex justify-center gap-1.5 flex-wrap">
                          {details.slots.map(slot => (
                            <span key={slot} className="text-[9px] bg-muted/30 border border-white/5 rounded-md px-1.5 py-0.5 text-foreground">{slot}</span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="px-5 pb-6 pt-0">
                      <Button className="w-full rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold" onClick={() => handleOpenModal(prof)}>
                        Book Session
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="schedule-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 max-w-3xl mx-auto"
            >
              {/* Upcoming sessions */}
              <Card className="glass-card rounded-3xl border border-white/10 p-6">
                <CardTitle className="text-base flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-primary" /> Upcoming Sessions
                </CardTitle>

                <div className="space-y-4">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appt) => (
                      <div key={appt.id} className="p-4 bg-muted/15 border border-white/5 rounded-2xl flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shrink-0">
                            <Clock className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{appt.professionalName}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(appt.dateTime)}</p>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl hover:bg-destructive/10 text-destructive hover:text-destructive shrink-0 h-9 w-9"
                          onClick={() => handleCancelBooking(appt.id)}
                          title="Cancel booking"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-8">
                      You have no upcoming sessions scheduled.
                    </div>
                  )}
                </div>
              </Card>

              {/* History past sessions */}
              <Card className="glass-card rounded-3xl border border-white/10 p-6">
                <CardTitle className="text-base flex items-center gap-2 mb-4">
                  <History className="h-5 w-5 text-secondary" /> Past Session History
                </CardTitle>

                <div className="space-y-4">
                  {pastAppointments.length > 0 ? (
                    pastAppointments.map((appt) => (
                      <div key={appt.id} className="p-4 bg-muted/15 border border-white/5 rounded-2xl flex justify-between items-center gap-4 opacity-75">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-muted/30 rounded-2xl text-muted-foreground shrink-0">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{appt.professionalName}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(appt.dateTime)}</p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-8">
                      No past completed appointments found.
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      <BookingModal
        professional={selectedProfessional}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
