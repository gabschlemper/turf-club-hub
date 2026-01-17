import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { useEvents } from '@/hooks/useEvents';
import { useAthletes } from '@/hooks/useAthletes';
import { useAttendances } from '@/hooks/useAttendances';
import { formatDateTimeBR, formatDateFullBR, parseUTCDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function AttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'justified':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      default:
        return <Minus className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'P';
      case 'absent':
        return 'F';
      case 'justified':
        return 'FJ';
      default:
        return '-';
    }
  };

  const getStatusLabelFull = (status: string) => {
    switch (status) {
      case 'present':
        return 'Presente';
      case 'absent':
        return 'Falta';
      case 'justified':
        return 'Justificado';
      default:
        return '-';
    }
  };

  // Calculate attendance stats for an athlete (considering only events matching their gender)
  const calculateStats = (athleteId: string) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (!athlete) return { total: 0, present: 0, justified: 0, absent: 0, percentage: 0 };
    
    // Filter trainings by athlete's gender
    const relevantTrainings = getTrainingsForGender(athlete.gender);
    const athleteAttendances = attendances.filter(a => a.athlete_id === athleteId);
    
    const total = relevantTrainings.length;
    const present = athleteAttendances.filter(a => 
      a.status === 'present' && relevantTrainings.some(t => t.id === a.event_id)
    ).length;
    const justified = athleteAttendances.filter(a => 
      a.status === 'justified' && relevantTrainings.some(t => t.id === a.event_id)
    ).length;
    const absent = athleteAttendances.filter(a => 
      a.status === 'absent' && relevantTrainings.some(t => t.id === a.event_id)
    ).length;
    
    // Percentage considers present + justified as positive
    const percentage = total > 0 ? Math.round(((present + justified) / total) * 100) : 0;
    
    return { total, present, justified, absent, percentage };
  };

  // For athlete view - find athlete by email and calculate stats
  const athleteStats = useMemo(() => {
    const currentAthlete = athletes.find(a => a.email === user?.email);
    if (currentAthlete) {
      return calculateStats(currentAthlete.id);
    }
    return { total: 0, present: 0, justified: 0, absent: 0, percentage: 0 };
  }, [user?.email, athletes, attendances, pastTrainings]);
  
  const athleteAttendance = useMemo(() => {
    const currentAthlete = athletes.find(a => a.email === user?.email);
    if (!currentAthlete) return [];
    
    // Filter trainings relevant to this athlete's gender
    const relevantTrainings = getTrainingsForGender(currentAthlete.gender);
    
    return relevantTrainings.map(event => {
      const attendance = attendances.find(
        a => a.event_id === event.id && a.athlete_id === currentAthlete.id
      );
      return { event, status: attendance?.status || 'absent' };
    });
  }, [user?.email, athletes, attendances, pastTrainings]);

  const handleMarkAttendance = (eventId: string, athleteId: string, status: 'present' | 'absent' | 'justified') => {
    upsertAttendance.mutate({ eventId, athleteId, status });
  };

  const isLoading = eventsLoading || athletesLoading || attendancesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Athlete View
  if (!isAdmin) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Minha Presença"
          description="Acompanhe sua participação nos treinos"
        />

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground">Treinos Realizados</p>
            <p className="text-2xl font-bold text-foreground">{athleteStats.total}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground">Presenças</p>
            <p className="text-2xl font-bold text-success">{athleteStats.present}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground">Faltas</p>
            <p className="text-2xl font-bold text-destructive">{athleteStats.absent}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground">Justificadas</p>
            <p className="text-2xl font-bold text-warning">{athleteStats.justified}</p>
          </div>
        </div>

        {/* Percentage Card */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Presença</p>
              <p className="text-3xl font-bold text-foreground">{athleteStats.percentage}%</p>
            </div>
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              athleteStats.percentage >= 75 && "bg-success/10",
              athleteStats.percentage >= 50 && athleteStats.percentage < 75 && "bg-warning/10",
              athleteStats.percentage < 50 && "bg-destructive/10"
            )}>
              {athleteStats.percentage >= 75 ? (
                <TrendingUp className="w-6 h-6 text-success" />
              ) : athleteStats.percentage >= 50 ? (
                <Minus className="w-6 h-6 text-warning" />
              ) : (
                <TrendingDown className="w-6 h-6 text-destructive" />
              )}
            </div>
          </div>
          <Progress 
            value={athleteStats.percentage} 
            className={cn(
              "h-3",
              athleteStats.percentage >= 75 && "[&>div]:bg-success",
              athleteStats.percentage >= 50 && athleteStats.percentage < 75 && "[&>div]:bg-warning",
              athleteStats.percentage < 50 && "[&>div]:bg-destructive"
            )}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Considerando presenças e faltas justificadas
          </p>
        </div>

        {/* Attendance History */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Histórico de Treinos</h3>
          </div>
          {athleteAttendance.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum treino passado encontrado.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {athleteAttendance.map(({ event, status }) => (
                <div 
                  key={event.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
                      status === 'present' && "bg-success/10 text-success",
                      status === 'absent' && "bg-destructive/10 text-destructive",
                      status === 'justified' && "bg-warning/10 text-warning"
                    )}>
                      {getStatusLabel(status)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{event.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateFullBR(parseUTCDate(event.start_datetime))}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    status === 'present' && "text-success",
                    status === 'absent' && "text-destructive",
                    status === 'justified' && "text-warning"
                  )}>
                    {getStatusLabelFull(status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin View
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Controle de Presença"
        description="Gerencie a presença dos atletas nos treinos"
      />

      {/* Athletes Overview */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Resumo por Atleta</h3>
          <p className="text-sm text-muted-foreground">Estatísticas consideram apenas treinos do naipe de cada atleta</p>
        </div>
        {athletes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum atleta cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Atleta</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Naipe</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Treinos</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">P</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">F</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">FJ</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {athletes.map(athlete => {
                  const stats = calculateStats(athlete.id);
                  return (
                    <tr key={athlete.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-medium text-sm">
                              {athlete.name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">{athlete.name}</span>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          athlete.gender === 'male' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
                        )}>
                          {athlete.gender === 'male' ? 'M' : 'F'}
                        </span>
                      </td>
                      <td className="text-center p-4 font-medium text-muted-foreground">{stats.total}</td>
                      <td className="text-center p-4 text-success font-medium">{stats.present}</td>
                      <td className="text-center p-4 text-destructive font-medium">{stats.absent}</td>
                      <td className="text-center p-4 text-warning font-medium">{stats.justified}</td>
                      <td className="text-center p-4">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium",
                          stats.percentage >= 75 && "bg-success/10 text-success",
                          stats.percentage >= 50 && stats.percentage < 75 && "bg-warning/10 text-warning",
                          stats.percentage < 50 && "bg-destructive/10 text-destructive"
                        )}>
                          {stats.percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Training Events */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Marcar Presença por Treino</h3>
        {pastTrainings.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground rounded-xl bg-card border border-border">
            Nenhum treino passado encontrado.
          </div>
        ) : (
          pastTrainings.map(event => {
            const eventAthletes = getAthletesForEvent(event.gender);
            const eventAttendances = attendances.filter(a => a.event_id === event.id);
            const presentCount = eventAttendances.filter(a => a.status === 'present').length;
            const isExpanded = selectedEvent === event.id;
            const eventDate = parseUTCDate(event.start_datetime);

            const genderLabel = event.gender === 'male' ? 'Masculino' : event.gender === 'female' ? 'Feminino' : 'Ambos';

            return (
              <div key={event.id} className="rounded-xl bg-card border border-border overflow-hidden">
                <button
                  onClick={() => setSelectedEvent(isExpanded ? null : event.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                      <span className="text-xs text-primary font-medium">
                        {eventDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                      </span>
                      <span className="text-lg text-primary font-bold">
                        {eventDate.getDate()}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{event.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180"
                  )} />
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-4 animate-fade-in">
                    <div className="space-y-2">
                      {eventAthletes.map(athlete => {
                        const attendance = eventAttendances.find(a => a.athlete_id === athlete.id);
                        const status = attendance?.status || null;
                        
                        return (
                          <div 
                            key={athlete.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-medium text-sm">
                                  {athlete.name.charAt(0)}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-foreground">{athlete.name}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant={status === 'present' ? 'default' : 'outline'}
                                className={cn(
                                  "h-9 w-9 p-0",
                                  status === 'present' && "bg-success hover:bg-success/90 border-success"
                                )}
                                onClick={() => handleMarkAttendance(event.id, athlete.id, 'present')}
                                disabled={upsertAttendance.isPending}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={status === 'absent' ? 'destructive' : 'outline'}
                                className="h-9 w-9 p-0"
                                onClick={() => handleMarkAttendance(event.id, athlete.id, 'absent')}
                                disabled={upsertAttendance.isPending}
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
                                onClick={() => handleMarkAttendance(event.id, athlete.id, 'justified')}
                                disabled={upsertAttendance.isPending}
                              >
                                <AlertCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
