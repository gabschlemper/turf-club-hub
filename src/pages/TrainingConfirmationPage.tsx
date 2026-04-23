import { useState, useMemo } from 'react';
import { format, isFuture, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CalendarCheck, 
  Users, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  BarChart3,
  MinusCircle
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/hooks/useEvents';
import { useAthletes } from '@/hooks/useAthletes';
import { useTrainingConfirmations } from '@/hooks/useTrainingConfirmations';
import { TrainingConfirmationCard } from '@/components/training/TrainingConfirmationCard';
import { ConfirmationReportCard } from '@/components/training/ConfirmationReportCard';
import { CollapsibleAthleteList } from '@/components/training/CollapsibleAthleteList';
import { cn } from '@/lib/utils';
import { isCoach } from '@/lib/permissions';

export default function TrainingConfirmationPage() {
  const { isAdmin: isAdminUser, user } = useAuth();
  // Coaches see the same admin view (read-only) for confirmations reporting
  const isAdmin = isAdminUser || isCoach(user?.role);
  const { events, isLoading: isLoadingEvents } = useEvents();
  const { athletes, currentAthlete } = useAthletes();
  const { 
    confirmations, 
    isLoading: isLoadingConfirmations,
    getConfirmationsForEvent,
    getAthleteConfirmation,
    canConfirm,
    getHoursUntilDeadline,
    upsertConfirmation,
    CONFIRMATION_DEADLINE_HOURS
  } = useTrainingConfirmations();

  // Get only training events that are in the future or today, filtered by athlete gender (limit to next 5)
  const upcomingTrainings = useMemo(() => {
    const athleteGender = currentAthlete?.gender;
    
    return events
      .filter(event => {
        const eventDate = new Date(event.start_datetime);
        const isFutureOrToday = event.event_type === 'training' && 
               (isFuture(eventDate) || isToday(eventDate));
        
        if (!isFutureOrToday) return false;
        
        // Filter by gender if athlete (admins see all)
        if (isAdmin || !athleteGender) return true;
        
        return event.gender === 'both' || event.gender === athleteGender;
      })
      .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
      .slice(0, 5); // Limit to next 5 trainings after filtering
  }, [events, currentAthlete, isAdmin]);

  // Use upcomingTrainings directly (gender filter already applied)
  const filteredTrainings = upcomingTrainings;

  // Calculate stats for reports
  const confirmationStats = useMemo(() => {
    const athleteStats = athletes.map(athlete => {
      const athleteConfirmations = confirmations.filter(c => c.athlete_id === athlete.id);
      const confirmed = athleteConfirmations.filter(c => c.status === 'confirmed').length;
      const declined = athleteConfirmations.filter(c => c.status === 'declined').length;
      return {
        athlete,
        confirmed,
        declined,
        total: confirmed + declined,
      };
    });

    return athleteStats.sort((a, b) => b.confirmed - a.confirmed);
  }, [athletes, confirmations]);

  if (isLoadingEvents || isLoadingConfirmations) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title={isAdmin ? "Relatório de Confirmações" : "Confirmação de Presença"}
        description={isAdmin ? "Visualize as confirmações de presença dos atletas" : "Confirme sua participação nos próximos treinos"}
      />

      <Tabs defaultValue={isAdmin ? "overview" : "confirm"} className="space-y-4">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2' : 'grid-cols-2'} h-auto`}>
          {!isAdmin && (
            <TabsTrigger value="confirm" className="flex items-center gap-1.5 text-xs py-2">
              <CalendarCheck className="h-4 w-4" />
              <span>Confirmar</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs py-2">
            <Users className="h-4 w-4" />
            <span>Geral</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="reports" className="flex items-center gap-1.5 text-xs py-2">
              <BarChart3 className="h-4 w-4" />
              <span>Relatórios</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Confirm Presence Tab - Only for Athletes */}
        {!isAdmin && (
          <TabsContent value="confirm">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarCheck className="h-5 w-5" />
                  Próximos Treinos
                </CardTitle>
                <CardDescription className="text-xs">
                  Confirme até 23:59h do dia anterior do treino
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!currentAthlete?.id ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Perfil de atleta não encontrado.</p>
                    <p className="text-xs">Entre em contato com o administrador.</p>
                  </div>
                ) : filteredTrainings.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum treino agendado.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredTrainings.map(event => (
                    <TrainingConfirmationCard
                      key={event.id}
                      event={event}
                      athleteId={currentAthlete.id}
                      confirmation={getAthleteConfirmation(event.id, currentAthlete.id)}
                      canConfirm={canConfirm(event.start_datetime)}
                      hoursUntilDeadline={getHoursUntilDeadline(event.start_datetime)}
                      onConfirm={(status) => upsertConfirmation.mutate({
                        eventId: event.id,
                        athleteId: currentAthlete.id,
                        status,
                        eventStartDatetime: event.start_datetime,
                      })}
                      isLoading={upsertConfirmation.isPending}
                    />
                  ))}
                </div>
              )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                Confirmações por Treino
              </CardTitle>
              <CardDescription className="text-xs">
                {isAdmin 
                  ? "Próximos 5 treinos com status de confirmação"
                  : "Seus próximos treinos"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(isAdmin ? upcomingTrainings : filteredTrainings).length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum treino agendado.</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {(isAdmin ? upcomingTrainings : filteredTrainings).map(event => {
                    const { confirmed, declined, confirmations: eventConfirmations } = getConfirmationsForEvent(event.id);
                    const eventDate = new Date(event.start_datetime);
                    const isDeadlinePassed = !canConfirm(event.start_datetime);
                    
                    // Filter athletes by gender for this event
                    const eligibleAthletes = athletes.filter(a => 
                      event.gender === 'both' || a.gender === event.gender
                    );
                    const totalEligible = eligibleAthletes.length;
                    const noResponse = totalEligible - confirmed - declined;
                    const confirmationRate = totalEligible > 0 ? (confirmed / totalEligible) * 100 : 0;

                    // Get athletes by status
                    const confirmedAthletes = eventConfirmations.filter(c => c.status === 'confirmed');
                    const declinedAthletes = eventConfirmations.filter(c => c.status === 'declined');
                    const respondedAthleteIds = new Set(eventConfirmations.map(c => c.athlete_id));
                    const noResponseAthletes = eligibleAthletes.filter(a => !respondedAthleteIds.has(a.id));

                    return (
                      <div 
                        key={event.id} 
                        className="p-3 border rounded-xl bg-card space-y-2.5"
                      >
                        {/* Header - More compact for mobile */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm leading-tight line-clamp-2">{event.name}</h3>
                              <div className="flex flex-col gap-0.5 mt-1">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  <span>{format(eventDate, "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{event.location}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              {isDeadlinePassed ? (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">Encerrado</Badge>
                              ) : (
                                <Badge variant="outline" className="border-primary text-primary text-[10px] px-1.5 py-0.5">
                                  Aberto
                                </Badge>
                              )}
                              <Badge className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5">
                                {event.gender === 'male' ? 'Masc' : event.gender === 'female' ? 'Fem' : 'Misto'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Progress - More compact */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Confirmados: <strong className="text-primary">{confirmed}</strong>/{totalEligible}</span>
                            <span className="text-muted-foreground">{Math.round(confirmationRate)}%</span>
                          </div>
                          <Progress value={confirmationRate} className="h-1.5" />
                        </div>

                        {/* Quick Stats - More compact and mobile-friendly */}
                        <div className="flex gap-4 text-xs justify-center sm:justify-start">
                          <span className="flex items-center gap-1 text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="font-medium">{confirmed}</span>
                          </span>
                          <span className="flex items-center gap-1 text-destructive">
                            <XCircle className="h-3.5 w-3.5" />
                            <span className="font-medium">{declined}</span>
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MinusCircle className="h-3.5 w-3.5" />
                            <span className="font-medium">{noResponse}</span>
                          </span>
                        </div>

                        {/* Athletes by Status - Smart Layout (Modal for long lists) */}
                        <div className="space-y-2 pt-2 border-t border-border">
                          <CollapsibleAthleteList
                            title="Confirmados"
                            icon={<CheckCircle2 className="h-3 w-3 text-success" />}
                            athletes={confirmedAthletes.map(c => ({
                              id: c.id,
                              name: c.athlete?.name || 'Atleta'
                            }))}
                            badgeVariant="confirmed"
                            initialCollapsed={confirmedAthletes.length > 6}
                            maxVisibleInPreview={6}
                            useModal={confirmedAthletes.length > 8}
                          />
                          
                          <CollapsibleAthleteList
                            title="Ausentes"
                            icon={<XCircle className="h-3 w-3 text-destructive" />}
                            athletes={declinedAthletes.map(c => ({
                              id: c.id,
                              name: c.athlete?.name || 'Atleta'
                            }))}
                            badgeVariant="declined"
                            initialCollapsed={declinedAthletes.length > 4}
                            maxVisibleInPreview={4}
                            useModal={declinedAthletes.length > 6}
                          />
                          
                          <CollapsibleAthleteList
                            title="Sem resposta"
                            icon={<MinusCircle className="h-3 w-3" />}
                            athletes={noResponseAthletes.map(a => ({
                              id: a.id,
                              name: a.name
                            }))}
                            badgeVariant="no-response"
                            initialCollapsed={noResponseAthletes.length > 4}
                            maxVisibleInPreview={4}
                            useModal={noResponseAthletes.length > 6}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="reports">
            <ConfirmationReportCard 
              confirmationStats={confirmationStats}
              confirmations={confirmations}
              events={events}
              athletes={athletes}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
