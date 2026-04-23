import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/hooks/useEvents';
import { useAthletes } from '@/hooks/useAthletes';
import { useMyDebts } from '@/hooks/useDebts';
import { useAttendances } from '@/hooks/useAttendances';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { BirthdayCard } from '@/components/cards/BirthdayCard';
import { Button } from '@/components/ui/button';
import { Calendar, Users, TrendingUp, Loader2, Download, Wallet, AlertCircle, CheckCircle2, ChevronRight, Eye } from 'lucide-react';
import { format, isFuture, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { parseEventDateTime } from '@/lib/dateUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isCoach } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';

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

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps = {}) {
  const { user, isAdmin } = useAuth();
  const isCoachUser = isCoach(user?.role);
  const { events, isLoading: eventsLoading } = useEvents();
  const { athletes, isLoading: athletesLoading } = useAthletes();
  const { attendances } = useAttendances();
  // Only fetch personal debts for athletes (RLS blocks others gracefully)
  const { debts: myDebts, totalOpen: debtsOpen, totalPaid: debtsPaid } = useMyDebts();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-backup`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Erro ao exportar');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: 'Backup exportado com sucesso!' });
    } catch (err) {
      toast({ title: 'Erro ao exportar backup', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = eventsLoading || athletesLoading;

  // Get current athlete's profile (if user is an athlete)
  const currentAthlete = !isAdmin && user?.email
    ? athletes.find(athlete => athlete.email === user.email)
    : null;

  // Get upcoming events (today and future), filtered by gender before limiting to 5
  const upcomingEvents = events
    .filter(e => {
      const eventDate = parseEventDateTime(e.start_datetime);
      const isFutureOrToday = isFuture(eventDate) || isToday(eventDate);
      
      if (!isFutureOrToday) return false;
      
      // If user is admin, show all upcoming events
      if (isAdmin || !currentAthlete) {
        return true;
      }
      
      // Filter by gender (naipe)
      // Athletes should only see events for their gender or 'both'
      const athleteGender = currentAthlete.gender;
      const eventGender = e.gender;
      
      return eventGender === 'both' || eventGender === athleteGender;
    })
    .slice(0, 5); // Limit to 5 AFTER filtering by gender

  // Count events by type for this month
  const now = new Date();
  const eventsThisMonth = events.filter(e => {
    const eventDate = parseEventDateTime(e.start_datetime);
    const isThisMonth = eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
    
    // Apply gender filter for athletes
    if (!isThisMonth) return false;
    
    if (isAdmin || !currentAthlete) {
      return true;
    }
    
    // Filter by gender (naipe)
    const athleteGender = currentAthlete.gender;
    const eventGender = e.gender;
    return eventGender === 'both' || eventGender === athleteGender;
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
      <div className="flex items-center justify-between mb-2">
        <PageHeader 
          title={`Olá, ${user?.name || 'Usuário'}!`}
          description={
            isAdmin
              ? 'Visão geral do clube'
              : isCoachUser
                ? 'Visão geral do clube (somente leitura)'
                : 'Bem-vindo ao portal do atleta'
          }
        />
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportBackup}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            Backup
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className={cn(
        'grid gap-3 sm:gap-4 mb-6 sm:mb-8',
        (isAdmin || isCoachUser)
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      )}>
        <StatCard
          title="Próximos Eventos"
          value={upcomingEvents.length}
          icon={Calendar}
          subtitle="Eventos agendados"
        />
        {(isAdmin || isCoachUser) && (
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

        {/* Finance summary card for athletes only */}
        {!isAdmin && !isCoachUser && currentAthlete && (
          <StatCard
            title="Minhas Finanças"
            value={
              <span className="flex items-baseline gap-2">
                <span>R$ {debtsOpen.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </span> as unknown as string
            }
            icon={Wallet}
            variant={debtsOpen > 0 ? 'warning' : 'success'}
            onClick={() => onNavigate?.('finance')}
          >
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="outline" className="gap-1 border-warning/40 text-warning">
                <AlertCircle className="w-3 h-3" />
                {myDebts.filter(d => !d.paid_at).length} em aberto
              </Badge>
              <Badge variant="outline" className="gap-1 border-success/40 text-success">
                <CheckCircle2 className="w-3 h-3" />
                {myDebts.filter(d => d.paid_at).length} pagas
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground pt-2 flex items-center gap-1">
              Ver Finanças <ChevronRight className="w-3 h-3" />
            </p>
          </StatCard>
        )}
      </div>

      {isCoachUser && (
        <div className="mb-4 p-3 rounded-lg bg-muted/40 border border-border flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="w-4 h-4" />
          Você está acessando como Treinador. As ações de criação, edição e exclusão estão desativadas.
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Upcoming Events - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Próximos Eventos</h2>
            
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">
                Nenhum evento agendado no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(event => {
                  const eventDate = parseEventDateTime(event.start_datetime);
                  const colors = eventTypeColors[event.event_type] || eventTypeColors.training;
                  
                  return (
                    <div 
                      key={event.id} 
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="text-center min-w-[50px] sm:min-w-[60px]">
                        <div className="text-xl sm:text-2xl font-bold text-foreground">
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
                        <h3 className="font-medium text-sm sm:text-base text-foreground">{event.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
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

        {/* Birthdays - Takes 1 column - Shows only day/month for privacy */}
        <div className="lg:col-span-1">
          <BirthdayCard athletes={athletes} showAge={isAdmin} />
        </div>
      </div>
    </div>
  );
}
