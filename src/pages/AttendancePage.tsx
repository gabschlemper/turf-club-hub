import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { mockEvents, mockAttendances, mockAthletes } from '@/data/mockData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle, ChevronDown } from 'lucide-react';

export function AttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'justified':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'Presente';
      case 'absent':
        return 'Ausente';
      case 'justified':
        return 'Justificado';
      default:
        return '-';
    }
  };

  // For athletes: show their own attendance
  const athleteAttendance = mockAttendances
    .filter(a => a.athleteId === user?.id)
    .map(attendance => {
      const event = mockEvents.find(e => e.id === attendance.eventId);
      return { ...attendance, event };
    })
    .filter(a => a.event);

  // For admins: show all events with attendance management
  const pastEvents = mockEvents.filter(e => e.date < new Date());

  if (!isAdmin) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Minha Presença"
          description="Histórico de participação nos eventos"
        />

        <div className="space-y-3">
          {athleteAttendance.length > 0 ? (
            athleteAttendance.map(({ id, status, event }) => (
              <div 
                key={id}
                className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-2 h-12 rounded-full",
                    event?.type === 'training' && "bg-primary",
                    event?.type === 'game' && "bg-success",
                    event?.type === 'meeting' && "bg-warning"
                  )} />
                  <div>
                    <p className="font-medium text-foreground">{event?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event && format(event.date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span className={cn(
                    "text-sm font-medium",
                    status === 'present' && "text-success",
                    status === 'absent' && "text-destructive",
                    status === 'justified' && "text-warning"
                  )}>
                    {getStatusLabel(status)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 rounded-xl bg-card border border-border text-center">
              <p className="text-muted-foreground">Nenhum registro de presença encontrado</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Controle de Presença"
        description="Gerencie a presença dos atletas nos eventos"
      />

      <div className="space-y-4">
        {pastEvents.map(event => {
          const eventAttendances = mockAttendances.filter(a => a.eventId === event.id);
          const presentCount = eventAttendances.filter(a => a.status === 'present').length;
          const isExpanded = selectedEvent === event.id;

          return (
            <div key={event.id} className="rounded-xl bg-card border border-border overflow-hidden">
              <button
                onClick={() => setSelectedEvent(isExpanded ? null : event.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-2 h-12 rounded-full",
                    event.type === 'training' && "bg-primary",
                    event.type === 'game' && "bg-success",
                    event.type === 'meeting' && "bg-warning"
                  )} />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(event.date, "d 'de' MMMM", { locale: ptBR })} - {presentCount} presentes
                    </p>
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
                    {mockAthletes.map(athlete => {
                      const attendance = eventAttendances.find(a => a.athleteId === athlete.id);
                      
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
                            <span className="text-sm font-medium">{athlete.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={attendance?.status === 'present' ? 'default' : 'outline'}
                              className="h-8 w-8 p-0"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={attendance?.status === 'absent' ? 'destructive' : 'outline'}
                              className="h-8 w-8 p-0"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={attendance?.status === 'justified' ? 'secondary' : 'outline'}
                              className="h-8 w-8 p-0"
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
        })}
      </div>
    </div>
  );
}
