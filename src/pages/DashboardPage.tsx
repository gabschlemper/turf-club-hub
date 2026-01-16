import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/hooks/useEvents';
import { useAthletes } from '@/hooks/useAthletes';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { Calendar, Users, TrendingUp, Loader2 } from 'lucide-react';
import { format, parseISO, isFuture, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const eventTypeLabels: Record<string, string> = {
  championship: 'Campeonato',
  training: 'Treino',
  social: 'Confraternização',
};

const eventTypeColors: Record<string, { bg: string; text: string }> = {
  championship: { bg: 'bg-primary/10', text: 'text-primary' },
  training: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  social: { bg: 'bg-green-500/10', text: 'text-green-500' },
};

export function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { events, isLoading: eventsLoading } = useEvents();
  const { athletes, isLoading: athletesLoading } = useAthletes();

  const isLoading = eventsLoading || athletesLoading;

  // Get upcoming events (today and future)
  const upcomingEvents = events
    .filter(e => {
      const eventDate = parseISO(e.start_datetime);
      return isFuture(eventDate) || isToday(eventDate);
    })
    .slice(0, 5);

  // Count events by type for this month
  const now = new Date();
  const eventsThisMonth = events.filter(e => {
    const eventDate = parseISO(e.start_datetime);
    return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title={`Olá, ${user?.name || 'Usuário'}!`}
        description={isAdmin ? 'Visão geral do clube' : 'Bem-vindo ao portal do atleta'}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Próximos Eventos"
          value={upcomingEvents.length}
          icon={Calendar}
          subtitle="Eventos agendados"
        />
        {isAdmin && (
          <StatCard
            title="Total de Atletas"
            value={athletes.length}
            icon={Users}
            subtitle="Atletas cadastrados"
          />
        )}
        <StatCard
          title="Eventos este Mês"
          value={eventsThisMonth.length}
          icon={TrendingUp}
          subtitle={format(now, "MMMM 'de' yyyy", { locale: ptBR })}
        />
      </div>

      {/* Upcoming Events */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Próximos Eventos</h2>
        
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum evento agendado no momento.
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map(event => {
              const eventDate = parseISO(event.start_datetime);
              const colors = eventTypeColors[event.event_type] || eventTypeColors.training;
              
              return (
                <div 
                  key={event.id} 
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="text-center min-w-[60px]">
                    <div className="text-2xl font-bold text-foreground">
                      {format(eventDate, 'd')}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase">
                      {format(eventDate, 'MMM', { locale: ptBR })}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', colors.bg, colors.text)}>
                        {eventTypeLabels[event.event_type]}
                      </span>
                      {isToday(eventDate) && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">
                          Hoje
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-foreground">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(eventDate, 'HH:mm')} • {event.location}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
