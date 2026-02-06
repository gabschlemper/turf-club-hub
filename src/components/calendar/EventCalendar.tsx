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
  startOfDay,
  isWithinInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';
import { parseEventDateTime } from '@/lib/dateUtils';

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
  onDayClick?: (date: Date, events: Event[]) => void;
  isAdmin?: boolean;
}

export function EventCalendar({ events, onEventClick, onAddEvent, onDayClick, isAdmin = false }: EventCalendarProps) {
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
        const eventStartDate = parseEventDateTime(event.start_datetime);
        const eventEndDate = parseEventDateTime(event.end_datetime);
        
        // Get start of day for comparison (ignore time)
        const dayStart = startOfDay(day);
        const eventStart = startOfDay(eventStartDate);
        const eventEnd = startOfDay(eventEndDate);
        
        // Check if event is on this day or spans across this day
        return isSameDay(eventStartDate, day) || 
               isSameDay(eventEndDate, day) ||
               isWithinInterval(dayStart, { start: eventStart, end: eventEnd });
      });
    };
  }, [events]);

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 border-b border-border">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth} className="h-8 w-8 sm:h-10 sm:w-10">
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8 sm:h-10 sm:w-10">
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="ghost" onClick={handleToday} className="h-8 sm:h-10 text-xs sm:text-sm">
            Hoje
          </Button>
          <h2 className="text-base sm:text-xl font-semibold capitalize ml-auto sm:ml-0">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
        </div>
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            {Object.entries(eventTypeLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={cn('w-2.5 h-2.5 sm:w-3 sm:h-3 rounded', eventTypeColors[key].bg, eventTypeColors[key].border, 'border')} />
                <span className="text-muted-foreground whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-muted-foreground bg-muted/30">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
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
                'min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] border-b border-r border-border p-0.5 sm:p-1 transition-colors',
                !isCurrentMonth && 'bg-muted/20',
                isToday && 'bg-primary/5',
                'hover:bg-muted/40 group'
              )}
            >
              <div className="flex items-center justify-between px-1">
                <span
                  className={cn(
                    'text-xs sm:text-sm font-medium w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full',
                    !isCurrentMonth && 'text-muted-foreground',
                    isToday && 'bg-primary text-primary-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => onAddEvent(day)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 sm:p-1 hover:bg-primary/10 rounded transition-opacity"
                    title="Adicionar evento"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  </button>
                )}
              </div>
              <div className="mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1 overflow-y-auto max-h-[60px] sm:max-h-[70px] lg:max-h-[80px]">
                {dayEvents.map((event, eventIdx) => {
                  const colors = eventTypeColors[event.event_type] || eventTypeColors.training;
                  // Show first 2 events directly, rest are accessible via scroll
                  const isVisible = eventIdx < 2;
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={cn(
                        'w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium truncate border',
                        colors.bg,
                        colors.text,
                        colors.border,
                        'hover:opacity-80 transition-opacity',
                        !isVisible && 'hidden sm:block' // Hide extras on mobile, show on larger screens
                      )}
                      title={`${format(parseEventDateTime(event.start_datetime), 'HH:mm')} - ${event.name}`}
                    >
                      <span className="hidden sm:inline">{format(parseEventDateTime(event.start_datetime), 'HH:mm')} </span>
                      <span className="truncate">{event.name}</span>
                    </button>
                  );
                })}
                {/* Mobile indicator for more events - clicking shows all events for this day */}
                {dayEvents.length > 2 && (
                  <button
                    onClick={() => onDayClick?.(day, dayEvents)}
                    className="sm:hidden text-[10px] text-primary px-1 font-medium hover:underline"
                  >
                    Ver todos ({dayEvents.length})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
