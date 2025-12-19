'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { professionals } from '@/lib/data';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BookingModal from './booking-modal';

type Professional = (typeof professionals)[0];

export default function AppointmentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  const handleOpenModal = (professional: Professional) => {
    setSelectedProfessional(professional);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProfessional(null);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header pageTitle="Book an Appointment" />
      <main className="flex-1 p-4 md:p-8">
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {professionals.map((prof) => (
            <Card key={prof.id} className="flex flex-col text-center">
              <CardHeader className="items-center">
                <Avatar className="h-24 w-24">
                  {prof.avatar && (
                    <AvatarImage
                      src={prof.avatar.imageUrl}
                      alt={prof.name}
                      data-ai-hint={prof.avatar.imageHint}
                    />
                  )}
                  <AvatarFallback>{prof.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </CardHeader>
              <CardContent className="flex-1">
                <CardTitle className="text-xl font-headline">{prof.name}</CardTitle>
                <CardDescription>{prof.specialty}</CardDescription>
              </CardContent>
              <CardFooter className="flex-col">
                <Button className="w-full" onClick={() => handleOpenModal(prof)}>
                  Book Appointment
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
      <BookingModal 
        professional={selectedProfessional}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
