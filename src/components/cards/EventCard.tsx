import { Event } from '@/types';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventCardProps {
  event: Event;
  compact?: boolean;
  onClick?: () => void;
}

export function EventCard({ event, compact = false, onClick }: EventCardProps) {
  const typeStyles = {
    training: { bg: 'bg-primary/10', text: 'text-primary', label: 'Treino' },
    game: { bg: 'bg-success/10', text: 'text-success', label: 'Jogo' },
    meeting: { bg: 'bg-warning/10', text: 'text-warning', label: 'Reunião' },
  };

  const style = typeStyles[event.type];

  if (compact) {
    return (
      <div 
        className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-all cursor-pointer"
        onClick={onClick}
      >
        <div className={cn("w-2 h-10 rounded-full", style.bg.replace('/10', ''))} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{event.title}</p>
          <p className="text-sm text-muted-foreground">
            {format(event.date, "d 'de' MMM", { locale: ptBR })} às {event.time}
          </p>
        </div>
        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", style.bg, style.text)}>
          {style.label}
        </span>
      </div>
    );
  }

  return (
    <div 
      className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-200 cursor-pointer animate-fade-in"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <span className={cn("text-xs font-medium px-3 py-1 rounded-full", style.bg, style.text)}>
          {style.label}
        </span>
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-3">{event.title}</h3>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{format(event.date, "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{event.time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{event.location}</span>
        </div>
      </div>

      {event.description && (
        <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
          {event.description}
        </p>
      )}
    </div>
  );
}
