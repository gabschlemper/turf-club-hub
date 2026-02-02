import { useMemo } from 'react';
import { BarChart3, TrendingUp, Users, CalendarCheck, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ConfirmationWithDetails } from '@/hooks/useTrainingConfirmations';
import { cn } from '@/lib/utils';

interface AthleteStats {
  athlete: any;
  confirmed: number;
  declined: number;
  total: number;
}

interface ConfirmationReportCardProps {
  confirmationStats: AthleteStats[];
  confirmations: ConfirmationWithDetails[];
  events: any[];
  athletes: any[];
}

export function ConfirmationReportCard({
  confirmationStats,
  confirmations,
  events,
  athletes,
}: ConfirmationReportCardProps) {
  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalConfirmed = confirmations.filter(c => c.status === 'confirmed').length;
    const totalDeclined = confirmations.filter(c => c.status === 'declined').length;
    const totalResponses = totalConfirmed + totalDeclined;
    const trainingEvents = events.filter(e => e.event_type === 'training').length;

    return {
      totalConfirmed,
      totalDeclined,
      totalResponses,
      trainingEvents,
      averageConfirmationRate: totalResponses > 0 
        ? Math.round((totalConfirmed / totalResponses) * 100) 
        : 0,
    };
  }, [confirmations, events]);

  // Get top confirmers
  const topConfirmers = useMemo(() => {
    return confirmationStats
      .filter(s => s.total > 0)
      .sort((a, b) => {
        const rateA = a.total > 0 ? a.confirmed / a.total : 0;
        const rateB = b.total > 0 ? b.confirmed / b.total : 0;
        return rateB - rateA;
      })
      .slice(0, 10);
  }, [confirmationStats]);

  // Athletes who never responded
  const noResponseAthletes = useMemo(() => {
    return confirmationStats.filter(s => s.total === 0);
  }, [confirmationStats]);

  return (
    <div className="space-y-4">
      {/* Summary Cards - Mobile grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-4">
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">Confirmados</span>
          </div>
          <p className="text-xl font-bold text-success">{overallStats.totalConfirmed}</p>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Ausências</span>
          </div>
          <p className="text-xl font-bold text-destructive">{overallStats.totalDeclined}</p>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Taxa</span>
          </div>
          <p className="text-xl font-bold text-primary">{overallStats.averageConfirmationRate}%</p>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Treinos</span>
          </div>
          <p className="text-xl font-bold">{overallStats.trainingEvents}</p>
        </Card>
      </div>

      {/* Athletes Ranking */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Ranking de Confirmações
          </CardTitle>
          <CardDescription className="text-xs">
            Taxa de confirmação por atleta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topConfirmers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma confirmação registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topConfirmers.map((stat, index) => {
                const rate = stat.total > 0 
                  ? Math.round((stat.confirmed / stat.total) * 100) 
                  : 0;
                
                return (
                  <div 
                    key={stat.athlete.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {index < 3 && (
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                          index === 0 && "bg-warning/20 text-warning",
                          index === 1 && "bg-muted text-muted-foreground",
                          index === 2 && "bg-accent/20 text-accent-foreground"
                        )}>
                          {index + 1}
                        </div>
                      )}
                      <span className="font-medium text-sm text-foreground truncate">
                        {stat.athlete.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs">
                        <Badge variant="secondary" className="bg-success/10 text-success text-[10px] px-1.5">
                          {stat.confirmed}
                        </Badge>
                        <Badge variant="secondary" className="bg-destructive/10 text-destructive text-[10px] px-1.5">
                          {stat.declined}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 w-16">
                        <Progress value={rate} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground w-6 text-right">
                          {rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Athletes without any response */}
      {noResponseAthletes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MinusCircle className="h-5 w-5 text-muted-foreground" />
              Sem Resposta ({noResponseAthletes.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Atletas que nunca confirmaram ou declinaram
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {noResponseAthletes.map(stat => (
                <Badge 
                  key={stat.athlete.id} 
                  variant="outline" 
                  className="text-xs"
                >
                  {stat.athlete.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
