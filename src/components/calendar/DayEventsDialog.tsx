import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, MapPin, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { parseEventDateTime } from '@/lib/dateUtils';
import { Database } from '@/integrations/supabase/types';

type Event = Database['public']['Tables']['events']['Row'];

const eventTypeColors: Record<string, { bg: string; text: string }> = {
  championship: { bg: 'bg-primary/10', text: 'text-primary' },
  training: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  social: { bg: 'bg-green-500/10', text: 'text-green-500' },
};

const eventTypeLabels: Record<string, string> = {
  championship: 'Campeonato',
  training: 'Treino',
  social: 'Confraternização',
};

interface DayEventsDialogProps {
  date: Date | null;
  events: Event[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventClick: (event: Event) => void;
}

export function DayEventsDialog({
  date,
  events,
  open,
  onOpenChange,
  onEventClick,
}: DayEventsDialogProps) {
  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {format(date, "d 'de' MMMM, yyyy", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {events.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              Nenhum evento neste dia.
            </p>
          ) : (
            events.map((event) => {
              const colors = eventTypeColors[event.event_type] || eventTypeColors.training;
              const eventDate = parseEventDateTime(event.start_datetime);

              return (
                <button
                  key={event.id}
                  onClick={() => {
                    onEventClick(event);
                    onOpenChange(false);
                  }}
                  className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-foreground">{event.name}</h3>
                    <Badge variant="outline" className={cn(colors.bg, colors.text, 'border-0')}>
                      {eventTypeLabels[event.event_type]}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(eventDate, 'HH:mm')}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{event.location}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
