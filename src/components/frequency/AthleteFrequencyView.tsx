import { useMemo } from 'react';
import { Database } from '@/integrations/supabase/types';
import { calculateFrequencyStats } from '@/lib/frequencyUtils';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { formatDateFullBR, parseUTCDate } from '@/lib/dateUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type Athlete = Database['public']['Tables']['athletes']['Row'];
type Event = Database['public']['Tables']['events']['Row'];
type Attendance = Database['public']['Tables']['attendances']['Row'];

interface AthleteFrequencyViewProps {
  athlete: Athlete;
  events: Event[];
  attendances: Attendance[];
}

export function AthleteFrequencyView({ athlete, events, attendances }: AthleteFrequencyViewProps) {
  const stats = useMemo(() => 
    calculateFrequencyStats(athlete, events, attendances),
    [athlete, events, attendances]
  );

  // Get all training events sorted by date (most recent first)
  const trainingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(e => {
        // Only training events
        if (e.event_type !== 'training') return false;
        
        // Only past trainings (already happened)
        const eventDate = parseUTCDate(e.start_datetime);
        if (eventDate > now) return false;
        
        // Filter by athlete gender
        return e.gender === 'both' || e.gender === athlete.gender;
      })
      .sort((a, b) => parseUTCDate(b.start_datetime).getTime() - parseUTCDate(a.start_datetime).getTime());
  }, [events, athlete.gender]);

  // Get attendance status for each training
  const trainingWithStatus = useMemo(() => {
    return trainingEvents.map(event => {
      const attendance = attendances.find(a => a.event_id === event.id && a.athlete_id === athlete.id);
      return {
        event,
        status: attendance?.status || 'absent',
      };
    });
  }, [trainingEvents, attendances, athlete.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'justified':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      default:
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'Presente';
      case 'justified':
        return 'Justificado';
      default:
        return 'Falta';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-success/10 text-success border-success/20';
      case 'justified':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-destructive/10 text-destructive border-destructive/20';
    }
  };

  const tier = stats.tier;
  
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className={cn(
        "p-6 rounded-xl border-2",
        tier.bgColor,
        `border-${tier.color.replace('bg-', '')}`
      )}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Taxa de Presença</p>
            <p className="text-4xl font-bold text-foreground">{stats.attendanceRate}%</p>
            <p className={cn("text-sm font-medium mt-1", tier.textColor)}>
              Faixa {tier.tier} • {tier.status}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Pontuação</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalPoints.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-1">de {stats.adjustedGoal} meta</p>
          </div>
        </div>
        
        <Progress 
          value={Math.min(100, stats.attendanceRate)} 
          className={cn("h-2", `[&>div]:${tier.color}`)}
        />

        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50">
          <div className="text-center">
            <p className="text-xl font-bold text-success">{stats.principalAttended}</p>
            <p className="text-xs text-muted-foreground">Presenças</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-destructive">{stats.principalMissed}</p>
            <p className="text-xs text-muted-foreground">Faltas</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-warning">{stats.principalJustified}</p>
            <p className="text-xs text-muted-foreground">Justificadas</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-primary">{stats.extraAttended}</p>
            <p className="text-xs text-muted-foreground">Extras</p>
          </div>
        </div>
      </div>

      {/* Training History Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Histórico de Treinos</h3>
            <Badge variant="secondary" className="ml-auto">
              {trainingWithStatus.length} treino{trainingWithStatus.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {trainingWithStatus.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum treino registrado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Data</TableHead>
                  <TableHead>Treino</TableHead>
                  <TableHead className="text-center w-[100px]">Tipo</TableHead>
                  <TableHead className="text-center w-[140px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainingWithStatus.map(({ event, status }) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {formatDateFullBR(parseUTCDate(event.start_datetime))}
                    </TableCell>
                    <TableCell>{event.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          event.training_type === 'extra' 
                            ? "border-primary/50 text-primary bg-primary/5" 
                            : "border-border"
                        )}
                      >
                        {event.training_type === 'principal' ? 'Principal' : 'Extra'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <div className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
                          getStatusColor(status)
                        )}>
                          {getStatusIcon(status)}
                          <span className="text-sm font-medium">
                            {getStatusLabel(status)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
