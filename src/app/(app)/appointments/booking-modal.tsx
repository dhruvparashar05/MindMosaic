'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { professionals as ProfessionalsType } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type Professional = (typeof ProfessionalsType)[0];

interface BookingModalProps {
  professional: Professional | null;
  isOpen: boolean;
  onClose: () => void;
}

const timeSlots = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
];

export default function BookingModal({
  professional,
  isOpen,
  onClose,
}: BookingModalProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const { toast } = useToast();

  const handleBooking = () => {
    if (!date || !selectedTime || !professional) {
        toast({
            title: "Incomplete Selection",
            description: "Please select a date and time slot.",
            variant: "destructive",
        })
        return;
    }

    toast({
        title: "Booking Confirmed!",
        description: `Your appointment with ${professional.name} is set for ${date.toLocaleDateString()} at ${selectedTime}.`,
        action: (
            <div className="p-2 bg-accent text-accent-foreground rounded-full">
                <CheckCircle className="h-6 w-6" />
            </div>
        )
    });
    
    onClose();
    setSelectedTime(null);
  }

  if (!professional) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            Schedule your session with {professional.name}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-6 -mr-6">
          <div className="grid gap-6 py-1">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() - 1))}
              />
            </div>
            <div>
              <h4 className="font-medium mb-4 text-center">Available Time Slots</h4>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant="outline"
                    className={cn(
                      selectedTime === time && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                    )}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="pt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleBooking} disabled={!date || !selectedTime}>Confirm Booking</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
