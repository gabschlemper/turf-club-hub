import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { useEvents } from '@/hooks/useEvents';
import { useAthletes } from '@/hooks/useAthletes';
import { useAttendances } from '@/hooks/useAttendances';
import { Loader2 } from 'lucide-react';
import { AthleteFrequencyView } from '@/components/frequency/AthleteFrequencyView';
import { AdminFrequencyView } from '@/components/frequency/AdminFrequencyView';
import { isAdminRole, isCoach } from '@/lib/permissions';

export function FrequencyPage() {
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);
  const showAdminView = isAdmin || isCoach(user?.role);

  const { events, isLoading: eventsLoading } = useEvents();
  const { athletes, currentAthlete, isLoading: athletesLoading } = useAthletes();
  const { attendances, isLoading: attendancesLoading } = useAttendances();

  const isLoading = eventsLoading || athletesLoading || attendancesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!showAdminView && currentAthlete) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Minha Frequência"
          description="Acompanhe sua pontuação e frequência nos treinos"
        />
        <AthleteFrequencyView
          athlete={currentAthlete}
          events={events}
          attendances={attendances}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Frequência dos Atletas"
        description="Visão geral da frequência e comprometimento do time"
      />
      <AdminFrequencyView
        athletes={athletes}
        events={events}
        attendances={attendances}
      />
    </div>
  );
}
