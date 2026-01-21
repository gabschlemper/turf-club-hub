import { useState } from 'react';
import { Database } from '@/integrations/supabase/types';
import { formatDateFullBR, parseUTCDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Event = Database['public']['Tables']['events']['Row'];
type Athlete = Database['public']['Tables']['athletes']['Row'];
type Attendance = Database['public']['Tables']['attendances']['Row'];

interface AttendanceModalProps {
  event: Event | null;
  athletes: Athlete[];
  attendances: Attendance[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAttendance: (eventId: string, athleteId: string, status: 'present' | 'absent' | 'justified') => void;
  isPending?: boolean;
}

export function AttendanceModal({
  event,
  athletes,
  attendances,
  isOpen,
  onClose,
  onMarkAttendance,
  isPending = false,
}: AttendanceModalProps) {
  if (!event) return null;

  const eventDate = parseUTCDate(event.start_datetime);
  const genderLabel = event.gender === 'male' ? 'Masculino' : event.gender === 'female' ? 'Feminino' : 'Ambos';

  // Get athletes that should attend this event
  const eventAthletes = event.gender === 'both' 
    ? athletes 
    : athletes.filter(a => a.gender === event.gender);

  const eventAttendances = attendances.filter(a => a.event_id === event.id);
  const presentCount = eventAttendances.filter(a => a.status === 'present').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-xs text-primary font-medium">
                {eventDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
              </span>
              <span className="text-lg text-primary font-bold">
                {eventDate.getDate()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground truncate">{event.name}</div>
              <div className="text-sm text-muted-foreground font-normal">
                {formatDateFullBR(eventDate)}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <span>{presentCount}/{eventAthletes.length} presentes</span>
            <span>•</span>
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-medium",
              event.gender === 'male' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              event.gender === 'female' && "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
              event.gender === 'both' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
            )}>
              {genderLabel}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 -mx-1">
          <div className="space-y-2">
            {eventAthletes.map(athlete => {
              const attendance = eventAttendances.find(a => a.athlete_id === athlete.id);
              const status = attendance?.status || null;
              
              return (
                <div 
                  key={athlete.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-medium text-sm">
                        {athlete.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground truncate">{athlete.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <Button
                      size="sm"
                      variant={status === 'present' ? 'default' : 'outline'}
                      className={cn(
                        "h-9 w-9 p-0",
                        status === 'present' && "bg-success hover:bg-success/90 border-success"
                      )}
                      onClick={() => onMarkAttendance(event.id, athlete.id, 'present')}
                      disabled={isPending}
                      title="Presente"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={status === 'absent' ? 'destructive' : 'outline'}
                      className="h-9 w-9 p-0"
                      onClick={() => onMarkAttendance(event.id, athlete.id, 'absent')}
                      disabled={isPending}
                      title="Falta"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={status === 'justified' ? 'secondary' : 'outline'}
                      className={cn(
                        "h-9 w-9 p-0",
                        status === 'justified' && "bg-warning hover:bg-warning/90 border-warning text-warning-foreground"
                      )}
                      onClick={() => onMarkAttendance(event.id, athlete.id, 'justified')}
                      disabled={isPending}
                      title="Falta Justificada"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
