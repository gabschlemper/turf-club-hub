import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { useEvents } from '@/hooks/useEvents';
import { useAthletes } from '@/hooks/useAthletes';
import { useAttendances } from '@/hooks/useAttendances';
import { formatDateTimeBR, formatDateFullBR, parseUTCDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, Loader2, Calendar, Filter } from 'lucide-react';
import { AttendanceModal } from '@/components/attendance/AttendanceModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function AttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [modalEvent, setModalEvent] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [latestTrainingOpen, setLatestTrainingOpen] = useState(true);

  const { events, isLoading: eventsLoading } = useEvents();
  const { athletes, isLoading: athletesLoading } = useAthletes();
  const { attendances, isLoading: attendancesLoading, upsertAttendance } = useAttendances();

  // Get only training events that already happened
  const pastTrainings = useMemo(() => {
    const now = new Date();
    return events
      .filter(e => e.event_type === 'training' && parseUTCDate(e.start_datetime) < now)
      .sort((a, b) => parseUTCDate(b.start_datetime).getTime() - parseUTCDate(a.start_datetime).getTime());
  }, [events]);

  // Filter trainings by athlete gender (only events matching athlete's gender or 'both')
  const getTrainingsForGender = (gender: 'male' | 'female' | 'both') => {
    if (gender === 'both') return pastTrainings;
    return pastTrainings.filter(e => e.gender === gender || e.gender === 'both');
  };

  // Get athletes that should attend a specific event based on gender
  const getAthletesForEvent = (eventGender: 'male' | 'female' | 'both') => {
    if (eventGender === 'both') return athletes;
    return athletes.filter(a => a.gender === eventGender);
  };

  const handleMarkAttendance = (eventId: string, athleteId: string, status: 'present' | 'absent' | 'justified') => {
    upsertAttendance.mutate({ eventId, athleteId, status });
  };

  // Get unique months from past trainings
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    pastTrainings.forEach(event => {
      const date = parseUTCDate(event.start_datetime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [pastTrainings]);

  // Filter trainings for history
  const filteredHistoryTrainings = useMemo(() => {
    return pastTrainings
      .slice(1) // Skip the first (most recent)
      .filter(event => {
        // Filter by gender
        if (genderFilter !== 'all' && event.gender !== genderFilter && event.gender !== 'both') {
          return false;
        }
        
        // Filter by month
        if (monthFilter !== 'all') {
          const date = parseUTCDate(event.start_datetime);
          const eventMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (eventMonth !== monthFilter) return false;
        }
        
        return true;
      });
  }, [pastTrainings, genderFilter, monthFilter]);

  const isLoading = eventsLoading || athletesLoading || attendancesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only admin can access this page
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso não autorizado.</p>
      </div>
    );
  }

  const latestTraining = pastTrainings[0];
  const modalEventData = pastTrainings.find(e => e.id === modalEvent);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Marcar Presença"
        description="Marque a presença dos atletas no último treino e gerencie o histórico"
      />

      {/* Latest Training - Always Expanded */}
      {latestTraining && (
        <Collapsible open={latestTrainingOpen} onOpenChange={setLatestTrainingOpen}>
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <div className="p-4 border-b border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-lg bg-primary/20 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs text-primary font-medium">
                          {parseUTCDate(latestTraining.start_datetime).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                        </span>
                        <span className="text-xl text-primary font-bold">
                          {parseUTCDate(latestTraining.start_datetime).getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold text-base text-foreground">Último Treino</h3>
                        </div>
                        <p className="font-semibold text-base text-foreground truncate">{latestTraining.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                          <span>{formatDateFullBR(parseUTCDate(latestTraining.start_datetime))}</span>
                          <span>•</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            latestTraining.gender === 'male' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                            latestTraining.gender === 'female' && "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
                            latestTraining.gender === 'both' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          )}>
                            {latestTraining.gender === 'male' ? 'Masculino' : latestTraining.gender === 'female' ? 'Feminino' : 'Ambos'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={cn(
                      "w-5 h-5 text-primary transition-transform flex-shrink-0 ml-2",
                      latestTrainingOpen && "rotate-180"
                    )} />
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="p-4">
                  <div className="space-y-2">
                    {getAthletesForEvent(latestTraining.gender).map(athlete => {
                      const attendance = attendances.find(a => a.event_id === latestTraining.id && a.athlete_id === athlete.id);
                      const status = attendance?.status || null;
                      
                      return (
                        <div 
                          key={athlete.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-card hover:bg-muted/50 transition-colors border border-border"
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
                              onClick={() => handleMarkAttendance(latestTraining.id, athlete.id, 'present')}
                              disabled={upsertAttendance.isPending}
                              title="Presente"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={status === 'absent' ? 'destructive' : 'outline'}
                              className="h-9 w-9 p-0"
                              onClick={() => handleMarkAttendance(latestTraining.id, athlete.id, 'absent')}
                              disabled={upsertAttendance.isPending}
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
                              onClick={() => handleMarkAttendance(latestTraining.id, athlete.id, 'justified')}
                              disabled={upsertAttendance.isPending}
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
              </CollapsibleContent>
            </div>
          </div>
        </Collapsible>
      )}

      {/* Training History */}
      {pastTrainings.length > 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-base text-foreground">Histórico de Treinos</h3>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-card border border-border">
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {availableMonths.map(month => {
                  const [year, monthNum] = month.split('-');
                  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                  return (
                    <SelectItem key={month} value={month}>
                      {label.charAt(0).toUpperCase() + label.slice(1)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Select value={genderFilter} onValueChange={(v) => setGenderFilter(v as 'all' | 'male' | 'female')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Naipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Naipes</SelectItem>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Feminino</SelectItem>
              </SelectContent>
            </Select>

            {(monthFilter !== 'all' || genderFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setMonthFilter('all');
                  setGenderFilter('all');
                }}
              >
                Limpar Filtros
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground">
              {filteredHistoryTrainings.length} treino{filteredHistoryTrainings.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* History List */}
          {filteredHistoryTrainings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground rounded-xl bg-card border border-border">
              Nenhum treino encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHistoryTrainings.map(event => {
                const eventAthletes = getAthletesForEvent(event.gender);
                const eventAttendances = attendances.filter(a => a.event_id === event.id);
                const presentCount = eventAttendances.filter(a => a.status === 'present').length;
                const eventDate = parseUTCDate(event.start_datetime);
                const genderLabel = event.gender === 'male' ? 'Masculino' : event.gender === 'female' ? 'Feminino' : 'Ambos';

                return (
                  <button
                    key={event.id}
                    onClick={() => setModalEvent(event.id)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-muted/30 hover:border-primary/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-muted flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs text-muted-foreground font-medium">
                          {eventDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                        </span>
                        <span className="text-lg text-foreground font-bold">
                          {eventDate.getDate()}
                        </span>
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground truncate">{event.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span>{presentCount}/{eventAthletes.length} presentes</span>
                          <span>•</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-xs font-medium",
                            event.gender === 'male' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                            event.gender === 'female' && "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
                            event.gender === 'both' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          )}>
                            {genderLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-muted-foreground -rotate-90 flex-shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Attendance Modal */}
      <AttendanceModal
        event={modalEventData || null}
        athletes={athletes}
        attendances={attendances}
        isOpen={!!modalEvent}
        onClose={() => setModalEvent(null)}
        onMarkAttendance={handleMarkAttendance}
        isPending={upsertAttendance.isPending}
      />
    </div>
  );
}
