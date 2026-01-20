import { useMemo } from 'react';
import { BarChart3, TrendingUp, Users, CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmationWithDetails } from '@/hooks/useTrainingConfirmations';
import { Database } from '@/integrations/supabase/types';

type Athlete = Database['public']['Tables']['athletes']['Row'];
type Event = Database['public']['Tables']['events']['Row'];

interface AthleteStats {
  athlete: Athlete;
  confirmed: number;
  declined: number;
  total: number;
}

interface ConfirmationReportCardProps {
  confirmationStats: AthleteStats[];
  confirmations: ConfirmationWithDetails[];
  events: Event[];
}

export function ConfirmationReportCard({
  confirmationStats,
  confirmations,
  events,
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Confirmações</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              {overallStats.totalConfirmed}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Ausências</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              {overallStats.totalDeclined}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Confirmação</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              {overallStats.averageConfirmationRate}%
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Treinos Cadastrados</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {overallStats.trainingEvents}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Athletes Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ranking de Confirmações
          </CardTitle>
          <CardDescription>
            Taxa de confirmação por atleta (baseado nas respostas enviadas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topConfirmers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma confirmação registrada ainda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atleta</TableHead>
                  <TableHead className="text-center">Confirmados</TableHead>
                  <TableHead className="text-center">Ausências</TableHead>
                  <TableHead>Taxa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topConfirmers.map((stat, index) => {
                  const rate = stat.total > 0 
                    ? Math.round((stat.confirmed / stat.total) * 100) 
                    : 0;
                  
                  return (
                    <TableRow key={stat.athlete.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {index < 3 && (
                            <Badge 
                              variant="secondary" 
                              className={
                                index === 0 
                                  ? 'bg-warning/20 text-warning' 
                                  : index === 1 
                                  ? 'bg-muted text-muted-foreground'
                                  : 'bg-accent/20 text-accent-foreground'
                              }
                            >
                              #{index + 1}
                            </Badge>
                          )}
                          {stat.athlete.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="secondary" 
                          className="bg-success/10 text-success"
                        >
                          {stat.confirmed}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="secondary" 
                          className="bg-destructive/10 text-destructive"
                        >
                          {stat.declined}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={rate} className="w-16 h-2" />
                          <span className="text-sm text-muted-foreground w-10">
                            {rate}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
