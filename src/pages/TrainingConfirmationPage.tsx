import { useState, useMemo } from 'react';
import { format, isFuture, addHours, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CalendarCheck, 
  Users, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  BarChart3
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function TrainingConfirmationPage() {
  const { isAdmin, user } = useAuth();
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

  // Get only training events that are in the future or today
  const upcomingTrainings = useMemo(() => {
    return events
      .filter(event => {
        const eventDate = new Date(event.start_datetime);
        return event.event_type === 'training' && 
               (isFuture(eventDate) || isToday(eventDate));
      })
      .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
  }, [events]);

  // Filter trainings based on athlete gender
  const filteredTrainings = useMemo(() => {
    const athleteGender = currentAthlete?.gender;
    if (!athleteGender) return upcomingTrainings;
    
    return upcomingTrainings.filter(event => 
      event.gender === 'both' || event.gender === athleteGender
    );
  }, [upcomingTrainings, currentAthlete]);

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

      <Tabs defaultValue={isAdmin ? "overview" : "confirm"} className="space-y-4 sm:space-y-6">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2' : 'grid-cols-2'} h-auto`}>
          {!isAdmin && (
            <TabsTrigger value="confirm" className="flex-col sm:flex-row gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <CalendarCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Confirmar Presença</span>
              <span className="sm:hidden">Confirmar</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="overview" className="flex-col sm:flex-row gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="sm:hidden">Geral</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="reports" className="flex-col sm:flex-row gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
              <span className="sm:hidden">Relatórios</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Confirm Presence Tab - Only for Athletes */}
        {!isAdmin && (
          <TabsContent value="confirm">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5" />
                  Próximos Treinos
                </CardTitle>
                <CardDescription>
                  Confirme sua presença até {CONFIRMATION_DEADLINE_HOURS}h antes do treino
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!currentAthlete?.id ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Seu perfil de atleta não foi encontrado.</p>
                    <p className="text-sm">Entre em contato com o administrador.</p>
                  </div>
                ) : filteredTrainings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum treino agendado.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Confirmações por Treino
              </CardTitle>
              <CardDescription>
                {isAdmin 
                  ? "Visualize quantos atletas confirmaram presença em cada treino"
                  : "Seus treinos e confirmações"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(isAdmin ? upcomingTrainings : filteredTrainings).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum treino agendado.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(isAdmin ? upcomingTrainings : filteredTrainings).map(event => {
                    const { confirmed, declined, confirmations: eventConfirmations } = getConfirmationsForEvent(event.id);
                    const eventDate = new Date(event.start_datetime);
                    const isDeadlinePassed = !canConfirm(event.start_datetime);
                    
                    // Filter athletes by gender for this event
                    const eligibleAthletes = athletes.filter(a => 
                      event.gender === 'both' || a.gender === event.gender
                    );
                    const totalEligible = eligibleAthletes.length;
                    const confirmationRate = totalEligible > 0 ? (confirmed / totalEligible) * 100 : 0;

                    return (
                      <div 
                        key={event.id} 
                        className="p-4 border rounded-lg bg-card space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="font-medium">{event.name}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(eventDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isDeadlinePassed ? (
                              <Badge variant="secondary">Prazo encerrado</Badge>
                            ) : (
                              <Badge variant="outline" className="border-primary text-primary">
                                Confirmações abertas
                              </Badge>
                            )}
                            <Badge className="bg-muted text-muted-foreground">
                              {event.gender === 'male' ? 'Masc' : event.gender === 'female' ? 'Fem' : 'Misto'}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Confirmados: <strong className="text-primary">{confirmed}</strong> / {totalEligible}</span>
                            <span className="text-muted-foreground">{Math.round(confirmationRate)}%</span>
                          </div>
                          <Progress value={confirmationRate} className="h-2" />
                        </div>

                        <div className="flex gap-4 text-sm">
                          <span className="flex items-center gap-1 text-success">
                            <CheckCircle2 className="h-4 w-4" />
                            {confirmed} confirmados
                          </span>
                          <span className="flex items-center gap-1 text-destructive">
                            <XCircle className="h-4 w-4" />
                            {declined} ausências
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            {totalEligible - confirmed - declined} sem resposta
                          </span>
                        </div>

                        {/* Show confirmed athletes */}
                        {confirmed > 0 && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Atletas confirmados:</p>
                            <div className="flex flex-wrap gap-1">
                              {eventConfirmations
                                .filter(c => c.status === 'confirmed')
                                .map(c => (
                                  <Badge 
                                    key={c.id} 
                                    variant="secondary" 
                                    className="text-xs bg-success/10 text-success"
                                  >
                                    {c.athlete?.name}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )}
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
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
