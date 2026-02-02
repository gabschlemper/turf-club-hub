import { useMemo } from 'react';
import { calculateFrequencyStats, getMotivationalMessage } from '@/lib/frequencyUtils';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { formatDateFullBR, parseUTCDate } from '@/lib/dateUtils';
import { Badge } from '@/components/ui/badge';

interface AthleteFrequencyViewProps {
  athlete: any;
  events: any[];
  attendances: any[];
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
        return <CheckCircle className="w-3.5 h-3.5 text-success" />;
      case 'justified':
        return <AlertCircle className="w-3.5 h-3.5 text-warning" />;
      default:
        return <XCircle className="w-3.5 h-3.5 text-destructive" />;
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
  const motivationalMessage = getMotivationalMessage(tier.tier);
  
  return (
    <div className="space-y-4">
      {/* Summary Card - Mobile optimized */}
      <div className={cn(
        "p-4 rounded-xl border-2",
        tier.bgColor,
        "border-current"
      )} style={{ borderColor: tier.color.replace('bg-', '') }}>
        {/* Main stats row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Taxa de Presença</p>
            <p className="text-3xl sm:text-4xl font-bold text-foreground">{stats.attendanceRate}%</p>
            <p className={cn("text-xs font-medium mt-0.5", tier.textColor)}>
              Faixa {tier.tier} • {tier.status}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Pontuação</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalPoints.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">de {stats.adjustedGoal} meta</p>
          </div>
        </div>
        
        <Progress 
          value={Math.min(100, stats.attendanceRate)} 
          className="h-2 mb-3"
        />

        {/* Motivational message */}
        <p className="text-xs text-muted-foreground text-center py-2 border-t border-border/50">
          {motivationalMessage}
        </p>

        {/* Stats grid - 4 columns */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border/50">
          <div className="text-center">
            <p className="text-lg font-bold text-success">{stats.principalAttended}</p>
            <p className="text-[10px] text-muted-foreground">Presenças</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-destructive">{stats.principalMissed}</p>
            <p className="text-[10px] text-muted-foreground">Faltas</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-warning">{stats.principalJustified}</p>
            <p className="text-[10px] text-muted-foreground">Justif.</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{stats.extraAttended}</p>
            <p className="text-[10px] text-muted-foreground">Extras</p>
          </div>
        </div>
      </div>

      {/* Category Info Card */}
      <div className="p-3 rounded-xl bg-card border border-border">
        <p className="text-xs text-muted-foreground mb-1">Sua Categoria</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm text-foreground">
              {stats.categoryInfo.code} - {stats.categoryInfo.name}
            </p>
            <p className="text-xs text-muted-foreground">{stats.categoryInfo.goalDescription}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Meta: {stats.adjustedGoal}pts
          </Badge>
        </div>
      </div>

      {/* Training History - Mobile optimized cards */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="p-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Histórico</h3>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {trainingWithStatus.length} treinos
            </Badge>
          </div>
        </div>

        {trainingWithStatus.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum treino registrado ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {trainingWithStatus.map(({ event, status }) => (
              <div 
                key={event.id} 
                className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.name}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span>{formatDateFullBR(parseUTCDate(event.start_datetime))}</span>
                    <span>•</span>
                    <span className={cn(
                      "px-1 py-0.5 rounded",
                      event.training_type === 'extra' 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted"
                    )}>
                      {event.training_type === 'principal' ? 'Principal' : 'Extra'}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg border ml-2",
                  getStatusColor(status)
                )}>
                  {getStatusIcon(status)}
                  <span className="text-xs font-medium">
                    {getStatusLabel(status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
