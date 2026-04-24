import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDateFullBR, parseUTCDate } from '@/lib/dateUtils';
import { FrequencyStats } from '@/lib/frequencyUtils';

interface AthleteFrequencyDetailProps {
  athlete: any;
  events: any[];
  attendances: any[];
  stats: FrequencyStats;
}

export function AthleteFrequencyDetail({ athlete, events, attendances, stats }: AthleteFrequencyDetailProps) {
  const trainingWithStatus = useMemo(() => {
    const now = new Date();
    return events
      .filter(e => {
        if (e.event_type !== 'training') return false;
        if (parseUTCDate(e.start_datetime) > now) return false;
        return e.gender === 'both' || e.gender === athlete.gender;
      })
      .sort((a, b) => parseUTCDate(b.start_datetime).getTime() - parseUTCDate(a.start_datetime).getTime())
      .map(event => {
        const attendance = attendances.find(a => a.event_id === event.id && a.athlete_id === athlete.id);
        return {
          event,
          status: attendance?.status ?? 'unmarked',
        };
      });
  }, [events, attendances, athlete]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case 'justified': return <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />;
      case 'absent': return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      default: return <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Presente';
      case 'justified': return 'Justificado';
      case 'absent': return 'Falta';
      default: return 'Não marcada';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'justified': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'absent': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  return (
    <div className="px-3 pb-3 space-y-3 animate-fade-in">
      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-2 p-2 rounded-lg bg-muted/50">
        <div className="text-center">
          <p className="text-sm font-bold text-emerald-500">{stats.principalAttended}</p>
          <p className="text-[10px] text-muted-foreground">Presenças</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-red-500">{stats.principalMissed}</p>
          <p className="text-[10px] text-muted-foreground">Faltas</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-yellow-500">{stats.principalJustified}</p>
          <p className="text-[10px] text-muted-foreground">Justif.</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-primary">{stats.extraAttended}</p>
          <p className="text-[10px] text-muted-foreground">Extras</p>
        </div>
      </div>

      {/* Training list */}
      <div className="rounded-lg border border-border overflow-hidden max-h-[300px] overflow-y-auto">
        {trainingWithStatus.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">Nenhum treino registrado.</p>
        ) : (
          <div className="divide-y divide-border">
            {trainingWithStatus.map(({ event, status }) => (
              <div key={event.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{event.name}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span>{formatDateFullBR(parseUTCDate(event.start_datetime))}</span>
                    <span>•</span>
                    <span className={cn(
                      "px-1 py-0.5 rounded",
                      event.training_type === 'extra' ? "bg-primary/10 text-primary" : "bg-muted"
                    )}>
                      {event.training_type === 'principal' ? 'Principal' : 'Extra'}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-md border ml-2 text-[10px] font-medium",
                  getStatusColor(status)
                )}>
                  {getStatusIcon(status)}
                  {getStatusLabel(status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
