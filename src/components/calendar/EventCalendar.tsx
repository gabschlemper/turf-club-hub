import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';

type Event = Database['public']['Tables']['events']['Row'];

const eventTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  championship: { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/50' },
  training: { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500/50' },
  social: { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500/50' },
};

const eventTypeLabels: Record<string, string> = {
  championship: 'Campeonato',
  training: 'Treino',
  social: 'Confraternização',
};

interface EventCalendarProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onAddEvent: (date: Date) => void;
  isAdmin?: boolean;
}

export function EventCalendar({ events, onEventClick, onAddEvent, isAdmin = false }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getEventsForDay = useMemo(() => {
    return (day: Date) => {
      return events.filter((event) => {
        const eventDate = parseISO(event.start_datetime);
        return isSameDay(eventDate, day);
      });
    };
  }, [events]);

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={handleToday} className="ml-2">
            Hoje
          </Button>
        </div>
        <h2 className="text-xl font-semibold capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            {Object.entries(eventTypeLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1">
                <div className={cn('w-3 h-3 rounded', eventTypeColors[key].bg, eventTypeColors[key].border, 'border')} />
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground bg-muted/30">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[120px] border-b border-r border-border p-1 transition-colors',
                !isCurrentMonth && 'bg-muted/20',
                isToday && 'bg-primary/5',
                'hover:bg-muted/40 group'
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                    !isCurrentMonth && 'text-muted-foreground',
                    isToday && 'bg-primary text-primary-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => onAddEvent(day)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-primary/10 rounded transition-opacity"
                    title="Adicionar evento"
                  >
                    <Plus className="w-4 h-4 text-primary" />
                  </button>
                )}
              </div>
              <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
                {dayEvents.slice(0, 3).map((event) => {
                  const colors = eventTypeColors[event.event_type] || eventTypeColors.training;
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={cn(
                        'w-full text-left px-2 py-1 rounded text-xs font-medium truncate border',
                        colors.bg,
                        colors.text,
                        colors.border,
                        'hover:opacity-80 transition-opacity'
                      )}
                      title={event.name}
                    >
                      {format(parseISO(event.start_datetime), 'HH:mm')} {event.name}
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground px-2">
                    +{dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
